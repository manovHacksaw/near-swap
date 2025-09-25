"use client"

import React, { useState, useEffect } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Copy, Check, RefreshCw } from 'lucide-react'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

interface ConnectWalletButtonProps {
  className?: string
}

export default function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { accountId, isConnected, isLoading, connect, disconnect, balance, refreshBalance, isBalanceLoading } = useWallet()
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleConnect = async () => {
    if (isConnected) {
      await disconnect()
    } else {
      await connect()
    }
  }

  const handleCopyAddress = async () => {
    if (accountId) {
      await navigator.clipboard.writeText(accountId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefreshBalance = async () => {
    setIsRefreshing(true)
    try {
      await refreshBalance()
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Wallet className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (isConnected && accountId) {
    console.log("🔍 ConnectWalletButton: Displaying balance:", balance, "for account:", accountId);
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">Balance:</span>
            {isBalanceLoading ? (
              <div className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin text-white/70" />
                <span className="text-white/70 text-sm">Loading...</span>
              </div>
            ) : (
              <span className="text-white font-medium">{balance} NEAR</span>
            )}
            <button
              onClick={handleRefreshBalance}
              disabled={isRefreshing || isBalanceLoading}
              className="text-white/50 hover:text-white/70 transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white/50 text-xs font-mono">
              {accountId.length > 20 ? `${accountId.slice(0, 10)}...${accountId.slice(-10)}` : accountId}
            </span>
            <button
              onClick={handleCopyAddress}
              className="text-white/50 hover:text-white/70 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <Button
          onClick={handleConnect}
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <ShimmerButton onClick={handleConnect} className={className}>
      <Wallet className="w-4 h-4" />
      <span>Connect Wallet</span>
    </ShimmerButton>
  )
}
