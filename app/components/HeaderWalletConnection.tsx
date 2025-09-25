"use client";

import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useState, useEffect } from "react";
import { useNetwork } from "./WalletProvider";
import NetworkSelector from "./NetworkSelector";
import { utils } from "near-api-js";

export default function HeaderWalletConnection() {
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
    <div className="flex items-center gap-4">
      {/* Network Selector */}
      <NetworkSelector 
        currentNetwork={network} 
        onNetworkChange={setNetwork} 
      />
      
      {/* Wallet Connection */}
      {signedAccountId ? (
        <div className="flex items-center gap-3">
          {/* Account Balance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${network === "mainnet" ? "bg-green-500" : "bg-yellow-500"}`}></div>
              <span className="text-xs text-blue-600 font-medium">
                {network.toUpperCase()}
              </span>
            </div>
            <div className="text-sm text-blue-800 font-mono">
              {loading ? 'Loading...' : `${parseFloat(balanceInNear).toFixed(4)} NEAR`}
            </div>
            <div className="text-xs text-blue-600">
              Winnings on {network === "mainnet" ? "Mainnet" : "Testnet"}
            </div>
            <button
              onClick={fetchBalance}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {/* Account Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div className="text-xs text-green-600 font-medium">Connected</div>
            <div className="text-sm text-green-800 font-mono truncate max-w-32">
              {signedAccountId}
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={signIn}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
