"use client";

import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useState, useEffect } from "react";
import { useNetwork } from "./WalletProvider";
import NetworkSelector from "./NetworkSelector";
import { createTransaction } from "near-api-js/lib/transaction";
import { PublicKey } from "@near-js/crypto";
import { Action, actionCreators, Transaction } from "@near-js/transactions";
import { transactions } from "near-api-js";

export default function WalletConnection() {
  const { signedAccountId, signIn, signOut, getBalance, getAccount, signAndSendTransactions } = useWalletSelector();
  const { network, setNetwork } = useNetwork();
  const [action, setAction] = useState<() => void>(() => { });
  const [label, setLabel] = useState('Loading...');
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
const account = getAccount(signedAccountId || "");
    signAndSendTransactions( 
      transactions:  [
        signerId: signedAccountId as PublicKey || "",
        receiverId: "wrap.near",
        actions: [
        actionCreators.functionCall("near_deposit", {}, 10n * TGas, amount + NEAR.toUnits("0.00125")) as Action,
        actionCreators.functionCall(
            "ft_transfer_call",
            {
            receiver_id: INTENTS_CONTRACT_ID,
            amount: amount.toString(),
            msg: account.accountId,
            },
            50n * TGas,
            1n
        ) as Action,
        ]
    ]
    );

  useEffect(() => {
    if (signedAccountId) {
      setAction(() => () => signOut());
      setLabel(`Logout ${signedAccountId}`);
      fetchBalance();
    } else {
      setAction(() => () => signIn());
      setLabel('Login');
      setBalance('0');
    }
  }, [signedAccountId, signIn, signOut]);

  const fetchBalance = async () => {
    if (!signedAccountId) return;
    
    setLoading(true);
    try {
      const accountBalance = await getBalance(signedAccountId);
      
      setBalance(accountBalance.toString());
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          NEAR Wallet
        </h2>
        <NetworkSelector 
          currentNetwork={network} 
          onNetworkChange={setNetwork} 
        />
      </div>
      
      <div className="text-center w-full">
        {signedAccountId ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                  ✅ Connected
                </p>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${network === "mainnet" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {network.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="text-gray-800 dark:text-white font-mono text-sm break-all">
                {signedAccountId}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-2">
                Account Balance
              </p>
              {loading ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
              ) : (
                <p className="text-gray-800 dark:text-white font-mono text-lg font-bold">
                  {parseFloat(balance).toFixed(4)} NEAR
                </p>
              )}
              <button
                onClick={() => fetchBalance()}
                disabled={loading}
                className="mt-2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
            </div>
            
            <button
              onClick={action}
              className="w-full px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              {label}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Connect your NEAR wallet to get started
            </p>
            <button
              onClick={action}
              className="w-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              {label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
