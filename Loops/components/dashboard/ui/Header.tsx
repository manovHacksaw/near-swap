"use client"

import ConnectWalletButton from "@/components/wallet/ConnectWalletButton"
import { useEffect, useState } from "react"
import { useWallet } from "@/contexts/WalletContext"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import AppSidebar from "@/components/dashboard/ui/SidebarTabs"
import { ShimmerButton } from "@/components/magicui/shimmer-button"

interface DashboardHeaderProps {
  title?: string
  balanceInNEAR: number
}

export default function DashboardHeader({ title = "Koon", balanceInNEAR }: DashboardHeaderProps) {
  const { isConnected, balance } = useWallet()
  const [chain, setChain] = useState<string>("near")
  const chains = [
    { value: "near", label: "NEAR", icon: "/near.png" },
    { value: "arbitrum", label: "Arbitrum", icon: "/arb.png" },
    { value: "base", label: "Base", icon: "/base.png" },
    { value: "ethereum", label: "Ethereum", icon: "/eth.png" },
  ] as const
  const selectedChain = chains.find((c) => c.value === chain)

  return (
    <>
      <AppSidebar />

      {/* make header transparent, fully rounded, and offset from left to clear the sidebar.
          Small inset top/right so the curve is visible. */}
      <header
        className="fixed top-0 right-80 left-[16rem] z-50 rounded-full border border-border bg-background/70 backdrop-blur"
        aria-label="Main header"
      >
        <div className="relative mx-auto flex h-14 items-center justify-end px-2 md:px-3">
          {/* Right: Chain selector, Wallet connect */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger size="sm" className="rounded-full border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Select chain">
                    {selectedChain ? (
                      <span className="flex items-center gap-2">
                        <img
                          src={selectedChain.icon || "/placeholder.svg"}
                          alt={selectedChain.label}
                          className="h-4 w-4 rounded-sm"
                        />
                        <span className="hidden sm:inline">{selectedChain.label}</span>
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-background/80 border-border text-foreground">
                  {chains.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <img src={c.icon || "/placeholder.svg"} alt={c.label} className="h-4 w-4 rounded-sm" />
                        <span>{c.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ConnectWalletButton />
          </div>
        </div>
      </header>
    </>
  )
}
