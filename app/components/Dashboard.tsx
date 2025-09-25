"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNetwork } from "./WalletProvider";
import { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript";
import HeaderWalletConnection from "./HeaderWalletConnection";
import DepositCard from "./DepositCard";
import SwapCard from "./SwapCard";
import WithdrawCard from "./WithdrawCard";

export default function Dashboard() {
  const { signedAccountId } = useWalletSelector();
  const { network, setNetwork } = useNetwork();
  const [tokens, setTokens] = useState<TokenResponse[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setIsLoadingTokens(true);
    setTokensError(null);
    
    try {
      const response = await fetch('/api/tokens');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to load tokens`);
      }
      
      const responseData = await response.json();
      const { tokens: tokensData } = responseData;
      console.log('Loaded tokens:', tokensData.length);
      setTokens(tokensData);
    } catch (err) {
      console.error("Failed to load tokens:", err);
      setTokensError(err instanceof Error ? err.message : "Failed to load tokens");
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    loadTokens();
  };

  const handleActionComplete = () => {
    // Trigger a refresh of balances and tokens
    handleRefresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">koondotfun</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isLoadingTokens}
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <HeaderWalletConnection />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Network Warning Banner */}
        {network === "testnet" && (
          <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-400 font-medium">Limited Functionality on Testnet</p>
              <p className="text-xs text-yellow-500 mt-1">
                NEAR Intents is not available on testnet. Switch to mainnet to use deposit, swap, and withdraw features.
              </p>
            </div>
            <button
              onClick={() => setNetwork("mainnet")}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors"
            >
              Switch to Mainnet
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Status Banner */}
        {tokensError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-600 font-medium">Failed to load tokens</p>
              <p className="text-xs text-red-500 mt-1">{tokensError}</p>
            </div>
            <button
              onClick={loadTokens}
              className="ml-auto px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isLoadingTokens && (
          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            <p className="text-sm text-blue-600">Loading supported tokens...</p>
          </div>
        )}

        {tokens.length > 0 && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600">
              Loaded {tokens.length} supported tokens across {new Set(tokens.map(t => t.blockchain)).size} chains
            </p>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deposit Card */}
          <div className="lg:col-span-1">
            <DepositCard onDepositComplete={handleActionComplete} />
          </div>

          {/* Swap Card */}
          <div className="lg:col-span-1">
            <SwapCard 
              tokens={tokens} 
              onSwapComplete={handleActionComplete}
            />
          </div>

          {/* Withdraw Card */}
          <div className="lg:col-span-1">
            <WithdrawCard 
              tokens={tokens} 
              onWithdrawComplete={handleActionComplete}
            />
          </div>
        </div>

        {/* Winnings Withdrawal Info */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">💰 Your Winnings</h2>
          <p className="text-blue-800 mb-2">
            Your balance represents your winnings on {network === "mainnet" ? "mainnet" : "testnet"}.
          </p>
          <p className="text-blue-700 text-sm">
            <strong>Withdraw anywhere:</strong> Your winnings can be withdrawn to any supported chain, including multiple EVM chains like Ethereum, Arbitrum, Base, and more.
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-background rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Deposit</h3>
              <p className="text-sm text-gray-600">
                Convert your native NEAR tokens into cross-chain assets on the NEAR Intents platform.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Swap</h3>
              <p className="text-sm text-gray-600">
                Exchange between different cross-chain assets instantly on NEAR with minimal fees.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Withdraw</h3>
              <p className="text-sm text-gray-600">
                Send your assets to any supported external blockchain like Ethereum, Arbitrum, or Base.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Chains */}
        {tokens.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supported Chains</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(tokens.map(t => t.blockchain))).map(blockchain => (
                <span
                  key={blockchain}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {blockchain}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* App URL Banner */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2">🚀 Our app is live!</h2>
          <p className="text-white/90 text-lg">
            Visit us at <span className="font-mono font-bold">koondotfun.vercel.app</span>
          </p>
        </div>
      </div>
    </div>
  );
}
