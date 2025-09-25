"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Sword,
  Rocket,
  Bomb,
  Candy as Cards,
  MonitorPlay as TvMinimalPlay,
  Dice5,
  Flame,
  HelpCircle,
  FileText,
  UsersRound,
  BarChart3,
  Settings,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUI } from "@/contexts/UIContext"
import MinesGame from "@/components/games/mines/MinesGame"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  variant?: "default" | "danger" | "new"
  key?: string
}

const primaryNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home, key: "home" },
  { label: "Mine", href: "/mines", icon: Bomb, key: "mines" },
  { label: "Cashout", href: "/rugsfun", icon: Rocket, key: "rugs" },
  { label: "Paaji On Top", href: "/paaji", icon: Rocket, key: "paaji" },
  { label: "Coinflip", href: "/coinflip", icon: Rocket, key: "coinflip" },
  { label: "Statistics", href: "/stats", icon: BarChart3, key: "stats" },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy, key: "leaderboard" },
]

const secondaryNav: NavItem[] = [
  { label: "Support", href: "/support", icon: HelpCircle, key: "support" },
  { label: "Affiliates", href: "/affiliates", icon: UsersRound, key: "affiliates" },
  { label: "Admin", href: "/admin", icon: Settings, key: "admin" },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { selectedSection, setSelectedSection, mode, setMode } = useUI()

  return (
    <aside
      className={cn(
        // container
        "fixed left-0 top-0 bottom-0 z-40 w-64",
        "rounded-3xl border border-border bg-background/70 backdrop-blur",
        "flex flex-col",
      )}
      aria-label="App sidebar navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-6 px-4 pt-7 pb-6">
        <Image src="/logogif.gif" alt="Koon logo" width={70} height={70} className="rounded-full object-cover" />
        <div className="leading-tight">
          <div className="text-3xl md:text-4xl font-extrabold text-foreground text-pretty">Koon</div>
          <div className="text-[13px] tracking-[0.18em] text-foreground/60">@koondotfun</div>
        </div>
      </div>

      {/* Segmented control (Casino / NearMarket) */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border p-1">
          <button
            onClick={() => {
              setMode("casino")
              setSelectedSection("home")
            }}
            className={cn(
              "h-8 rounded-xl text-xs font-medium",
              mode === "casino" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted transition",
            )}
          >
            Casino
          </button>
          <button
            onClick={() => {
              setMode("nearmarket")
            }}
            className={cn(
              "h-8 rounded-xl text-xs font-medium",
              mode === "nearmarket" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted transition",
            )}
          >
            NearMarket
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 overflow-y-auto px-2">
        <ul className="space-y-1.5">
          {primaryNav.map((item) => {
            const active = selectedSection === (item.key || item.href.replace("/", ""))
            const Icon = item.icon
            return (
              <li key={item.key || item.href}>
                <button
                  onClick={() => setSelectedSection(item.key || item.href.replace("/", ""))}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-base text-left",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", active ? "opacity-90" : "opacity-80")} />
                    <span className="text-pretty">{item.label}</span>
                  </span>

                  {item.variant === "danger" ? (
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-destructive" />
                  ) : item.variant === "new" ? (
                    <span className="ml-2 rounded-md border border-border px-1.5 py-0.5 text-[10px] leading-none">
                      NEW
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Promo card */}
        <div className="mt-3 rounded-2xl border border-border overflow-hidden">
          <div className="relative h-64 w-full">
            <Image src="/poster.png" alt="Promotion" fill className="object-cover" />
          </div>
        </div>
      </nav>

      {/* Secondary */}
      <div className="mt-auto px-2 pb-2">
        <div className="rounded-2xl border border-border bg-secondary/40 p-2">
          <ul className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.key || item.href}>
                  <button
                    onClick={() => setSelectedSection(item.key || item.href.replace("/", ""))}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-base text-foreground/80 hover:bg-muted hover:text-foreground text-left"
                  >
                    <Icon className="h-4 w-4 opacity-80" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </aside>
  )
}
