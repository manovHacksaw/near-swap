"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import confetti from "canvas-confetti"
import { X, Copy, Eye, EyeOff } from "lucide-react"
import { useSound } from "@/lib/useSound"
import {
  type GameSession,
  type GameStats,
  initializeGameSession,
  generateFlipResult,
  updateGameStats,
  calculateWinRate,
  calculateRTP,
  calculateMultiplier,
  calculatePayout,
} from "@/lib/provablyFair"
import { useWallet } from "@/contexts/WalletContext"
import { ContractService } from "@/lib/contractService"
import { formatNEAR, formatGameCurrency, getConversionText } from "@/lib/currencyUtils"

type GameStatus = "idle" | "flipping" | "won" | "lost" | "streak-active"

type Side = "heads" | "tails"

interface CoinFlipProps {
  compact?: boolean
}

type PopupType = "win" | "lose" | "cashout" | null

type PopupState = {
  isOpen: boolean
  type: PopupType
}

export function CoinFlip({ compact = false }: CoinFlipProps) {
  const { selector, accountId, isConnected } = useWallet()
  const [contractService, setContractService] = React.useState<ContractService | null>(null)
  const [isStaking, setIsStaking] = React.useState(false)
  // Game state
  const [status, setStatus] = React.useState<GameStatus>("idle")
  const [selectedSide, setSelectedSide] = React.useState<Side | null>(null)
  const [betAmount, setBetAmount] = React.useState<string>("0.10")
  const [popup, setPopup] = React.useState<PopupState>({ isOpen: false, type: null })
  const [isFlipping, setIsFlipping] = React.useState(false)
  const [result, setResult] = React.useState<Side | null>(null)
  const [flipCount, setFlipCount] = React.useState(0)
  const [hasStaked, setHasStaked] = React.useState(false) // Track if player has staked

  // Provably fair system
  const [gameSession, setGameSession] = React.useState<GameSession | null>(null)
  const [clientSeed, setClientSeed] = React.useState<string>("")
  const [showServerSeed, setShowServerSeed] = React.useState(false)
  const [streakHistory, setStreakHistory] = React.useState<number[]>([])

  // Initialize contract service when wallet is connected
  React.useEffect(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        setContractService(new ContractService(selector, account))
      }
    }
  }, [selector, accountId])

  // Streak system
  const [currentStreak, setCurrentStreak] = React.useState(0)
  const [canCashOut, setCanCashOut] = React.useState(false)
  const [totalPayout, setTotalPayout] = React.useState(0)
  const [gameEnded, setGameEnded] = React.useState(false)

  // Game statistics
  const [gameStats, setGameStats] = React.useState<GameStats>({
    totalFlips: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
    totalWinnings: 0,
    totalBets: 0,
  })

  // Sound effects
  const [BetSound] = useSound("/sounds/Bet.mp3");
  const [paajiWinSound] = useSound("/sounds/Gems.mp3");
  const [CashoutSound] = useSound("/sounds/Cashout.mp3");
  const [BombSound] = useSound("/sounds/Bomb.mp3");

  // Initialize game session when component mounts
  React.useEffect(() => {
    const session = initializeGameSession()
    setGameSession(session)
    setClientSeed(session.clientSeed)
  }, [])

  // Calculate current multiplier
  const currentMultiplier = React.useMemo(() => {
    return calculateMultiplier(currentStreak)
  }, [currentStreak])

  // Calculate potential payout
  const potentialPayout = React.useMemo(() => {
    const bet = Number.parseFloat(betAmount) || 0
    return calculatePayout(bet, currentMultiplier)
  }, [betAmount, currentMultiplier])

  const startGame = (side?: Side) => {
    const sideToUse = side || selectedSide
    if (!sideToUse || !gameSession) {
      return
    }

    // Set the selected side if provided
    if (side) {
      setSelectedSide(side)
    }

    BetSound()
    setStatus("flipping")
    setIsFlipping(true)
    setFlipCount(0)

    // Simulate coin flip animation
    const flipInterval = setInterval(() => {
      setFlipCount((prev) => prev + 1)
    }, 100)

    // Stop flipping after 2 seconds and determine result
    setTimeout(() => {
      clearInterval(flipInterval)
      setIsFlipping(false)

      // Generate provably fair result
      const flipResult = generateFlipResult(
        gameSession.serverSeed,
        gameSession.clientSeed,
        gameSession.nonce,
        sideToUse,
        currentStreak,
      )

      setResult(flipResult.result)

      // Update game session nonce
      setGameSession((prev) => (prev ? { ...prev, nonce: prev.nonce + 1 } : null))

      // Get bet amount for calculations
      const bet = Number.parseFloat(betAmount)

      // Update statistics
      setGameStats((prev) => updateGameStats(prev, flipResult, bet))

      if (flipResult.isWin) {
        // Player won - increment streak
        const newStreak = currentStreak + 1
        setCurrentStreak(newStreak)
        setCanCashOut(true)
        setTotalPayout(calculatePayout(bet, flipResult.multiplier))

        if (newStreak >= 5) { // Max streak is 5 (2.0X multiplier)
          // Auto cashout at max streak
          setStatus("won")
          setGameEnded(true)
          setHasStaked(false) // Reset staking status
          CashoutSound()
          setPopup({ isOpen: true, type: "cashout" })
        } else {
          setStatus("streak-active")
          paajiWinSound()
          // Reset selected side so user can choose again
          setSelectedSide(null)
        }
      } else {
        // Player lost - game ends immediately
        setStatus("lost")
        setCurrentStreak(0)
        setCanCashOut(false)
        setTotalPayout(0)
        setGameEnded(true)
        setHasStaked(false) // Reset staking status
        BombSound()
        setPopup({ isOpen: true, type: "lose" })
      }
    }, 2000)
  }

  // Stake once at the beginning
  const stakeOnce = async () => {
    const bet = Number.parseFloat(betAmount)
    if (bet <= 0 || isNaN(bet)) return
    if (!isConnected || !contractService) {
      // If no wallet, just set as staked and continue
      setHasStaked(true)
      setStatus("streak-active")
      return
    }
    try {
      setIsStaking(true)
      const gameId = `coinflip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      await contractService.startGame(gameId, betAmount, "coinflip")
      // After staking successfully, set as staked
      setHasStaked(true)
      setStatus("streak-active")
    } catch (err) {
      console.error("Stake failed:", err)
    } finally {
      setIsStaking(false)
    }
  }

  // Play a round (after staking)
  const playRound = () => {
    if (!hasStaked) return
    startGame()
  }

  const cashOut = () => {
    if (canCashOut && currentStreak > 0) {
      setStatus("won")
      setCanCashOut(false)
      setGameEnded(true)
      CashoutSound()
      setPopup({ isOpen: true, type: "cashout" })
    }
  }

  const resetGame = () => {
    setStatus("idle")
    setSelectedSide(null)
    setResult(null)
    setIsFlipping(false)
    setFlipCount(0)
    setCurrentStreak(0)
    setCanCashOut(false)
    setTotalPayout(0)
    setStreakHistory([])
    setGameEnded(false)
    setHasStaked(false) // Reset staking status
    setPopup({ isOpen: false, type: null })

    // Initialize new game session
    const newSession = initializeGameSession(clientSeed)
    setGameSession(newSession)
  }

  const generateNewClientSeed = () => {
    const newSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setClientSeed(newSeed)
    if (gameSession) {
      setGameSession({ ...gameSession, clientSeed: newSeed, nonce: 0 })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  React.useEffect(() => {
    if (status === "lost") {
      setPopup({ isOpen: true, type: "lose" })
    }
  }, [status])

  // Confetti effect for wins
  React.useEffect(() => {
    if (!(popup.isOpen && (popup.type === "win" || popup.type === "cashout"))) return

    const end = Date.now() + 3 * 1000
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]
    let rafId: number
    let cancelled = false

    const frame = () => {
      if (cancelled) return
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors,
      })

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [popup])

  const closePopup = () => setPopup({ isOpen: false, type: null })

  const adjustBetAmount = (factor: number) => {
    const current = Number.parseFloat(betAmount) || 0
    setBetAmount((current * factor).toFixed(2))
  }

  const getFlipAnimation = () => {
    if (!isFlipping) return ""
    return "flip-3d"
  }

  const getCoinRotation = () => {
    if (isFlipping) return ""
    if (!result) return ""
    return result === "tails" ? "rotateY(180deg)" : "rotateY(0deg)"
  }

  const winRate = calculateWinRate(gameStats)
  const rtp = calculateRTP(gameStats)

  return (
    <div className="mx-auto max-w-6xl w-full pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Left control panel */}
        <div className="rounded-2xl border border-border bg-background/60 p-3 lg:p-4">
          <div className="space-y-3">
            {/* Game Stats */}
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-4xl p-3 text-center">
              <p className="text-blue-400 text-sm font-medium">
                🎯 Current Streak: {currentStreak} | Max: {gameStats.maxStreak}
              </p>
              <p className="text-blue-300 text-xs">
                Win Rate: {winRate.toFixed(1)}% | RTP: {rtp.toFixed(1)}%
              </p>
            </div>

            {/* Client Seed Input */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Client Seed</div>
              <div className="flex items-center gap-2">
                <Input
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="flex-1 text-xs font-mono"
                  placeholder="Enter custom seed"
                />
                <Button onClick={generateNewClientSeed} variant="outline" size="sm" className="text-xs bg-transparent">
                  Random
                </Button>
              </div>
            </div>

            {/* Bet Amount */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Bet Amount</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                  <Input
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full bg-transparent outline-none border-0 h-8 p-0"
                    placeholder="0.10"
                    disabled={status === "flipping"}
                  />
                </div>
                <div className="text-xs text-muted-foreground px-2">
                  NEAR
                </div>
                <button
                  onClick={() => adjustBetAmount(0.5)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={status === "flipping"}
                >
                  ½
                </button>
                <button
                  onClick={() => adjustBetAmount(2)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={status === "flipping"}
                >
                  2×
                </button>
              </div>
              <div className="mt-1 text-[11px] text-foreground/50">Min: 0.01 NEAR</div>
            </div>

            {/* Side Selection */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Choose Side</div>
              <div className="grid grid-cols-2 gap-2">
                {["heads", "tails"].map((side) => (
                  <button
                    key={side}
                    onClick={() => setSelectedSide(side as Side)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm capitalize",
                      selectedSide === side
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-foreground/80 hover:bg-muted",
                    )}
                    disabled={status === "flipping"}
                    aria-pressed={selectedSide === side}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="pt-1 space-y-2">
              {!hasStaked ? (
                // Initial stake button
                <Button 
                  className="w-full h-10 rounded-xl" 
                  onClick={stakeOnce} 
                  disabled={isStaking}
                >
                  {isStaking ? "Staking..." : "🎯 Stake & Start"}
                </Button>
              ) : status === "streak-active" && !gameEnded ? (
                // After staking, show play/cashout options
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="h-10 rounded-xl"
                    onClick={playRound}
                    disabled={!selectedSide}
                  >
                    Play Round
                  </Button>
                  <Button className="h-10 rounded-xl bg-green-600 hover:bg-green-700" onClick={cashOut}>
                    Cash Out
                  </Button>
                </div>
              ) : gameEnded ? (
                // Game ended, start new game
                <Button className="w-full h-10 rounded-xl" onClick={stakeOnce} disabled={isStaking}>
                  🎯 New Game
                </Button>
              ) : status === "flipping" ? (
                <Button variant="ghost" className="w-full h-10 rounded-xl" disabled>
                  Flipping...
                </Button>
              ) : (
                // Default state
                <Button className="w-full h-10 rounded-xl" onClick={stakeOnce} disabled={isStaking}>
                  {isStaking ? "Staking..." : "🎯 Stake & Start"}
                </Button>
              )}
            </div>

            {/* Current Multiplier & Payout */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Current Multiplier ({currentMultiplier.toFixed(2)}×)
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                <span className="text-foreground/60">{formatGameCurrency(potentialPayout.toString())}</span>
              </div>
            </div>

            {/* Game Status */}
            <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-foreground/80">
              {!hasStaked && "Stake once to start playing multiple rounds!"}
              {hasStaked && status === "idle" && "Choose Heads or Tails to play your first round!"}
              {status === "flipping" && "The coin is flipping..."}
              {status === "streak-active" &&
                !gameEnded &&
                `Streak: ${currentStreak}! Choose your side to continue or cash out.`}
              {status === "won" && `You cashed out at ${currentStreak} streak! Start a new game to play again.`}
              {status === "lost" &&
                `Game over! The coin landed on ${result?.toUpperCase()}. Start a new game to play again.`}
            </div>
          </div>
        </div>

        {/* Right game panel */}
        <div className="relative rounded-2xl bg-background/60 p-3 lg:p-5">
          

          <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-6">
            <div className="coin-flip-container">
              <div className="coin-stage">
                <div
                  className={cn("coin-3d", getFlipAnimation())}
                  style={!isFlipping ? { transform: getCoinRotation() } : undefined}
                >
                  <div className="coin-face coin-front">
                    <img src="/coin-head.png" alt="heads" />
                  </div>
                  <div className="coin-face coin-back">
                    <img src="/coin-tails.png" alt="tails" />
                  </div>
                </div>
              </div>

              {/* Streak indicator */}
              {currentStreak > 0 && (
                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm z-10">
                  {currentStreak}
                </div>
              )}

              {/* Result indicator */}
              {result && !isFlipping && (
                <div
                  className={cn(
                    "absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm z-10",
                    result === selectedSide ? "bg-green-500" : "bg-red-500",
                  )}
                >
                  {result === selectedSide ? "✓" : "✗"}
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {isFlipping ? "Flipping..." : result ? `${result.toUpperCase()}` : "Coin Flip"}
              </h2>
              <p className="text-foreground/70">
                {isFlipping
                  ? "The coin is spinning..."
                  : result
                    ? `The coin landed on ${result.toUpperCase()}`
                    : "Choose your side to start!"}
              </p>
              {currentStreak > 0 && (
                <p className="text-green-400 font-semibold">
                  🔥 Streak: {currentStreak} | Multiplier: {currentMultiplier.toFixed(2)}×
                </p>
              )}
              {gameEnded && (
                <p className="text-orange-400 font-semibold">
                  {status === "won" ? "🎉 Game Complete!" : "💥 Game Over!"}
                </p>
              )}
            </div>

            {/* Side Selection Visual */}
            {!isFlipping && !result && hasStaked && status !== "streak-active" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  {["heads", "tails"].map((side) => (
                    <button
                      key={side}
                      onClick={() => setSelectedSide(side as Side)}
                      className={cn(
                        "px-6 py-3 rounded-xl border-2 text-lg font-semibold capitalize transition-all",
                        selectedSide === side
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground/60 hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {side}
                    </button>
                  ))}
                </div>
                <Button className="min-w-[160px]" onClick={playRound} disabled={!selectedSide}>
                  Play Round
                </Button>
              </div>
            )}

            {/* Side Selection for Streak Active State */}
            {status === "streak-active" && !gameEnded && !isFlipping && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  {["heads", "tails"].map((side) => (
                    <button
                      key={side}
                      onClick={() => setSelectedSide(side as Side)}
                      className={cn(
                        "px-6 py-3 rounded-xl border-2 text-lg font-semibold capitalize transition-all",
                        selectedSide === side
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground/60 hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {side}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button className="min-w-[140px]" onClick={playRound} disabled={!selectedSide}>
                    Play Round
                  </Button>
                  <Button variant="secondary" className="min-w-[140px]" onClick={cashOut}>
                    Cash Out
                  </Button>
                </div>
              </div>
            )}

            {/* Streak History */}
            {streakHistory.length > 0 && (
              <div className="w-full max-w-md">
                <h3 className="text-sm font-semibold text-foreground/80 mb-2">Previous Streaks</h3>
                <div className="flex flex-wrap gap-1">
                  {streakHistory.map((streak, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold"
                    >
                      {streak}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popup Modal */}
        {popup.isOpen && (
          <div
            onClick={closePopup}
            className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-background/60 backdrop-blur-xl border border-border rounded-3xl p-8 w-full max-w-md relative shadow-2xl"
            >
              <button
                type="button"
                onClick={closePopup}
                className="absolute top-4 right-4 z-10 pointer-events-auto text-foreground/60 hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-3">
                {popup.type === "lose" ? (
                  <>
                    <div className="w-32 h-32 mb-6 animate-bounce flex items-center justify-center mx-auto">
                      <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-destructive/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img
                        src="/sad-monkey.gif"
                        alt="Loss"
                        className="w-full h-full object-cover rounded-2xl opacity-80"
                      />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-destructive">Game Over!</h2>
                    <p className="text-foreground/70 text-base">
                      The coin landed on {result?.toUpperCase()}. Place a new bet to start again!
                    </p>
                  </>
                ) : popup.type === "cashout" ? (
                  <>
                    <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                      <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-primary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img
                        src="/nachoo.gif"
                        alt="Win"
                        className="w-full h-full object-contain rounded-2xl opacity-80"
                      />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-primary">Cashed Out!</h2>
                    <p className="text-foreground/70 text-base">
                      Streak: {currentStreak} | Multiplier: {currentMultiplier.toFixed(2)}× | Won: {formatGameCurrency(totalPayout.toString())}
                    </p>
                    <p className="text-foreground/60 text-sm">Place a new bet to start again!</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                      <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-primary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img
                        src="/nachoo.gif"
                        alt="Win"
                        className="w-full h-full object-contain rounded-2xl opacity-80"
                      />
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-wide uppercase text-primary">You Won!</h2>
                    <p className="text-foreground/70 text-base">
                      The coin landed on {result?.toUpperCase()}! Choose your side to continue or cash out!
                    </p>
                  </>
                )}

                <Button onClick={closePopup} className="w-full h-12 rounded-2xl font-semibold">
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .coin-flip-container {
          position: relative;
          width: 520px;
          height: 520px;
        }
        .coin-stage {
          position: relative;
          width: 100%;
          height: 100%;
          perspective: 1000px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .coin-3d {
          position: relative;
          width: 500px;
          height: 500px;
          transform-style: preserve-3d;
          transition: transform 800ms cubic-bezier(0.2, 0.6, 0.2, 1);
        }
        .coin-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          backface-visibility: hidden;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: none;
        }
        .coin-face img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .coin-front {
          transform: rotateY(0deg) translateZ(1px);
        }
        .coin-back {
          transform: rotateY(180deg) translateZ(1px);
        }
        @keyframes coinFlip3D {
          0% { transform: rotateY(0deg) rotateX(0deg); }
          25% { transform: rotateY(180deg) rotateX(15deg); }
          50% { transform: rotateY(360deg) rotateX(0deg); }
          75% { transform: rotateY(540deg) rotateX(-15deg); }
          100% { transform: rotateY(720deg) rotateX(0deg); }
        }
        .flip-3d {
          animation: coinFlip3D 2000ms cubic-bezier(0.2, 0.6, 0.2, 1);
        }
      `}</style>
    </div>
  )
}

export default CoinFlip
