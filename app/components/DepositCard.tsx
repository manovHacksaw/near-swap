"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, CheckCircle, AlertCircle } from "lucide-react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNetwork } from "./WalletProvider";
import { utils } from "near-api-js";
import { getContractAddresses, isIntentsAvailable } from "../lib/contracts";

interface DepositCardProps {
  onDepositComplete?: () => void;
}

export default function DepositCard({ onDepositComplete }: DepositCardProps) {
  const { signedAccountId, getBalance, signAndSendTransactions } = useWalletSelector();
  const { network } = useNetwork();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const contracts = getContractAddresses(network);
  const intentsAvailable = isIntentsAvailable(network);

  useEffect(() => {
    if (signedAccountId) {
      loadBalance();
    }
  }, [signedAccountId]);

  const loadBalance = async () => {
    if (!signedAccountId) return;
    try {
      const nearBalance = await getBalance(signedAccountId);
      setBalance(nearBalance.toString());
    } catch (err) {
      console.error("Failed to load balance:", err);
    }
  };

  const handleDeposit = async () => {
    if (!signedAccountId || !amount) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setTxHash(null);
    setLoadingStep("");

    try {
      const amountInUnits = utils.format.parseNearAmount(amount);
      if (!amountInUnits) {
        throw new Error("Invalid amount");
      }
      
      const balanceInYocto = utils.format.parseNearAmount(balance) || "0";
      
      if (BigInt(balanceInYocto) < BigInt(amountInUnits)) {
        throw new Error("Insufficient NEAR balance");
      }

      if (!intentsAvailable) {
        throw new Error(`NEAR Intents is not available on ${network}. Please switch to mainnet to use this feature.`);
      }

    // Try batch transaction first, fallback to sequential if popup issues occur
    setLoadingStep("Depositing NEAR and transferring to Intents...");
    
    let result;
    try {
      // Attempt batch transaction (preferred method)
      result = await signAndSendTransactions({
        transactions: [
          {
            signerId: signedAccountId,
            receiverId: contracts.wrap,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "near_deposit",
                  args: {},
                  gas: "30000000000000",
                  deposit: amountInUnits,
                },
              },
            ],
          },
          {
            signerId: signedAccountId,
            receiverId: contracts.wrap,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  methodName: "ft_transfer_call",
                  args: {
                    receiver_id: contracts.intents,
                    amount: amountInUnits,
                    msg: signedAccountId,
                  },
                  gas: "50000000000000",
                  deposit: "1",
                },
              },
            ],
          },
        ],
      });
    } catch (batchError: any) {
      // If batch fails due to popup issues, try sequential approach
      if (batchError.message?.includes("popup") || batchError.message?.includes("window")) {
        console.log("Batch transaction failed, trying sequential approach...");
        
        setLoadingStep("Step 1: Depositing NEAR to wrap.near...");
        const depositResult = await signAndSendTransactions({
          transactions: [
            {
              signerId: signedAccountId,
              receiverId: contracts.wrap,
              actions: [
                {
                  type: "FunctionCall",
                  params: {
                    methodName: "near_deposit",
                    args: {},
                    gas: "30000000000000",
                    deposit: amountInUnits,
                  },
                },
              ],
            },
          ],
        });

        console.log("Deposit completed, waiting before transfer...");
        setLoadingStep("Step 2: Waiting for deposit to complete...");
        await new Promise(resolve => setTimeout(resolve, 8000)); // Longer wait
        
        setLoadingStep("Step 2: Transferring to NEAR Intents...");
        result = await signAndSendTransactions({
          transactions: [
            {
              signerId: signedAccountId,
              receiverId: contracts.wrap,
              actions: [
                {
                  type: "FunctionCall",
                  params: {
                    methodName: "ft_transfer_call",
                    args: {
                      receiver_id: contracts.intents,
                      amount: amountInUnits,
                      msg: signedAccountId,
                    },
                    gas: "50000000000000",
                    deposit: "1",
                  },
                },
              ],
            },
          ],
        });
      } else {
        throw batchError; // Re-throw if it's not a popup issue
      }
    }

      console.log("Deposit and transfer completed:", result[0].transaction.hash);
      
      setTxHash(result[0].transaction.hash);
      setSuccess(true);
      setAmount("");
      await loadBalance(); // Refresh balance
      onDepositComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setIsLoading(false);
    }
  };

  const balanceInNear = utils.format.formatNearAmount(balance);

  if (!signedAccountId) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowUpRight className="w-8 h-8 text-white/60" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Deposit NEAR
        </h3>
        <p className="text-white/70 mb-4">
          Connect your wallet to deposit NEAR as a cross-chain asset
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
          <ArrowUpRight className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Deposit NEAR</h3>
          <p className="text-sm text-white/70">
            Convert native NEAR to cross-chain asset
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!intentsAvailable && (
          <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2 backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-200 font-medium">NEAR Intents not available</p>
              <p className="text-xs text-yellow-300 mt-1">
                Switch to mainnet to use deposit functionality
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Amount (NEAR)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors text-white placeholder-white/50"
            />
            <button
              onClick={() => setAmount(balanceInNear)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded text-white/80 transition-colors"
            >
              MAX
            </button>
          </div>
          <div className="flex justify-between text-sm text-white/60 mt-1">
            <span>Balance: {balanceInNear} NEAR</span>
            <span>Min: 0.01 NEAR</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {isLoading && loadingStep && (
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <span className="text-sm text-blue-200 font-medium">Processing...</span>
            </div>
            <p className="text-xs text-blue-300">{loadingStep}</p>
            {loadingStep.includes("Depositing NEAR and transferring") && (
              <p className="text-xs text-amber-300 mt-2 flex items-center gap-1">
                💡 If popup is blocked, allow popups for this site and try again
              </p>
            )}
            <div className="mt-2 w-full bg-blue-400/20 rounded-full h-1">
              <div className="bg-blue-400 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 backdrop-blur-sm">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-200 font-medium">Deposit successful!</p>
              {txHash && (
                <p className="text-xs text-green-300 mt-1">
                  TX: {txHash.slice(0, 8)}...{txHash.slice(-8)}
                </p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={!amount || isLoading || parseFloat(amount) <= 0 || parseFloat(amount) < 0.01 || !intentsAvailable}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white border border-green-500/30 rounded-lg transition-colors font-medium backdrop-blur-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loadingStep || "Processing..."}
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              Deposit NEAR
            </>
          )}
        </button>
      </div>
    </div>
  );
}
