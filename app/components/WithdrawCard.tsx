"use client";

import { useState, useEffect } from "react";
import { ArrowDown, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNetwork } from "./WalletProvider";
import { QuoteRequest, TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";
import TokenSelector from "./TokenSelector";
import { getContractAddresses, isIntentsAvailable } from "../lib/contracts";

interface WithdrawCardProps {
  tokens: TokenResponse[];
  onWithdrawComplete?: () => void;
}

export default function WithdrawCard({ tokens, onWithdrawComplete }: WithdrawCardProps) {
  const { signedAccountId, callFunction, signAndSendTransactions } = useWalletSelector();
  const { network } = useNetwork();
  const [fromToken, setFromToken] = useState<TokenResponse | null>(null);
  const [toToken, setToToken] = useState<TokenResponse | null>(null);
  const [amount, setAmount] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const contracts = getContractAddresses(network);
  const intentsAvailable = isIntentsAvailable(network);

  // Filter tokens for NEAR Intents (depositType: INTENTS)
  const intentsTokens = tokens.filter(token => 
    token.assetId.includes("nep141:") && 
    token.blockchain?.toLowerCase().includes("near")
  );

  // Filter destination tokens (non-NEAR chains)
  const destinationTokens = tokens.filter(token => 
    !token.blockchain?.toLowerCase().includes("near")
  );

  // Address validation functions
  const validateAddress = (address: string, blockchain: string): boolean => {
    if (!address) return false;
    
    const chain = blockchain?.toLowerCase() || '';
    
    if (chain.includes('ethereum') || chain.includes('arbitrum') || chain.includes('base') || chain.includes('polygon')) {
      // EVM address validation (0x followed by 40 hex characters)
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    } else if (chain.includes('solana')) {
      // Solana address validation (base58, 32-44 characters)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    } else if (chain.includes('bitcoin')) {
      // Bitcoin address validation (simplified)
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    }
    
    return true; // Default to true for unknown chains
  };

  const getAddressPlaceholder = (blockchain: string): string => {
    const chain = blockchain?.toLowerCase() || '';
    
    if (chain.includes('ethereum') || chain.includes('arbitrum') || chain.includes('base') || chain.includes('polygon')) {
      return '0x1234...5678';
    } else if (chain.includes('solana')) {
      return '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
    } else if (chain.includes('bitcoin')) {
      return '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    }
    
    return 'Enter wallet address';
  };

  const getExplorerUrl = (address: string, blockchain: string): string => {
    const chain = blockchain?.toLowerCase() || '';
    
    if (chain.includes('ethereum')) {
      return `https://etherscan.io/address/${address}`;
    } else if (chain.includes('arbitrum')) {
      return `https://arbiscan.io/address/${address}`;
    } else if (chain.includes('base')) {
      return `https://basescan.org/address/${address}`;
    } else if (chain.includes('polygon')) {
      return `https://polygonscan.com/address/${address}`;
    } else if (chain.includes('solana')) {
      return `https://solscan.io/account/${address}`;
    }
    
    return '#';
  };

  useEffect(() => {
    if (signedAccountId && fromToken) {
      loadBalance();
    }
  }, [signedAccountId, fromToken]);

  useEffect(() => {
    // Clear receiver address when token changes (different chains have different address formats)
    if (toToken) {
      setReceiverAddress("");
      setAddressError(null);
    }
  }, [toToken]);

  useEffect(() => {
    // Validate address when toToken or receiverAddress changes
    if (toToken && receiverAddress) {
      const isValid = validateAddress(receiverAddress, toToken.blockchain || '');
      setAddressError(isValid ? null : `Invalid ${toToken.blockchain} address format`);
    } else {
      setAddressError(null);
    }
  }, [toToken, receiverAddress]);

  useEffect(() => {
    if (fromToken && toToken && amount && parseFloat(amount) > 0 && receiverAddress && !addressError) {
      getWithdrawQuote();
    } else {
      setQuote(null);
    }
  }, [fromToken, toToken, amount, receiverAddress, addressError]);

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

  const getWithdrawQuote = async () => {
    if (!fromToken || !toToken || !amount || !receiverAddress) return;

    setIsGettingQuote(true);
    setError(null);

    try {
      // Check if API token is configured (basic check)
      if (!process.env.NEXT_PUBLIC_HAS_API_TOKEN) {
        // This is a client-side check, but we'll let the server handle the actual validation
        // The server will return a proper error message if the token is missing
      }

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
      
      if (!receiverAddress || receiverAddress.length < 3) {
        throw new Error('Invalid receiver address');
      }
      
      // Validate recipient address format for the destination chain
      if (!validateAddress(receiverAddress, toToken.blockchain || '')) {
        throw new Error(`Invalid ${toToken.blockchain} address format`);
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
        refundTo: signedAccountId || "",
        refundType: QuoteRequest.refundType.INTENTS,
        recipient: receiverAddress,
        recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
        deadline: deadline.toISOString(),
      };

      console.log('Withdraw quote request being sent:', JSON.stringify(quoteRequest, null, 2));
      console.log('From token:', fromToken);
      console.log('To token:', toToken);
      console.log('Amount:', amount);
      console.log('Amount in units (corrected):', amountInUnits);
      console.log('Receiver address:', receiverAddress);

      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Withdraw quote API error response:', errorData);
        
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
      console.log('Withdraw quote response:', quoteResult);
      setQuote(quoteResult);
    } catch (err) {
      console.error("Failed to get quote:", err);
      setQuote(null);
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setIsGettingQuote(false);
    }
  };

  const checkExecutionStatus = async (depositAddress: string) => {
    try {
      const response = await fetch(`/api/execution-status?depositAddress=${depositAddress}`);
      if (response.ok) {
        const { status } = await response.json();
        setExecutionStatus(status.status);
        return status.status === "SUCCESS";
      }
    } catch (err) {
      console.error("Failed to check execution status:", err);
    }
    return false;
  };

  const handleWithdraw = async () => {
    if (!signedAccountId || !fromToken || !quote) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);
    setExecutionStatus(null);

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
        // Don't fail the withdraw if this step fails - it's optional
      }
      
      // Step 3: Monitor withdrawal progress
      setLoadingStep("Step 3: Monitoring withdrawal progress...");
      await monitorWithdrawalProgress(quote.depositAddress, quote.depositMemo);
      
      setSuccess(true);
      setAmount("");
      setQuote(null);
      setReceiverAddress("");
      await loadBalance(); // Refresh balance
      onWithdrawComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setIsLoading(false);
    }
  };

  const monitorWithdrawalProgress = async (depositAddress: string, depositMemo?: string) => {
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
        
        console.log(`Withdrawal status check ${attempts + 1}/${maxAttempts}:`, statusData.status);
        setLoadingStep(`Step 3: Withdrawal status - ${statusData.status} (${attempts + 1}/${maxAttempts})`);
        
        if (statusData.status === 'SUCCESS') {
          console.log('Withdrawal completed successfully!');
          return;
        } else if (statusData.status === 'FAILED' || statusData.status === 'REFUNDED') {
          throw new Error(`Withdrawal ${statusData.status.toLowerCase()}. Check transaction details.`);
        }
        
        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        console.error('Error checking withdrawal status:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Withdrawal status could not be confirmed. Please check manually.');
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    throw new Error('Withdrawal is taking longer than expected. Please check the transaction status manually.');
  };

  const balanceInTokens = fromToken ? 
    (Number(balance) / Math.pow(10, fromToken.decimals)).toFixed(6) : "0";

  if (!signedAccountId) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowDown className="w-8 h-8 text-white/60" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Withdraw Tokens
        </h3>
        <p className="text-white/70 mb-4">
          Connect your wallet to withdraw cross-chain assets
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center">
          <ArrowDown className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Withdraw Tokens</h3>
          <p className="text-sm text-white/70">
            Withdraw cross-chain assets to external chains
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
                Switch to mainnet to use withdraw functionality
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
            From (NEAR)
          </label>
          <TokenSelector
            tokens={intentsTokens}
            selectedToken={fromToken}
            onTokenSelect={setFromToken}
            placeholder="Select token to withdraw"
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
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
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
            To (External Chain)
          </label>
          <TokenSelector
            tokens={destinationTokens}
            selectedToken={toToken}
            onTokenSelect={setToToken}
            placeholder="Select destination token"
          />
          {toToken && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700 font-medium">{toToken.blockchain}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {toToken.symbol} on {toToken.blockchain} network
              </p>
            </div>
          )}
        </div>

        {/* Receiver Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Receiver Address
            {toToken && (
              <span className="text-xs text-gray-500 ml-2">
                ({toToken.blockchain} format)
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder={toToken ? getAddressPlaceholder(toToken.blockchain || '') : 'Select token first'}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                addressError 
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : receiverAddress && !addressError
                  ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                  : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
              }`}
            />
            {receiverAddress && !addressError && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
            {addressError && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
            )}
          </div>
          
          {addressError && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {addressError}
            </p>
          )}
          
          {receiverAddress && !addressError && toToken && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Valid {toToken.blockchain} address
              </p>
              <a
                href={getExplorerUrl(receiverAddress, toToken.blockchain || '')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View on explorer
              </a>
            </div>
          )}
          
          {!toToken && (
            <p className="text-xs text-gray-500 mt-1">
              Select a destination token to see the required address format
            </p>
          )}
        </div>

        {/* Quote Display */}
        {isGettingQuote && (
          <div className="p-4 bg-orange-50 rounded-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
            <span className="text-sm text-orange-600">Getting quote...</span>
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
              <span className="text-xs text-gray-500">Destination:</span>
              <span className="text-xs text-gray-500">{toToken?.blockchain}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Slippage:</span>
              <span className="text-xs text-gray-500">0.1%</span>
            </div>
          </div>
        )}

        {executionStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-blue-600">
                Status: {executionStatus}
              </span>
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
            {loadingStep.includes("Executing withdraw") && (
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
              <p className="text-sm text-green-600 font-medium">Withdrawal successful!</p>
              {txHash && (
                <p className="text-xs text-green-500 mt-1">
                  TX: {txHash.slice(0, 8)}...{txHash.slice(-8)}
                </p>
              )}
              {toToken && (
                <a
                  href={`https://${toToken.blockchain?.toLowerCase().includes('ethereum') ? 'etherscan.io' : toToken.blockchain?.toLowerCase().includes('arbitrum') ? 'arbiscan.io' : 'basescan.org'}/address/${receiverAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
                >
                  View on {toToken.blockchain} Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={!fromToken || !toToken || !amount || !receiverAddress || !quote || isLoading || parseFloat(amount) <= 0 || !intentsAvailable || !!addressError}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Withdrawing...
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4" />
              Withdraw Tokens
            </>
          )}
        </button>
      </div>
    </div>
  );
}
