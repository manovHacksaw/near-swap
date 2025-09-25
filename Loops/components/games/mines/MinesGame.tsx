"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { useSound } from "@/lib/useSound"
import confetti from "canvas-confetti"
import { ContractService } from "@/lib/contractService"
import { useWallet } from "@/contexts/WalletContext"
import { useContract } from "@/contexts/ContractProvider"
import { gameOutcomeService } from "@/lib/gameOutcomeService"
import { formatNEAR, formatGameCurrency, getConversionText } from "@/lib/currencyUtils"

interface MineCell {
  id: number
  isRevealed: boolean
  isMine: boolean
  isGem: boolean
}

interface PopupState {
  isOpen: boolean
  type: "mine" | "gem" | null
  cellId: number | null
}

interface MinesGameProps {
  compact?: boolean
  onBack?: () => void
}

export default function MinesGame({ compact = false, onBack }: MinesGameProps) {
  const { selector, accountId, isConnected, getBalance, isBalanceLoading } = useWallet()
  const { getUserStats } = useContract()
  const [betAmount, setBetAmount] = useState("0.10")
  const [mineCount, setMineCount] = useState("3")
  const [gemCount, setGemCount] = useState("22")
  const [totalProfit, setTotalProfit] = useState("0.00")
  const [gameMode, setGameMode] = useState<"manual" | "auto">("manual")
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [multiplier, setMultiplier] = useState(1.0)
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, type: null, cellId: null })
  const [loseImageSrc, setLoseImageSrc] = useState("/sad-monkey.gif")
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [gameId, setGameId] = useState<string>("")
  const [transactionHash, setTransactionHash] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [walletBalance, setWalletBalance] = useState<string>("0")
  const loseMessages = [
    "Every pro loses once. Bounce back stronger.",
    "Close call? Your comeback starts here.",
    "The next bet could flip it all.",
    "Losses are just the setup for a bigger win.",
    "Don't stop now — your turn is coming.",
    "You were this close 👌 — go again.",
    "Even champions lose a round. Win the next one.",
  ]
  const [loseMessage, setLoseMessage] = useState(loseMessages[0])
  const [grid, setGrid] = useState<MineCell[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false,
      isGem: false,
    })),
  )
  const [BetSound] = useSound("/sounds/Bet.mp3");
  const [BombSound] = useSound("/sounds/Bomb.mp3");
  const [CashoutSound] = useSound("/sounds/Cashout.mp3");
  const [GemsSound] = useSound("/sounds/Gems.mp3");

  // Resolve game directly
  const resolveGame = async (didWin: boolean, finalMultiplier: number) => {
    if (!gameId || !accountId) {
      console.log("❌ Cannot resolve game - missing gameId or accountId");
      return;
    }

    try {
      console.log(`🚀 Resolving game: ${gameId}, Win: ${didWin}, Multiplier: ${finalMultiplier}`);
      
      await gameOutcomeService.resolveGame({
        gameId,
        didWin,
        multiplier: finalMultiplier,
        timestamp: Date.now(),
        gameType: "mines",
        player: accountId
      });
      
      if (didWin) {
        setSuccessMessage(`🎉 Game won! Resolved at ${finalMultiplier.toFixed(2)}× multiplier.`);
      } else {
        setSuccessMessage(`Game resolved successfully.`);
      }
    } catch (error: any) {
      console.error("❌ Error resolving game:", error);
      setErrorMessage(`Failed to resolve game: ${error.message}`);
    }
  };

  // Per-reveal multiplier factors based on number of mines
  const perRevealMultiplierByMines: Record<number, number> = {
    3: 1.15,
    4: 1.25,
    5: 1.35,
    6: 1.45,
    7: 1.55,
    8: 1.65,
    9: 1.75,
    10: 1.85,
    11: 2.0,
    12: 2.2,
    13: 2.4,
    14: 2.6,
    15: 2.8,
    16: 3.0,
    17: 3.25,
    18: 3.5,
    19: 3.75,
    20: 4.0,
    21: 4.5,
  }

  const getPerRevealFactor = (mines: number) => {
    if (perRevealMultiplierByMines[mines as keyof typeof perRevealMultiplierByMines]) {
      return perRevealMultiplierByMines[mines as keyof typeof perRevealMultiplierByMines]
    }
    // Clamp outside the provided range to nearest known value
    if (mines < 3) return perRevealMultiplierByMines[3]
    return perRevealMultiplierByMines[21]
  }

  useEffect(() => {
    const mines = Number.parseInt(mineCount)
    const gems = 25 - mines
    setGemCount(gems.toString())
  }, [mineCount])

  // Initialize contract service when wallet is connected
  useEffect(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        setContractService(new ContractService(selector, account))
      }
    }
  }, [selector, accountId])

  // Fetch wallet balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && getBalance) {
        try {
          const balance = await getBalance()
          setWalletBalance(balance)
        } catch (error) {
          console.error("Error fetching balance:", error)
        }
      }
    }
    
    fetchBalance()
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [isConnected, getBalance])

  // Clear messages after a delay
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
    setTransactionHash("")
  }

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  const initializeGame = () => {
    const mines = Number.parseInt(mineCount)
    const newGrid = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isRevealed: false,
      isMine: false,
      isGem: false,
    }))

    const minePositions = new Set<number>()
    while (minePositions.size < mines) {
      const randomPos = Math.floor(Math.random() * 25)
      minePositions.add(randomPos)
    }

    newGrid.forEach((cell, index) => {
      if (minePositions.has(index)) {
        cell.isMine = true
      } else {
        cell.isGem = true
      }
    })

    setGrid(newGrid)
    setGameOver(false)
    setMultiplier(1.0)
    setTotalProfit("0.00")
  }

  const handleCellClick = async (cellId: number) => {
    if (!isPlaying || gameOver) return

    const cell = grid[cellId]
    if (cell.isRevealed) return

    setGrid((prev) => prev.map((c) => (c.id === cellId ? { ...c, isRevealed: true } : c)))

    if (cell.isMine) {
      BombSound()
      setLoseImageSrc(Math.random() < 0.5 ? "/loosewin.png" : "/sad-monkey.gif")
      setLoseMessage(loseMessages[Math.floor(Math.random() * loseMessages.length)])
      setPopup({ isOpen: true, type: "mine", cellId })
      setGrid((prev) => prev.map((c) => (c.isMine ? { ...c, isRevealed: true } : c)))
      setGameOver(true)
      setIsPlaying(false)
      setTotalProfit("0.00")
      
      // Game lost - resolve directly
      console.log("💥 User hit mine - game lost")
      resolveGame(false, 1.0)
    } else {
      // Update multiplier based on per-reveal factor tied to mine count
      const mines = Number.parseInt(mineCount)
      const factor = getPerRevealFactor(mines)
      const newMultiplier = multiplier * factor
      setMultiplier(newMultiplier)
      GemsSound()

      const bet = Number.parseFloat(betAmount) || 0
      const profit = bet * (newMultiplier - 1)
      setTotalProfit(profit.toFixed(2))
    }
  }

  const handleBet = async () => {
    clearMessages()
    
    if (!contractService || !isConnected) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    if (isPlaying) {
      // User is cashing out - automatically resolve
      console.log("💰 User cashing out at multiplier:", multiplier)
      
      CashoutSound()
      setPopup({ isOpen: true, type: "gem", cellId: null })
      setIsPlaying(false)
      setGameOver(true)
      
      // Resolve game directly
      resolveGame(true, multiplier)
    } else {
      // Start new game - validate bet amount first
      const bet = Number.parseFloat(betAmount)
      if (bet <= 0 || isNaN(bet)) {
        setErrorMessage("Please enter a valid bet amount")
        return
      }
      
      if (bet < 0.01) {
        setErrorMessage("Minimum bet amount is 0.01 NEAR")
        return
      }
      
      try {
        setIsLoading(true)
        const newGameId = `mines-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setGameId(newGameId)
        
        const hash = await contractService.startGame(newGameId, betAmount, "mines")
        setTransactionHash(hash)
        setSuccessMessage(`Game started! Transaction: ${hash.slice(0, 8)}...`)
        
        setIsPlaying(true)
        initializeGame()
        BetSound()
      } catch (error: any) {
        console.error("Error starting game:", error)
        let errorMsg = "Error starting game. Please try again."
        
        // @ts-ignore - best effort error message
        if (error.message?.includes("User closed the window")) {
          errorMsg = "Transaction cancelled. Please try again when ready."
        // @ts-ignore - best effort error message
        } else if (error.message?.includes("insufficient balance")) {
          errorMsg = "Insufficient balance. Please add more NEAR to your wallet."
        // @ts-ignore - best effort error message
        } else if (error.message?.includes("already have a pending bet")) {
          errorMsg = "You already have a pending bet. Please wait for it to be resolved."
        // @ts-ignore - best effort error message
        } else if (error.message) {
          errorMsg = error.message
        }
        
        setErrorMessage(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRandomPick = () => {
    if (!isPlaying || gameOver) return

    const unrevealedCells = grid.filter((cell) => !cell.isRevealed)
    if (unrevealedCells.length === 0) return

    const randomCell = unrevealedCells[Math.floor(Math.random() * unrevealedCells.length)]
    handleCellClick(randomCell.id)
  }

  const adjustBetAmount = (factor: number) => {
    const current = Number.parseFloat(betAmount) || 0
    setBetAmount((current * factor).toFixed(2))
  }

  const closePopup = () => {
    setPopup({ isOpen: false, type: null, cellId: null })
  }

  useEffect(() => {
    if (!(popup.isOpen && popup.type === "gem")) return

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

  return (
    <div className="mx-auto max-w-6xl w-full pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4">
        {/* Left control panel */}
        <div className={`rounded-2xl border border-border bg-background/40 p-3 lg:p-4`}>
          <div className="space-y-3">
            {/* Wallet Status */}
            {!isConnected ? (
              <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-4xl p-3 text-center">
                <p className="text-yellow-400 text-sm font-medium">
                  🔗 Connect your wallet to start playing
                </p>
              </div>
            ) : (
              <div className="bg-green-600/10 border border-green-500/20 rounded-4xl p-3 text-center">
                {isBalanceLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 border border-green-300 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-green-400 text-sm font-medium">Loading balance...</p>
                  </div>
                ) : (
                  <p className="text-green-400 text-sm font-medium">
                    💰 Balance: {walletBalance} NEAR
                  </p>
                )}
                <p className="text-green-300 text-xs">
                  Account: {accountId?.slice(0, 12)}...
                </p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-600/10 border border-red-500/20 rounded-4xl p-3 text-center">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ {errorMessage}
                </p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-600/10 border border-green-500/20 rounded-4xl p-3 text-center">
                <p className="text-green-400 text-sm font-medium">
                  ✅ {successMessage}
                </p>
              </div>
            )}

            {/* Transaction Hash */}
            {transactionHash && (
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-4xl p-3 text-center">
                <p className="text-blue-400 text-xs font-medium">
                  🔗 TX: {transactionHash.slice(0, 12)}...
                </p>
                <a 
                  href={`https://explorer.testnet.near.org/transactions/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-xs underline"
                >
                  View on Explorer
                </a>
              </div>
            )}

            {/* Game Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
              <button
                onClick={() => setGameMode("manual")}
                className={`h-8 rounded-lg text-xs font-semibold ${
                  gameMode === "manual"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted transition"
                }`}
                aria-pressed={gameMode === "manual"}
              >
                Manual
              </button>
              <button
                onClick={() => setGameMode("auto")}
                className={`h-8 rounded-lg text-xs font-semibold ${
                  gameMode === "auto"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted transition"
                }`}
                aria-pressed={gameMode === "auto"}
              >
                Auto
              </button>
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
                    disabled={isPlaying}
                  />
                </div>
                <div className="text-xs text-muted-foreground px-2">
                  NEAR
                </div>
                <button
                  onClick={() => adjustBetAmount(0.5)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={isPlaying}
                >
                  ½
                </button>
                <button
                  onClick={() => adjustBetAmount(2)}
                  className="h-9 rounded-xl border border-border px-2 text-xs text-foreground/80 hover:bg-muted"
                  disabled={isPlaying}
                >
                  2×
                </button>
              </div>
              <div className="mt-1 text-[11px] text-foreground/50">Min: 0.01 NEAR</div>
            </div>

            {/* Mines and Gems */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Mines</div>
                <Select value={mineCount} onValueChange={setMineCount} disabled={isPlaying}>
                  <SelectTrigger className="bg-background/70 border border-border h-10 rounded-xl focus:border-primary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background/90 backdrop-blur-md border border-border rounded-2xl">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-foreground hover:bg-muted focus:bg-muted rounded-lg">
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gems</div>
                <Input value={gemCount} readOnly className="bg-background/70 border border-border h-10 rounded-xl" />
              </div>
            </div>

            {/* Bet / Cash out */}
            <div className="pt-1">
              {!isPlaying ? (
                <Button 
                  className="w-full h-10 rounded-xl" 
                  onClick={handleBet}
                  disabled={!isConnected || isLoading}
                >
                  {isLoading ? "⏳ Processing..." : "🎯 Start Game"}
                </Button>
              ) : (
                <Button variant="secondary" className="w-full h-10 rounded-xl" onClick={handleBet}>
                  💰 Cash Out
                </Button>
              )}
            </div>

            {/* Random Pick */}
            <div>
              <Button onClick={handleRandomPick} variant="outline" className="w-full h-9 rounded-xl" disabled={!isPlaying || gameOver}>
                🎲 Random Pick
              </Button>
            </div>

            {/* Total Profit */}
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Total Profit ({multiplier.toFixed(2)}×)</div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm">
                <span className="text-foreground/60">{formatGameCurrency(totalProfit)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-border bg-background/30 px-3 py-2 text-xs text-foreground/70">
              {!isPlaying && !gameOver && "Press Start Game to begin. Reveal safe gems to increase multiplier."}
              {isPlaying && !gameOver && "Game in progress. Click tiles to reveal. Cash out anytime."}
              {gameOver && totalProfit !== "0.00" && `You cashed out with ${formatGameCurrency(totalProfit)} at ${multiplier.toFixed(2)}×.`}
              {gameOver && totalProfit === "0.00" && "Boom! You hit a mine. Try again."}
            </div>
          </div>
        </div>

        {/* Right board panel */}
        <div className="relative rounded-2xl border border-border bg-background/40 p-3 lg:p-5">
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/40" />

          <div className={`mx-auto max-w-[900px]`}>
            <div className="rounded-2xl border border-border bg-background/20 p-3 sm:p-4">
              <div className={`grid grid-cols-5 grid-rows-5 gap-3 w-full`}>
                {grid.map((cell) => (
                  <Card
                    key={cell.id}
                    onClick={() => handleCellClick(cell.id)}
                    className={`
                      w-full aspect-square flex items-center justify-center cursor-pointer transition-all duration-200 border rounded-xl
                      ${cell.isRevealed
                        ? cell.isMine
                          ? "bg-destructive/60 border-destructive/40"
                          : "bg-primary/60 border-primary/40"
                        : "border-border bg-background/40 hover:bg-muted/60"}
                      ${!isPlaying || gameOver ? "cursor-not-allowed opacity-50" : ""}
                    `}
                  >
                    {cell.isRevealed && (
                      <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                        {cell.isMine ? (
                          <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain filter drop-shadow-lg" />
                        ) : (
                          <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain filter drop-shadow-lg" />
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popup Modal */}
        {popup.isOpen && (
          <div onClick={closePopup} className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div onClick={(e) => e.stopPropagation()} className="bg-background/60 backdrop-blur-xl border border-border rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
              <button type="button" onClick={closePopup} className="absolute top-4 right-4 z-10 pointer-events-auto text-foreground/60 hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                <X size={24} />
              </button>

              <div className="text-center space-y-3">
                {popup.type === "mine" ? (
                  <>
                    <div className="w-32 h-32 mb-6 animate-bounce flex items-center justify-center mx-auto">
                      <img src="/Bomb.svg" alt="Bomb" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-destructive/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src={loseImageSrc || "/placeholder.svg"} alt="Mine explosion" className="w-full h-full object-cover rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-wide uppercase text-destructive/90">BOOM! Mine Hit!</h2>
                    <p className="text-foreground/70 text-base">{loseMessage}</p>
                  </>
                ) : (
                  <>
                    <div className="w-32 h-32 mb-6 animate-pulse flex items-center justify-center mx-auto">
                      <img src="/Gems.svg" alt="Gem" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-full h-64 bg-primary/20 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src="/nachoo.gif" alt="Successful cashout" className="w-full h-full object-contain rounded-2xl opacity-80" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-wide uppercase text-primary/90">Congratulations!</h2>
                    <p className="text-foreground/70 text-base">You cashed out with {formatGameCurrency(totalProfit)} profit at {multiplier.toFixed(2)}× multiplier!</p>
                  </>
                )}

                <Button onClick={closePopup} className="w-full h-12 rounded-2xl font-semibold">
                  Continue Playing
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}