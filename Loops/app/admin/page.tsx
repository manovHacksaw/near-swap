"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ContractService } from "@/lib/contractService"
import { ResolverService } from "@/lib/resolverService"
import { useWallet } from "@/contexts/WalletContext"
import { 
  Settings, 
  Users, 
  Gamepad2, 
  DollarSign, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"

export default function AdminDashboard() {
  const { selector, accountId, isConnected } = useWallet()
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [resolverService, setResolverService] = useState<ResolverService | null>(null)
  const [contractStats, setContractStats] = useState<any>(null)
  const [resolverAccount, setResolverAccount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  
  // Game resolution form
  const [gameId, setGameId] = useState("")
  const [didWin, setDidWin] = useState(true)
  const [multiplier, setMultiplier] = useState("1.0")

  // Initialize services when wallet is connected
  useEffect(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        const newContractService = new ContractService(selector, account)
        const newResolverService = new ResolverService(selector, account)
        setContractService(newContractService)
        setResolverService(newResolverService)
      }
    }
  }, [selector, accountId])

  // Fetch contract stats
  const fetchContractStats = async () => {
    if (!contractService) return

    setIsLoading(true)
    try {
      const stats = await contractService.getContractStats()
      setContractStats(stats)
    } catch (error: any) {
      setErrorMessage(`Failed to fetch contract stats: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch resolver account
  const fetchResolverAccount = async () => {
    if (!contractService) return

    try {
      const resolver = await contractService.getOracleAccount()
      setResolverAccount(resolver)
    } catch (error: any) {
      console.error("Error fetching resolver account:", error)
    }
  }

  // Resolve a game
  const resolveGame = async () => {
    if (!resolverService || !gameId) {
      setErrorMessage("Please enter a game ID and ensure resolver service is available")
      return
    }

    setIsLoading(true)
    try {
      const hash = await resolverService.resolveGame(gameId, didWin, parseFloat(multiplier))
      setSuccessMessage(`Game resolved successfully! Transaction: ${hash.slice(0, 8)}...`)
      setGameId("")
      setMultiplier("1.0")
    } catch (error: any) {
      setErrorMessage(`Failed to resolve game: ${error.message}`)
    } finally {
      setIsLoading(false)
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
        setSuccessMessage(`Game found: ${JSON.stringify(details, null, 2)}`)
      } else {
        setErrorMessage("Game not found")
      }
    } catch (error: any) {
      setErrorMessage(`Failed to get game details: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear messages
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
  }

  // Auto-fetch data on load
  useEffect(() => {
    if (isConnected && contractService) {
      fetchContractStats()
      fetchResolverAccount()
    }
  }, [isConnected, contractService])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">🔐</div>
          <h2 className="text-white text-4xl font-bold mb-4">Admin Dashboard</h2>
          <p className="text-white/70 text-xl mb-8">Please connect your wallet to access the admin panel</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/70">Manage contract and resolve games</p>
          </div>
          <Button 
            onClick={fetchContractStats} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Connection Status */}
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">🔗 Wallet Connected</p>
              <p className="text-green-300 text-xs">Account: {accountId}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 text-sm font-medium">Resolver Account</p>
              <p className="text-green-300 text-xs">{resolverAccount || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 mb-6">
            <p className="text-red-400 text-sm font-medium">⚠️ {errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 mb-6">
            <p className="text-green-400 text-sm font-medium">✅ {successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Statistics */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-blue-500" />
              <h3 className="text-xl font-semibold text-white">Contract Statistics</h3>
            </div>
            
            {contractStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Users:</span>
                  <span className="text-white font-medium">{contractStats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Games:</span>
                  <span className="text-white font-medium">{contractStats.totalGames}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Bets:</span>
                  <span className="text-white font-medium">{(parseFloat(contractStats.totalBets) / 1e24).toFixed(2)} NEAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Total Winnings:</span>
                  <span className="text-white font-medium">{(parseFloat(contractStats.totalWinnings) / 1e24).toFixed(2)} NEAR</span>
                </div>
              </div>
            ) : (
              <p className="text-white/60">Click refresh to load statistics</p>
            )}
          </Card>

          {/* Game Resolution */}
          <Card className="bg-background/60 border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="h-6 w-6 text-green-500" />
              <h3 className="text-xl font-semibold text-white">Resolve Game</h3>
            </div>
            
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
                  disabled={isLoading || !gameId}
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
                  onClick={getGameDetails}
                  disabled={isLoading || !gameId}
                  variant="outline"
                  className="flex-1"
                >
                  Get Details
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-background/60 border-border p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={fetchContractStats}
              disabled={isLoading}
              variant="outline"
              className="h-12"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
            <Button
              onClick={fetchResolverAccount}
              disabled={isLoading}
              variant="outline"
              className="h-12"
            >
              <Users className="w-4 h-4 mr-2" />
              Check Resolver
            </Button>
            <Button
              onClick={clearMessages}
              variant="outline"
              className="h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Messages
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
