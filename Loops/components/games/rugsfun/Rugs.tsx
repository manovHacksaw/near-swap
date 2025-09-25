"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, TrendingUp } from "lucide-react"
import { formatNEAR, formatGameCurrency, getConversionText } from "@/lib/currencyUtils"

interface Player {
  id: string
  name: string
  bet: number
  cashout?: number
  multiplier: number
  isActive: boolean
}

interface GameRound {
  multiplier: number
  crashed: boolean
  isRunning: boolean
}

interface HistoryRound {
  multiplier: number
  timestamp: number
}

interface CrashGameProps {
  compact?: boolean
}

export default function CrashGame({ compact = false }: CrashGameProps) {
  const [betAmount, setBetAmount] = useState("0.00")
  const [autoCashout, setAutoCashout] = useState("2.00")
  const [gameMode, setGameMode] = useState<"manual" | "auto">("manual")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasBet, setHasBet] = useState(false)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [gameRound, setGameRound] = useState<GameRound>({ multiplier: 1.0, crashed: false, isRunning: false })
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([])
  const [totalProfit, setTotalProfit] = useState("0.00")
  const [roundHistory, setRoundHistory] = useState<HistoryRound[]>([
    { multiplier: 5.3, timestamp: Date.now() - 1000 },
    { multiplier: 4.19, timestamp: Date.now() - 2000 },
    { multiplier: 1.0, timestamp: Date.now() - 3000 },
    { multiplier: 8.96, timestamp: Date.now() - 4000 },
    { multiplier: 1.72, timestamp: Date.now() - 5000 },
    { multiplier: 3.31, timestamp: Date.now() - 6000 },
    { multiplier: 4.17, timestamp: Date.now() - 7000 },
    { multiplier: 20.69, timestamp: Date.now() - 8000 },
    { multiplier: 1.78, timestamp: Date.now() - 9000 },
    { multiplier: 6.05, timestamp: Date.now() - 10000 },
    { multiplier: 1.78, timestamp: Date.now() - 11000 },
    { multiplier: 1.62, timestamp: Date.now() - 12000 },
    { multiplier: 1.0, timestamp: Date.now() - 13000 },
    { multiplier: 8.2, timestamp: Date.now() - 14000 },
    { multiplier: 1.0, timestamp: Date.now() - 15000 },
    { multiplier: 2.9, timestamp: Date.now() - 16000 },
    { multiplier: 1.0, timestamp: Date.now() - 17000 },
    { multiplier: 2.85, timestamp: Date.now() - 18000 },
  ])

  const [rainbowTrail, setRainbowTrail] = useState<{ x: number; y: number; age: number }[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Mock last winner data
  /* Removed last winner player UI */
  const [lastWinner] = useState<Player>({
    id: "1",
    name: "Sophie Bennett",
    bet: 0.5104,
    multiplier: 3.15,
    isActive: false,
  })

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 10) return "bg-primary text-primary-foreground"
    if (multiplier >= 5) return "bg-primary/80 text-primary-foreground"
    if (multiplier >= 2) return "bg-primary/20 text-primary"
    if (multiplier > 1) return "bg-muted text-foreground"
    return "bg-destructive text-destructive-foreground"
  }

  const getWeightedCrashPoint = (): number => {
    const r = Math.random()
    if (r < 0.02) return 1.0 + Math.random() * 0.2
    if (r < 0.42) return 1.2 + Math.random() * 0.8
    if (r < 0.77) return 2.0 + Math.random() * 3.0
    return 5.0 + Math.random() * 2.0
  }

  const startNewRound = () => {
    setGameRound({ multiplier: 1.0, crashed: false, isRunning: true })
    setCurrentMultiplier(1.0)
    setChartData([{ x: 0, y: 1.0 }])
    setTotalProfit("0.00")
    setRainbowTrail([])
    startTimeRef.current = Date.now()

    const crashPoint = getWeightedCrashPoint()

    gameIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const multiplier = Math.min(1 + elapsed * 0.3 + Math.pow(elapsed, 1.8) * 0.08, crashPoint)

      setCurrentMultiplier(multiplier)

      if (hasBet) {
        const bet = Number.parseFloat(betAmount) || 0
        const profit = bet * (multiplier - 1)
        setTotalProfit(profit.toFixed(2))
      }

      setChartData((prev) => {
        const lastPoint = prev[prev.length - 1]
        if (!lastPoint || elapsed - lastPoint.x > 0.1) {
          return [...prev.slice(-100), { x: elapsed, y: multiplier }]
        }
        return prev
      })

      if (gameRound.isRunning && !gameRound.crashed) {
        const rect = canvasRef.current?.getBoundingClientRect()
        const width = rect?.width || 0
        const height = rect?.height || 0
        const maxTime = Math.max(...chartData.map((d) => d.x), 10)
        const maxMultiplier = 7
        const padding = compact ? 40 : 60

        const clampedMultiplier = Math.min(multiplier, maxMultiplier)
        const currentPoint = {
          x: padding + (elapsed / maxTime) * (width - padding - 20),
          y: height - padding - ((clampedMultiplier - 1.0) / (maxMultiplier - 1.0)) * (height - 2 * padding),
          age: 0,
        }

        setRainbowTrail((prev) => {
          const newTrail = [currentPoint, ...prev.map((p) => ({ ...p, age: p.age + 1 })).filter((p) => p.age < 50)]
          return newTrail.slice(0, 100)
        })
      }

      if (multiplier >= crashPoint) {
        setGameRound({ multiplier: crashPoint, crashed: true, isRunning: false })
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current)
        }

        if (hasBet && isPlaying) {
          setTotalProfit("0.00")
          setIsPlaying(false)
          setHasBet(false)
        }

        setRoundHistory((prev) => [{ multiplier: crashPoint, timestamp: Date.now() }, ...prev.slice(0, 17)])

        setTimeout(() => {
          startNewRound()
        }, 4000)
      }
    }, 50)
  }

  useEffect(() => {
    startNewRound()
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = rect.width + "px"
    canvas.style.height = rect.height + "px"

    ctx.clearRect(0, 0, rect.width, rect.height)
    const computedBg = window.getComputedStyle(canvas).backgroundColor || "transparent"
    ctx.fillStyle = computedBg
    ctx.fillRect(0, 0, rect.width, rect.height)

    const width = rect.width
    const height = rect.height
    const padding = compact ? 40 : 60

    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 1.5

    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    for (let i = 0; i <= 7; i++) {
      const y = height - padding - (i / 7) * (height - 2 * padding)
      const label = (1.0 + i).toFixed(2) + "x"
      ctx.beginPath()
      ctx.moveTo(padding - 6, y)
      ctx.lineTo(padding, y)
      ctx.stroke()
      ctx.fillText(label, padding - 10, y)
    }

    const axisMaxTime = Math.max(...chartData.map((d) => d.x), 10)
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding)
      const t = (i / 10) * axisMaxTime
      ctx.beginPath()
      ctx.moveTo(x, height - padding)
      ctx.lineTo(x, height - padding + 6)
      ctx.stroke()
      ctx.fillText(`${Math.round(t)}s`, x, height - padding + 8)
    }

    if (chartData.length > 1) {
      const maxTime = Math.max(...chartData.map((d) => d.x), 10)
      const maxMultiplier = 7

      const lineGradient = ctx.createLinearGradient(0, height, 0, 0)
      if (gameRound.crashed) {
        lineGradient.addColorStop(0, "#ff1744")
        lineGradient.addColorStop(0.5, "#ff5722")
        lineGradient.addColorStop(1, "#ff9800")
      } else {
        lineGradient.addColorStop(0, "#00e676")
        lineGradient.addColorStop(0.5, "#1de9b6")
        lineGradient.addColorStop(1, "#00bcd4")
      }

      ctx.strokeStyle = lineGradient
      ctx.lineWidth = 3
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.shadowColor = gameRound.crashed ? "#ff1744" : "#00e676"
      ctx.shadowBlur = 8

      ctx.beginPath()
      let rocketX = 0
      let rocketY = 0

      chartData.forEach((point, index) => {
        const x = padding + (point.x / maxTime) * (width - padding - 20)
        const y = height - padding - ((Math.min(point.y, maxMultiplier) - 1.0) / (maxMultiplier - 1.0)) * (height - 2 * padding)

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        if (index === chartData.length - 1) {
          rocketX = x
          rocketY = y
        }
      })
      ctx.stroke()
      ctx.shadowBlur = 0

      if (rainbowTrail.length > 0) {
        rainbowTrail.forEach((point) => {
          const alpha = Math.max(0, 1 - point.age / 50)
          const trailWidth = 8 * alpha

          const colors = [
            `rgba(255, 0, 0, ${alpha})`,
            `rgba(255, 165, 0, ${alpha})`,
            `rgba(255, 255, 0, ${alpha})`,
            `rgba(0, 255, 0, ${alpha})`,
            `rgba(0, 0, 255, ${alpha})`,
            `rgba(75, 0, 130, ${alpha})`,
            `rgba(238, 130, 238, ${alpha})`,
          ]

          colors.forEach((color, colorIndex) => {
            ctx.fillStyle = color
            ctx.fillRect(point.x - 40 - colorIndex * 8, point.y - trailWidth / 2 + colorIndex * 2, 30, trailWidth)
          })
        })
      }

      if (gameRound.isRunning && !gameRound.crashed) {
        const catImg = new Image()
        catImg.crossOrigin = "anonymous"
        catImg.src = "/cat.png"

        if (catImg.complete) {
          ctx.drawImage(catImg, rocketX - 30, rocketY - 30, 60, 60)
        } else {
          ctx.font = "32px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("🐱", rocketX, rocketY)
        }

        for (let i = 0; i < 5; i++) {
          const sparkleX = rocketX + (Math.random() - 0.5) * 60
          const sparkleY = rocketY + (Math.random() - 0.5) * 60
          ctx.font = "16px Arial"
          ctx.fillText("✨", sparkleX, sparkleY)
        }
      } else if (gameRound.crashed) {
        ctx.shadowColor = "#ff1744"
        ctx.shadowBlur = 20
        ctx.font = "28px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("💥", rocketX, rocketY)
      }
      ctx.shadowBlur = 0
    }
  }, [chartData, gameRound.crashed, gameRound.isRunning, compact])

  const handleBet = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setHasBet(false)
    } else if (gameRound.isRunning) {
      setHasBet(true)
      setIsPlaying(true)
    }
  }

  const adjustBetAmount = (factor: number) => {
    const current = Number.parseFloat(betAmount) || 0
    setBetAmount((current * factor).toFixed(2))
  }

  return (
    <div className="flex h-full text-foreground relative overflow-hidden min-h-0">
      <div className={`relative z-10 ${compact ? "w-64" : "w-80"} border border-border bg-background/60 backdrop-blur ${compact ? "p-4" : "p-6"} h-full overflow-hidden`}>
        <div className="space-y-5">
          <div className="flex rounded-2xl p-1 border border-border bg-background/60">
            <button
              onClick={() => setGameMode("manual")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                gameMode === "manual" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Manual
            </button>
            <button
              onClick={() => setGameMode("auto")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                gameMode === "auto" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground hover:bg-muted"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Auto
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-foreground/70 font-medium">Bet Amount</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-background/70 border border-border text-foreground pr-20 focus:border-primary/50 focus:ring-primary/20 h-10 rounded-2xl"
                  placeholder="0.00"
                  disabled={isPlaying}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  <button
                    onClick={() => adjustBetAmount(0.5)}
                    className="text-foreground/80 hover:text-foreground text-xs font-bold px-2 py-1 rounded-md hover:bg-muted transition-all border border-border"
                    disabled={isPlaying}
                  >
                    ½
                  </button>
                  <button
                    onClick={() => adjustBetAmount(2)}
                    className="text-foreground/80 hover:text-foreground text-xs font-bold px-2 py-1 rounded-md hover:bg-muted transition-all border border-border"
                    disabled={isPlaying}
                  >
                    2×
                  </button>
                </div>
              </div>
            </div>
            <div className="text-xs text-foreground/50">0.00 NEAR</div>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-foreground/70 font-medium">Auto Cashout</label>
            <Input
              value={autoCashout}
              onChange={(e) => setAutoCashout(e.target.value)}
              className="bg-background/70 border border-border text-foreground h-10 rounded-2xl focus:border-primary/50"
              placeholder="2.00"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-foreground/70 font-medium">Recent Results</label>
            <div className="flex flex-wrap gap-1">
              {roundHistory.slice(0, 10).map((round, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded text-xs font-bold ${getMultiplierColor(round.multiplier)}`}
                >
                  {round.multiplier.toFixed(2)}x
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleBet}
            disabled={!gameRound.isRunning && !isPlaying}
            className="w-full font-semibold py-3 h-12 rounded-2xl"
          >
            {isPlaying ? "💰 Cash Out" : "🚀 Place Bet"}
          </Button>

          <div className="space-y-3">
            <label className="text-sm text-foreground/70 font-medium">Total Profit ({currentMultiplier.toFixed(2)}×)</label>
            <div className="flex items-center space-x-3">
              <Input
                value={totalProfit}
                readOnly
                className="bg-background/70 border border-border text-foreground flex-1 h-9 rounded-2xl"
              />
              <div className="w-8 h-8 rounded-full flex items-center justify-center border border-border bg-background/60">
                <span className="text-foreground text-[10px] font-bold">NEAR</span>
              </div>
            </div>
            <div className="text-xs text-foreground/50">0.00 NEAR</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <div className={`flex-1 relative ${compact ? "p-2" : "p-3"} min-h-0`}>
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl bg-background/30 border border-border"
            style={{ minHeight: compact ? "280px" : "360px" }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`text-5xl font-bold ${gameRound.crashed ? "text-destructive" : "text-foreground"}`}>
              {Math.min(currentMultiplier, 7).toFixed(2)}x
            </div>
          </div>

          {gameRound.crashed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold text-destructive animate-pulse mt-16">CRASHED!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
