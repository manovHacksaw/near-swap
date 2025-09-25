"use client"

import { useState, useEffect } from "react"
import DashboardHeader from "@/components/dashboard/ui/Header"
import SidebarTabs from "@/components/dashboard/ui/SidebarTabs"
import GameContainer from "@/components/dashboard/ui/GameContainer"
import GamePicker from "@/components/dashboard/ui/GamePicker"
import MinesGame from "@/components/games/mines/MinesGame"
import CrashGame from "@/components/games/rugsfun/Rugs"
import Coinflip from "@/components/games/Coinflip/Coinflip"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, ChevronRight } from "lucide-react"
import { useUI } from "@/contexts/UIContext"
import { useWallet } from "@/contexts/WalletContext"
import Image from "next/image"
import GameSlotCard from "@/components/dashboard/ui/GameSlotCard"
import FeaturePills from "@/components/dashboard/ui/FeaturePills"
import ChatSidebar from "@/components/dashboard/ui/ChatSidebar"
import PaajiOnTop from "@/components/games/PaajiOnTop/Paaji"
import UserStats from "@/components/dashboard/ui/UserStats"
import NearkMarketWork from "@/components/dashboard/ui/nearkmarketwork"
import { useRouter } from "next/navigation"
import LoadingScreen from "@/components/ui/LoadingScreen"
import Leaderboard from "@/components/dashboard/ui/Leaderboard"

