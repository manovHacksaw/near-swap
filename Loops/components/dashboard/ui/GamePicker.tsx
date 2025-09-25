"use client"
import { Card } from "@/components/ui/card"
import { Play, Zap, Target, Users, Star } from "lucide-react"
import { useUI } from "@/contexts/UIContext"

interface GamePickerProps {
  onPick: (game: "rugs" | "mines") => void
}

export default function GamePicker({ onPick }: GamePickerProps) {
  const { setSelectedSection, setMode } = useUI()
  const games = [
    {
      id: "rugs" as const,
      title: "Rugs (Crash)",
      description: "Ride the multiplier with Nyan Cat and cash out before it crashes!",
      emoji: "🚀",
      icon: Zap,
      image: "/nyan-cat.png",
      color: "from-purple-500 to-pink-500",
      stats: { players: "1.2k", winRate: "45%", maxWin: "50x" },
      difficulty: "Medium",
      isHot: true,
    },
    {
      id: "mines" as const,
      title: "Mines",
      description: "Navigate the minefield, collect gems, and cash out safely.",
      emoji: "💣",
      icon: Target,
      image: "/sparkling-diamond-gems-treasure-success-celebratio.jpg",
      color: "from-green-500 to-blue-500",
      stats: { players: "856", winRate: "62%", maxWin: "24x" },
      difficulty: "Easy",
      isHot: false,
    },
  ]

  return (
    <div className="w-full h-full">
      <div className="mb-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-white text-4xl font-bold">Choose Your Game</h2>
        </div>
        <p className="text-white/70 text-xl">Select a game to start playing and winning big</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {games.map((game) => {
          const Icon = game.icon

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => {
                setMode("casino")
                setSelectedSection(game.id)
                onPick(game.id)
              }}
              className="text-left group"
            >
              <Card className="overflow-hidden bg-black/30 border-white/10 hover:border-white/30 hover:shadow-2xl transition-all duration-300 rounded-3xl group-hover:scale-[1.02] group-hover:bg-black/40 relative">
                {/* Hot Badge */}
                {game.isHot && (
                  <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                    <Star className="w-3 h-3" />
                    <span>HOT</span>
                  </div>
                )}

                {/* Game Image */}
                <div className="relative h-56 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-30`} />
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 backdrop-blur-sm">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </div>

                  {/* Stats Badge */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-xl px-4 py-2 border border-white/20">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-white/70" />
                      <span className="text-white text-sm font-medium">{game.stats.players}</span>
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 border border-white/30">
                    <span className="text-white text-xs font-medium">{game.difficulty}</span>
                  </div>
                </div>

                {/* Game Info */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-r ${game.color} rounded-2xl flex items-center justify-center shadow-xl`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-2xl mb-1">{game.title}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-green-400 text-sm font-medium">Win: {game.stats.winRate}</span>
                        <span className="text-[#df500f] text-sm font-medium">Max: {game.stats.maxWin}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/70 text-base leading-relaxed mb-6">{game.description}</p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{game.emoji}</span>
                      <span className="text-white/60 text-sm">Ready to play</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#df500f] group-hover:text-[#ff6b35] transition-colors">
                      <span className="text-base font-bold">Play Now</span>
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Card>
            </button>
          )
        })}

        {/* Coming Soon Card */}
        <Card className="overflow-hidden bg-black/20 border-white/10 border-dashed rounded-3xl opacity-60">
          <div className="h-56 flex items-center justify-center bg-gradient-to-br from-gray-500/20 to-gray-700/20">
            <div className="text-center">
              <div className="text-6xl mb-4">🎲</div>
              <div className="text-white/60 font-bold text-lg">More Games</div>
              <div className="text-white/40 text-sm">Coming Soon</div>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-white/60 font-bold text-2xl mb-3">Coming Soon</h3>
            <p className="text-white/40 text-base leading-relaxed">
              More exciting games are on the way. Stay tuned for updates!
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-white/40 text-sm">
                <span>🃏</span>
                <span>Blackjack</span>
              </div>
              <div className="flex items-center space-x-2 text-white/40 text-sm">
                <span>🎰</span>
                <span>Slots</span>
              </div>
              <div className="flex items-center space-x-2 text-white/40 text-sm">
                <span>🎯</span>
                <span>Plinko</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
