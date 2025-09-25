"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Market = {
  id: string
  question: string
  yesProbability: number // 0..1
  volumeUsd: number
  endsInHours: number
  category: string
}

const sampleMarkets: Market[] = [
  { id: "1", question: "Presidential Election Winner 2024", yesProbability: 0.65, volumeUsd: 1223700, endsInHours: 72, category: "US Election" },
  { id: "2", question: "Popular Vote Winner 2024", yesProbability: 0.63, volumeUsd: 374300, endsInHours: 96, category: "US Election" },
  { id: "3", question: "U.S. Recession in 2024?", yesProbability: 0.38, volumeUsd: 328300, endsInHours: 120, category: "Economy" },
  { id: "4", question: "OpenSea token >1B volume week after launch?", yesProbability: 0.51, volumeUsd: 1800000, endsInHours: 48, category: "Crypto" },
  { id: "5", question: "Will there be another debate?", yesProbability: 0.06, volumeUsd: 2400000, endsInHours: 36, category: "Politics" },
  { id: "6", question: "Will Trump go on Joe Rogan before election?", yesProbability: 0.75, volumeUsd: 1010000, endsInHours: 60, category: "Politics" },
]

const categories = ["Top", "New", "Breaking News", "US Election", "Crypto", "Sports", "Politics"]

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatUsd(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}m Vol.`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k Vol.`
  return `$${value} Vol.`
}

export default function NearkMarketWork() {
  return (
    <div className="w-full pr-4">
      {/* Header banners (simple placeholders) */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 border border-white/10">
          <div className="text-sm text-white/80">2024 Election</div>
          <div className="text-xl font-bold">Forecast</div>
          <div className="mt-3">
            <Button size="sm" variant="secondary">View</Button>
          </div>
        </div>
        <div className="rounded-2xl p-5 border border-white/10">
          <div className="text-sm text-white/80">2024 Presidential</div>
          <div className="text-xl font-bold">Election</div>
          <div className="mt-3">
            <Button size="sm">Trade now</Button>
          </div>
        </div>
        <div className="rounded-2xl p-5 border border-white/10">
          <div className="text-sm text-white/80">U.S. Recession in 2024?</div>
          <div className="text-xl font-bold">Macro</div>
          <div className="mt-3">
            <Button size="sm" variant="secondary">Trade now</Button>
          </div>
        </div>
        <div className="rounded-2xl p-5 border border-white/10">
          <div className="text-sm text-white/80">Trade Elections</div>
          <div className="text-xl font-bold">Get Started</div>
          <div className="mt-3">
            <Button size="sm">Sign Up</Button>
          </div>
        </div>
      </div> */}
      
      {/* Search bar */}
      <div className="mb-6 pt-4 flex items-center justify-end gap-2 pr-4">
        <Input placeholder="Search markets..." className="w-full max-w-sm h-9 rounded-lg placeholder:text-white/50" />
        <Button size="sm" className="rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20">Create Bet</Button>
      </div>

      {/* Category pills */}
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button key={c} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-colors">
            {c}
          </button>
        ))}
      </div>

      {/* Market grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {sampleMarkets.map((m) => (
          <Card key={m.id} className="group border-white/10 hover:border-white/30 transition-all duration-200 rounded-2xl p-0 overflow-hidden hover:-translate-y-0.5">
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold leading-snug line-clamp-2 group-hover:underline decoration-white/30 underline-offset-2">{m.question}</div>
                  <div className="text-xs text-white/50 mt-1">Ends in {m.endsInHours}h</div>
                </div>
                <div className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold border border-white/10">
                  {formatPercent(m.yesProbability)}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button className="w-full h-9 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">Buy Yes</Button>
                <Button className="w-full h-9 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40">Buy No</Button>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                <span>{m.category}</span>
                <span>{formatUsd(m.volumeUsd)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Footer sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 rounded-2xl transition-all duration-200 hover:border-white/30 hover:-translate-y-0.5">
          <div className="p-4 flex items-center justify-between">
            <div className="font-semibold">Recent Activity</div>
            <Button variant="ghost" size="sm" className="h-8">See all</Button>
          </div>
          <div className="px-4 pb-4 text-sm text-white/70">
            Activity feed coming soon.
          </div>
        </Card>

        <Card className="border-white/10 rounded-2xl transition-all duration-200 hover:border-white/30 hover:-translate-y-0.5">
          <div className="p-4 flex items-center justify-between">
            <div className="font-semibold">Top Volume This Week</div>
            <Button variant="ghost" size="sm" className="h-8">See all</Button>
          </div>
          <div className="px-4 pb-4 text-sm text-white/70">
            Leaderboard coming soon.
          </div>
        </Card>
      </div>
    </div>
  )
} 