export default function DashboardPage() {
  const { selectedSection, setSelectedSection, mode } = useUI()
  const { balance } = useWallet()
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<"rugs" | "mines" | "paaji" | "coinflip" | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("All")
  // const [isLoading, setIsLoading] = useState<boolean>(true)

  const categories = ["All", "Duel Poker", "Scratchcards", "Crash", "Blackjack", "Live Games"]

  // Loading timer - show loading for 1 second
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsLoading(false)
  //   }, 1000)

  //   return () => clearTimeout(timer)
  // }, [])

  const renderCenter = () => {
    if (selectedSection === "home") {
      return (
        <div className="mt-5 space-y-6">
          <div className="relative w-full h-56 md:h-64 lg:h-72 overflow-hidden rounded-xl ">
            <Image src="/banner1.png" alt="Home banner" fill className="object-cover rounded" priority />
          </div>

          <FeaturePills />

          <div className="mt-1">
            <div className="flex items-center justify-between mb-3 pl-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pr-2">
                {["All", "Crash"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-3 py-1.5 rounded-xl text-sm whitespace-nowrap border transition-colors ${activeCategory === c
                      ? (c === "All"
                        ? "bg-white text-black border-white"
                        : "bg-primary text-primary-foreground border-primary")
                      : "bg-transparent text-white/80 border-white/10 hover:bg-white/10"
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block w-px h-6 bg-white/10" />
            </div>

            <div className="relative">
              <div className="flex gap-3 pl-2 pr-2 overflow-x-auto no-scrollbar">
                <GameSlotCard
                  title="Mines"
                  provider=""
                  imageSrc="/minegame.png"
                  onClick={() => { setSelectedSection("games"); setActiveGame("mines"); }}
                />

                <GameSlotCard
                  title="Paaji On Top"
                  provider=""
                  imageSrc="/paaji.png"
                  onClick={() => { setSelectedSection("games"); setActiveGame("paaji"); }}
                />
                <GameSlotCard
                  title="Cashout"
                  provider=""
                  imageSrc="/cashout.png"
                  onClick={() => { setSelectedSection("games"); setActiveGame("rugs"); }}
                />
                <GameSlotCard
                  title="Coinflip"
                  provider=""
                  imageSrc="/coinflip.png"
                  onClick={() => { setSelectedSection("games"); setActiveGame("coinflip"); }}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (selectedSection === "mines") {
      return <MinesGame />
    }

    if (selectedSection === "rugs") {
      return <CrashGame />
    }

    if (selectedSection === "paaji") {
      return <PaajiOnTop />
    }

    if (selectedSection === "coinflip") {
      return <Coinflip />
    }

    if (selectedSection === "stats") {
      return <UserStats />
    }

    if (selectedSection === "leaderboard") {
      return <Leaderboard />
    }

    if (selectedSection === "games") {
      if (!activeGame) return <GamePicker onPick={(g) => setActiveGame(g)} />
      if (activeGame === "mines") return <MinesGame onBack={() => setActiveGame(null)} />
      if (activeGame === "rugs") return (<>
        {/* @ts-expect-error - allow onBack prop for now */}
        <CrashGame onBack={() => setActiveGame(null)} />
      </>)
      // @ts-expect-error - allow onBack prop for now
      if (activeGame === "paaji") return <PaajiOnTop onBack={() => setActiveGame(null)} />
      // @ts-expect-error - allow onBack prop for now
      if (activeGame === "coinflip") return <Coinflip onBack={() => setActiveGame(null)} />
      return null
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-8xl mb-6">📈</div>
        <h2 className="text-white text-4xl font-bold mb-4">Predict Market</h2>
        <p className="text-white/70 text-xl mb-12 max-w-2xl">
          Coming soon: Trade on prediction markets and bet on real-world events
        </p>

        <div className="bg-transparent backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-lg shadow-2xl">
          <h3 className="text-white font-bold text-xl mb-6 flex items-center justify-center space-x-2">
            <span>🚀</span>
            <span>What&apos;s Coming:</span>
          </h3>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Sports betting markets</span>
            </div>
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Crypto price predictions</span>
            </div>
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Political event outcomes</span>
            </div>
            <div className="flex items-center space-x-3 text-white/70">
              <div className="w-2 h-2 bg-[#df500f] rounded-full"></div>
              <span>Custom market creation</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-red-600/20 rounded-xl border border-red-600/30">
            <p className="text-white/80 text-sm">
              Be the first to know when we launch! Join our waitlist for early access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getGameTitle = () => {
    if (activeGame === "mines") return "Mines"
    if (activeGame === "rugs") return "Rugs (Crash)"
    if (activeGame === "paaji") return "Paaji On Top"
    if (activeGame === "coinflip") return "Coinflip"
    return null
  }

  // // Show loading screen for 1 second
  // if (isLoading) {
  //   return <LoadingScreen />
  // }

  return (
    
    <>
    <LoadingScreen />
     <div
      className="min-h-screen w-full relative overflow-hidden pr-80"
      style={mode === "casino" ? { background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)" } : undefined}
    >
      {mode === "casino" ? <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div> : null}

      <ChatSidebar />

      <div className="relative z-10 w-full mx-auto pt-14">
        <DashboardHeader title="Koon" balanceInNEAR={parseFloat(balance)} />

        <div className="flex gap-0 h-[calc(100vh-56px)] overflow-hidden">
          <div className="w-64 shrink-0 m-0 p-0">
            <SidebarTabs />
          </div>

          <div className={`flex-1 flex flex-col m-0 p-0 px-3 sm:px-4 md:px-6 lg:px-8 ${mode === "casino" ? "bg-gray-900" : ""}`}>
            {/* Breadcrumb and Back Button */}
            {mode === "casino" && selectedSection === "games" && activeGame && (
              <div className="mb-0 flex items-center justify-between py-3">
                <div className="flex items-center space-x-2 text-white/60 bg-transparent backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 m-0">
                  <Home className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-sm">Games</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-white text-sm font-medium">{getGameTitle()}</span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent backdrop-blur-sm px-6 py-3 rounded-xl font-medium m-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Games
                </Button>
              </div>
            )}

            {mode === "casino" ? (
              selectedSection === "home" ? (
                <div className="flex flex-col gap-4">{renderCenter()}</div>
              ) : (
                <GameContainer scrollable={false}>{renderCenter()}</GameContainer>
              )
            ) : (
              <div className="h-full" />
            )}
          </div>

          {mode === "nearmarket" ? <NearkMarketWork /> : null}
        </div>
      </div>
    </div>
    </>
  )
}
