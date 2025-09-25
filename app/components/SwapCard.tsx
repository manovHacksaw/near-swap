"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, ArrowDown, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNetwork } from "./WalletProvider";
import { QuoteRequest, TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";
import TokenSelector from "./TokenSelector";
import { getContractAddresses, isIntentsAvailable } from "../lib/contracts";

interface SwapCardProps {
  tokens: TokenResponse[];
  onSwapComplete?: () => void;
}

export default function SwapCard({ tokens, onSwapComplete }: SwapCardProps) {
  const { signedAccountId, callFunction, signAndSendTransactions } = useWalletSelector();
  const { network } = useNetwork();
  const [fromToken, setFromToken] = useState<TokenResponse | null>(null);
  const [toToken, setToToken] = useState<TokenResponse | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const contracts = getContractAddresses(network);
  const intentsAvailable = isIntentsAvailable(network);

  // Filter tokens for NEAR Intents (depositType: INTENTS)
  const intentsTokens = tokens.filter(token => 
    token.assetId.includes("nep141:") && 
    token.blockchain?.toLowerCase().includes("near")
  );

  // Debug: Log available tokens
  useEffect(() => {
    if (tokens.length > 0) {
      console.log('Available tokens:', tokens.map(t => ({ assetId: t.assetId, symbol: t.symbol, blockchain: t.blockchain })));
      console.log('Filtered intents tokens:', intentsTokens.map(t => ({ assetId: t.assetId, symbol: t.symbol, blockchain: t.blockchain })));
    }
  }, [tokens, intentsTokens]);

  useEffect(() => {
    if (signedAccountId && fromToken) {
      loadBalance();
    }
  }, [signedAccountId, fromToken]);

  useEffect(() => {
    if (fromToken && toToken && amount && parseFloat(amount) > 0 && signedAccountId) {
      getSwapQuote();
    } else {
      setQuote(null);
    }
  }, [fromToken, toToken, amount, signedAccountId]);

  const loadBalance = async () => {
    if (!signedAccountId || !fromToken) return;
    try {
      const tokenBalance = await callFunction({
        contractId: contracts.intents,
        method: "mt_balance_of",
        args: {
          token_id: fromToken.assetId,
          account_id: signedAccountId,
        },
      });
      setBalance(BigInt(tokenBalance as string));
    } catch (err) {
      console.error("Failed to load balance:", err);
      setBalance(BigInt(0));
    }
  };

  const getSwapQuote = async () => {
    if (!fromToken || !toToken || !amount || !signedAccountId) return;

    setIsGettingQuote(true);
    setError(null);

    try {
      // Validate inputs
      if (parseFloat(amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      if (!fromToken.assetId || !toToken.assetId) {
        throw new Error('Invalid token selection');
      }
      
      if (!signedAccountId || signedAccountId.length < 3) {
        throw new Error('Invalid account ID');
      }

      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + 5);

      const amountInUnits = (BigInt(Math.floor(parseFloat(amount) * Math.pow(10, fromToken.decimals)))).toString();
      
      const quoteRequest: QuoteRequest = {
        dry: false,
        depositMode: QuoteRequest.depositMode.SIMPLE, // Most chains support SIMPLE, some like Stellar require MEMO
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: 100, // 1% (100 basis points) as per docs
        depositType: QuoteRequest.depositType.INTENTS,
        originAsset: fromToken.assetId,
        destinationAsset: toToken.assetId,
        amount: amountInUnits,
        refundTo: signedAccountId,
        refundType: QuoteRequest.refundType.INTENTS,
        recipient: signedAccountId,
        recipientType: QuoteRequest.recipientType.INTENTS,
        deadline: deadline.toISOString(),
      };
      console.log('Quote request being sent:', JSON.stringify(quoteRequest, null, 2));
      console.log('From token:', fromToken);
      console.log('To token:', toToken);
      console.log('Amount:', amount);
      console.log('Amount in units (corrected):', amountInUnits);

      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quote API error response:', errorData);
        
        // Handle specific error cases
        if (response.status === 500 && errorData.error?.includes('token')) {
          throw new Error('API authentication failed. Please check if the 1Click API token is properly configured.');
        } else if (response.status === 400) {
          // Show the actual error message from the API response
          if (errorData.body?.message) {
            // Check for specific validation errors and format them nicely
            if (errorData.body.message.includes('Amount is too low')) {
              const minAmount = errorData.body.message.match(/try at least (\d+)/)?.[1];
              if (minAmount && fromToken) {
                const minAmountFormatted = (Number(minAmount) / Math.pow(10, fromToken.decimals)).toFixed(6);
                throw new Error(`Amount too low. Minimum required: ${minAmountFormatted} ${fromToken.symbol}`);
              }
            }
            // For other specific error messages, show them as-is
            throw new Error(errorData.body.message);
          }
          throw new Error('Invalid request parameters. Please check your token selection and amounts.');
        } else if (response.status === 401) {
          throw new Error('Unauthorized access. Please check your API token configuration.');
        } else {
          // Show the actual error message if available, otherwise fall back to generic message
          const errorMessage = errorData.body?.message || errorData.error || `HTTP ${response.status}: Failed to get quote`;
          throw new Error(errorMessage);
        }
      }

      const { quote: quoteResult } = await response.json();
      console.log('Quote response:', quoteResult);
      setQuote(quoteResult);
    } catch (err) {
      console.error("Failed to get quote:", err);
      setQuote(null);
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setIsGettingQuote(false);
    }
  };

  const handleSwap = async () => {
    if (!signedAccountId || !fromToken || !quote) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);

    try {
      if (!intentsAvailable) {
        throw new Error(`NEAR Intents is not available on ${network}. Please switch to mainnet to use this feature.`);
      }

      // Step 1: Transfer tokens to the deposit address
      setLoadingStep("Step 1: Transferring tokens to deposit address...");
      let result;
      try {
        result = await signAndSendTransactions({
          transactions: [
            {
              signerId: signedAccountId,
              receiverId: contracts.intents!,
              actions: [
                {
                  type: "FunctionCall",
                  params: {
                    methodName: "mt_transfer",
                    args: {
                      token_id: fromToken.assetId,
                      receiver_id: quote.depositAddress,
                      amount: quote.amountIn,
                    },
                    gas: "30000000000000",
                    deposit: "1",
                  },
                },
              ],
            },
          ],
        });
      } catch (popupError: any) {
        // If popup fails, provide helpful error message
        if (popupError.message?.includes("popup") || popupError.message?.includes("window")) {
          throw new Error("Popup window was blocked. Please allow popups for this site and try again.");
        }
        throw popupError;
      }
      
      const txHash = result[0].transaction.hash;
      setTxHash(txHash);
      
      // Step 2: Submit deposit transaction to speed up processing (optional but recommended)
      setLoadingStep("Step 2: Notifying 1Click API of deposit...");
      try {
        await fetch('/api/deposit/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: txHash,
            depositAddress: quote.depositAddress
          }),
        });
        console.log('Deposit transaction submitted to 1Click API');
      } catch (submitError) {
        console.warn('Failed to submit deposit transaction to 1Click API:', submitError);
        // Don't fail the swap if this step fails - it's optional
      }
      
      // Step 3: Monitor swap progress
      setLoadingStep("Step 3: Monitoring swap progress...");
      await monitorSwapProgress(quote.depositAddress, quote.depositMemo);
      
      setSuccess(true);
      setAmount("");
      setQuote(null);
      await loadBalance(); // Refresh balance
      onSwapComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setIsLoading(false);
    }
  };

  const monitorSwapProgress = async (depositAddress: string, depositMemo?: string) => {
    const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds total
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const params = new URLSearchParams({ depositAddress });
        if (depositMemo) {
          params.append('depositMemo', depositMemo);
        }
        
        const response = await fetch(`/api/execution-status?${params}`);
        const statusData = await response.json();
        
        console.log(`Swap status check ${attempts + 1}/${maxAttempts}:`, statusData.status);
        setLoadingStep(`Step 3: Swap status - ${statusData.status} (${attempts + 1}/${maxAttempts})`);
        
        if (statusData.status === 'SUCCESS') {
          console.log('Swap completed successfully!');
          return;
        } else if (statusData.status === 'FAILED' || statusData.status === 'REFUNDED') {
          throw new Error(`Swap ${statusData.status.toLowerCase()}. Check transaction details.`);
        }
        
        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        console.error('Error checking swap status:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Swap status could not be confirmed. Please check manually.');
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    throw new Error('Swap is taking longer than expected. Please check the transaction status manually.');
  };

  const balanceInTokens = fromToken ? 
    (Number(balance) / Math.pow(10, fromToken.decimals)).toFixed(6) : "0";

  if (!signedAccountId) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="w-8 h-8 text-white/60" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Swap Tokens
        </h3>
        <p className="text-white/70 mb-4">
          Connect your wallet to swap cross-chain assets
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
          <ArrowRightLeft className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Swap Tokens</h3>
          <p className="text-sm text-white/70">
            Exchange cross-chain assets on NEAR
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!intentsAvailable && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">NEAR Intents not available</p>
              <p className="text-xs text-yellow-500 mt-1">
                Switch to mainnet to use swap functionality
              </p>
            </div>
          </div>
        )}

        {error && error.includes('API authentication failed') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-600 font-medium">API Configuration Required</p>
                <p className="text-xs text-red-500 mt-1">
                  The 1Click API token is not configured. Please set the ONECLICK_API_TOKEN environment variable.
                </p>
                <div className="mt-2 text-xs text-red-600">
                  <p className="font-medium">To fix this:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Get your JWT token from: <a href="https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform" target="_blank" rel="noopener noreferrer" className="underline">1Click API Token Request</a></li>
                    <li>Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root</li>
                    <li>Add: <code className="bg-red-100 px-1 rounded">ONECLICK_API_TOKEN=your-actual-jwt-token-here</code></li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* From Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From
          </label>
          <TokenSelector
            tokens={intentsTokens}
            selectedToken={fromToken}
            onTokenSelect={setFromToken}
            placeholder="Select token to swap from"
          />
        </div>

        {/* Amount Input */}
        {fromToken && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => setAmount(balanceInTokens)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Balance: {balanceInTokens} {fromToken.symbol}</span>
            </div>
          </div>
        )}

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <ArrowDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* To Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To
          </label>
          <TokenSelector
            tokens={intentsTokens.filter(token => token.assetId !== fromToken?.assetId)}
            selectedToken={toToken}
            onTokenSelect={setToToken}
            placeholder="Select token to swap to"
          />
        </div>

        {/* Quote Display */}
        {isGettingQuote && (
          <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-600">Getting quote...</span>
          </div>
        )}

        {quote && !isGettingQuote && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">You will receive:</span>
              <span className="font-medium text-gray-900">
                {quote.amountOutFormatted} {toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Slippage:</span>
              <span className="text-xs text-gray-500">0.1%</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isLoading && loadingStep && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-blue-600 font-medium">Processing...</span>
            </div>
            <p className="text-xs text-blue-500">{loadingStep}</p>
            {loadingStep.includes("Executing swap") && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                💡 If popup is blocked, allow popups for this site and try again
              </p>
            )}
            <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-600 font-medium">Swap successful!</p>
              {txHash && (
                <p className="text-xs text-green-500 mt-1">
                  TX: {txHash.slice(0, 8)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !amount || !quote || isLoading || parseFloat(amount) <= 0 || !intentsAvailable}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Swapping...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              Swap Tokens
            </>
          )}
        </button>
      </div>
    </div>
  );
}
