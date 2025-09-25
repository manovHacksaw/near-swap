"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ContractService } from "@/lib/contractService"
import { ResolverService } from "@/lib/resolverService"
import { useWallet } from "@/contexts/WalletContext"
import { 
  Gamepad2, 
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react"

interface GameResolverProps {
  gameId?: string
  onResolved?: (success: boolean, message: string) => void
  compact?: boolean
}

export default function GameResolver({ gameId: initialGameId, onResolved, compact = false }: GameResolverProps) {
  const { selector, accountId, isConnected } = useWallet()
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [resolverService, setResolverService] = useState<ResolverService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  
  // Game resolution form
  const [gameId, setGameId] = useState(initialGameId || "")
  const [didWin, setDidWin] = useState(true)
  const [multiplier, setMultiplier] = useState("1.0")
  const [gameDetails, setGameDetails] = useState<any>(null)
  const [isResolver, setIsResolver] = useState(false)

  // Initialize services when wallet is connected
  useEffect(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        const newContractService = new ContractService(selector, account)
        const newResolverService = new ResolverService(selector, account)
        setContractService(newContractService)
        setResolverService(newResolverService)
        
        // Check if current account is the resolver
        checkIfResolver()
      }
    }
  }, [selector, accountId])

  // Check if current account is the resolver
  const checkIfResolver = async () => {
    if (!contractService) return

    try {
      const resolverAccount = await contractService.getOracleAccount()
      setIsResolver(accountId === resolverAccount)
    } catch (error) {
      console.error("Error checking resolver status:", error)
    }
  }

  // Get game details
  const getGameDetails = async () => {
    if (!contractService || !gameId) {
      setErrorMessage("Please enter a game ID")
      return
    }

    setIsLoading(true)
    try {
      const details = await contractService.getGameDetails(gameId)
      if (details) {
        setGameDetails(details)
        setSuccessMessage("Game details loaded successfully")
        
        // Auto-fill form based on game details
        if (details.status === 0) { // Pending
          setDidWin(false) // Default to loss for pending games
        }
      } else {
        setErrorMessage("Game not found")
        setGameDetails(null)
      }
    } catch (error: any) {
      setErrorMessage(`Failed to get game details: ${error.message}`)
      setGameDetails(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Resolve a game
  const resolveGame = async () => {
    if (!gameId) {
      setErrorMessage("Please enter a game ID")
      return
    }

    if (!isResolver) {
      setErrorMessage("Only the resolver account can resolve games")
      return
    }

    if (!resolverService) {
      setErrorMessage("Resolver service not available")
      return
    }

    setIsLoading(true)
    try {
      const hash = await resolverService.resolveGame(gameId, didWin, parseFloat(multiplier))
      const message = `Game resolved successfully! Transaction: ${hash.slice(0, 8)}...`
      setSuccessMessage(message)
      
      if (onResolved) {
        onResolved(true, message)
      }
      
      // Clear form
      setGameId("")
      setMultiplier("1.0")
      setGameDetails(null)
    } catch (error: any) {
      const errorMsg = `Failed to resolve game: ${error.message}`
      setErrorMessage(errorMsg)
      
      if (onResolved) {
        onResolved(false, errorMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Clear messages
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
  }

  // Auto-fetch game details when gameId changes
  useEffect(() => {
    if (gameId && gameId !== initialGameId) {
      getGameDetails()
    }
  }, [gameId])

  if (!isConnected) {
    return (
      <Card className="bg-background/60 border-border p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-white/70">Please connect your wallet to resolve games</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-background/60 border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <Gamepad2 className="h-6 w-6 text-blue-500" />
        <h3 className="text-xl font-semibold text-white">Game Resolver</h3>
        {isResolver && (
          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-500/30">
            Resolver Account
          </span>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-3 mb-4">
          <p className="text-red-400 text-sm font-medium">⚠️ {errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-3 mb-4">
          <p className="text-green-400 text-sm font-medium">✅ {successMessage}</p>
        </div>
      )}

      {/* Game Details */}
      {gameDetails && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
          <h4 className="text-blue-400 font-medium mb-2">Game Details</h4>
          <div className="space-y-1 text-sm text-blue-300">
            <p>Player: {gameDetails.player}</p>
            <p>Amount: {(parseFloat(gameDetails.amount) / 1e24).toFixed(4)} NEAR</p>
            <p>Status: {gameDetails.status === 0 ? "Pending" : gameDetails.status === 1 ? "Won" : "Lost"}</p>
            <p>Game Type: {gameDetails.gameType || "Unknown"}</p>
            {gameDetails.multiplier > 0 && (
              <p>Multiplier: {gameDetails.multiplier.toFixed(2)}×</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-white/70 text-sm mb-2 block">Game ID</label>
          <Input
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter game ID"
            className="bg-background/40 border-border"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={getGameDetails}
            disabled={isLoading || !gameId}
            variant="outline"
            className="flex-1"
          >
            <Info className="w-4 h-4 mr-2" />
            Get Details
          </Button>
        </div>
        
        {gameDetails && (
          <>
            <div>
              <label className="text-white/70 text-sm mb-2 block">Outcome</label>
              <div className="flex gap-2">
                <Button
                  variant={didWin ? "default" : "outline"}
                  onClick={() => setDidWin(true)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Win
                </Button>
                <Button
                  variant={!didWin ? "default" : "outline"}
                  onClick={() => setDidWin(false)}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Loss
                </Button>
              </div>
            </div>
            
            {didWin && (
              <div>
                <label className="text-white/70 text-sm mb-2 block">Multiplier</label>
                <Input
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  placeholder="1.0"
                  type="number"
                  step="0.1"
                  className="bg-background/40 border-border"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={resolveGame}
                disabled={isLoading || !gameId || !isResolver}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  "Resolve Game"
                )}
              </Button>
              <Button
                onClick={clearMessages}
                variant="outline"
                className="px-4"
              >
                Clear
              </Button>
            </div>
          </>
        )}
      </div>

      {!isResolver && (
        <div className="mt-4 bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-400 text-sm">
              Only the resolver account can resolve games. Current account: {accountId}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
