"use client"

import ConnectWalletButton from "@/components/wallet/ConnectWalletButton"
import { useWallet } from "@/contexts/WalletContext"

export default function TestWalletPage() {
  const { accountId, isConnected, getBalance } = useWallet()

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">NEAR Wallet Test</h1>
        
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Wallet Status</h2>
          <div className="space-y-4">
            <div>
              <span className="text-white/70">Connected: </span>
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "Yes" : "No"}
              </span>
            </div>
            {accountId && (
              <div>
                <span className="text-white/70">Account ID: </span>
                <span className="text-white font-mono">{accountId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-white/70 mb-6">
            Click the button below to see the NEAR Wallet Selector with multiple wallet options:
          </p>
          <div className="space-y-4">
            <ConnectWalletButton />
            <div className="text-sm text-white/50">
              <p>Supported wallets:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>NEAR Wallet (Browser)</li>
                <li>MyNearWallet</li>
                <li>Sender Wallet</li>
                <li>HERE Wallet</li>
                <li>Meteor Wallet</li>
                <li>Nightly Wallet</li>
                <li>Ledger Hardware Wallet</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
