"use client";

import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNetwork } from "../components/WalletProvider";
import { useState, useEffect } from "react";
import { utils } from "near-api-js";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ConnectPage() {
  const { signedAccountId, signIn, signOut, getBalance } = useWalletSelector();
  const { network, setNetwork } = useNetwork();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signedAccountId) {
      fetchBalance();
    } else {
      setBalance('0');
    }
  }, [signedAccountId]);

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

  const balanceInNear = utils.format.formatNearAmount(balance);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">NEAR 1Click</h1>
          </div>
          <p className="text-gray-600">
            Connect your NEAR wallet to manage cross-chain assets
          </p>
        </div>

        {/* Wallet Connection Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Wallet Connection
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${network === "mainnet" ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <span className="text-xs text-gray-600 font-medium">
                {network.toUpperCase()}
              </span>
            </div>
          </div>

          {signedAccountId ? (
            <div className="space-y-4">
              {/* Connected State */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </div>
                <p className="text-sm text-green-800 font-mono break-all">
                  {signedAccountId}
                </p>
              </div>

              {/* Balance */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600 font-medium">Account Balance</span>
                  <button
                    onClick={fetchBalance}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {loading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      'Refresh'
                    )}
                  </button>
                </div>
                <p className="text-lg text-blue-800 font-mono font-bold">
                  {loading ? 'Loading...' : `${parseFloat(balanceInNear).toFixed(4)} NEAR`}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Go to Dashboard
                </Link>
                
                <button
                  onClick={signOut}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Not Connected State */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Connect your NEAR wallet to start managing cross-chain assets
                </p>
                
                <button
                  onClick={signIn}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Network Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Network Information</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Current Network:</span>
              <span className="font-mono">{network.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={network === "mainnet" ? "text-green-600" : "text-yellow-600"}>
                {network === "mainnet" ? "Full Features" : "Limited Features"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

