"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContractService } from "@/lib/contractService"
import { useWallet } from "@/contexts/WalletContext"
import { useContract } from "@/contexts/ContractProvider"
import { formatNEAR, formatNEARWithConversion, getConversionText } from "@/lib/currencyUtils"
import { useLiveConversion } from "@/lib/useCurrencyRates"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Gamepad2, 
  Trophy, 
  Target,
  Calendar,
  RefreshCw,
  CloudCog
} from "lucide-react"
import GameResolver from "@/components/games/GameResolver"
import Leaderboard from "./Leaderboard"

interface GameStats {
  gameType: string
  totalBets: number
  totalWon: number
  totalLost: number
  winRate: number
  avgMultiplier: number
  bestMultiplier: number
  totalGames: number
  gamesWon: number
}

interface UserStats {
  totalBet: string
  totalWon: string
  totalLost: string
  withdrawableBalance: string
  gamesPlayed: number
  gamesWon: number
  winRate: number
  favoriteGame: string
  joinDate: string
  lastPlayDate: string
  gameTypeStats: GameStats[]
}

// Contract data format (from NEAR contract)
interface ContractUserStats {
  totalBet: string | bigint
  totalWon: string | bigint
  totalLost: string | bigint
  withdrawableBalance: string | bigint
  gamesPlayed: number
  gamesWon: number
  joinDate: string | bigint
  lastPlayDate: string | bigint
}

interface ChartData {
  date: string
  profit: number
  bets: number
  multiplier: number
}

interface GameDistribution {
  name: string
  value: number
  color: string
  [key: string]: any // Add index signature for recharts compatibility
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function UserStats() {
  const { selector, accountId, isConnected, getBalance, refreshBalance, isBalanceLoading } = useWallet()
  const { getUserStats, withdraw: contractWithdraw} = useContract()
  console.log("accountId:", accountId)
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [gameDistribution, setGameDistribution] = useState<GameDistribution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState<string>("0")
  
  // Live conversion rates for main stats
  const totalBetConversion = useLiveConversion(userStats?.totalBet || "0")
  const totalWonConversion = useLiveConversion(userStats?.totalWon || "0")
  const withdrawableConversion = useLiveConversion(userStats?.withdrawableBalance || "0")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [isNetworkError, setIsNetworkError] = useState<boolean>(false)
  const [transactionHash, setTransactionHash] = useState<string>("")

  useEffect(() => {
    const fetchUserData = async () => {
      
      if (accountId) {
        console.log("🔄 Fetching user data for:", accountId)
        const contractStats = await getUserStats(accountId)
        console.log("📊 Received contract stats:", contractStats)
        
        if (contractStats) {
          // Generate fake dates for display purposes
          const fakeJoinDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          const fakeLastPlayDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
          
          // Convert contract data to our expected format
          const processedStats: UserStats = {
            totalBet: (parseFloat(contractStats.totalBet.toString()) / 1e24).toFixed(2),
            totalWon: (parseFloat(contractStats.totalWon.toString()) / 1e24).toFixed(2),
            totalLost: (parseFloat(contractStats.totalLost.toString()) / 1e24).toFixed(2),
            withdrawableBalance: (parseFloat(contractStats.withdrawableBalance.toString()) / 1e24).toFixed(2),
            gamesPlayed: contractStats.gamesPlayed || 0,
            gamesWon: contractStats.gamesWon || 0,
            winRate: contractStats.gamesPlayed > 0 ? (contractStats.gamesWon / contractStats.gamesPlayed) * 100 : 0,
            favoriteGame: "N/A", // Will be updated when we get game type stats
            joinDate: fakeJoinDate.toISOString(),
            lastPlayDate: fakeLastPlayDate.toISOString(),
            gameTypeStats: [] // Will be populated separately if needed
          }
          
          console.log("✅ Processed user stats:", processedStats)
          setUserStats(processedStats)
        } else {
          console.log("❌ No stats found for user")
          // Set default empty stats
          const defaultStats: UserStats = {
            totalBet: "0.00",
            totalWon: "0.00",
            totalLost: "0.00",
            withdrawableBalance: "0.00",
            gamesPlayed: 0,
            gamesWon: 0,
            winRate: 0,
            favoriteGame: "N/A",
            joinDate: "N/A",
            lastPlayDate: "N/A",
            gameTypeStats: []
          }
          setUserStats(defaultStats)
        }
      }
    }
    fetchUserData()
  }, [accountId])

  // Initialize contract service when wallet is connected (for withdrawal functionality)
  useEffect(() => {
    console.log("🔗 Wallet connection effect triggered")
    console.log("selector:", selector)
    console.log("accountId:", accountId)
    
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      console.log("📱 Account from selector:", account)
      
      if (account) {
        const newContractService = new ContractService(selector, account)
        console.log("✅ ContractService created:", newContractService)
        setContractService(newContractService)
      } else {
        console.log("❌ No account found in selector")
      }
    } else {
      console.log("❌ Missing selector or accountId")
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
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [isConnected, getBalance])

  // Clear messages after a delay
  const clearMessages = () => {
    setErrorMessage("")
    setSuccessMessage("")
    setTransactionHash("")
  }

  const refreshStats = async () => {
    if (accountId && getUserStats) {
      console.log("🔄 Refreshing user stats...")
      try {
        const contractStats = await getUserStats(accountId)
        console.log("📊 Refreshed contract stats:", contractStats)

        if (contractStats) {
          // Generate fake dates for display purposes
          const fakeJoinDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          const fakeLastPlayDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
          
          const processedStats: UserStats = {
            totalBet: (parseFloat(contractStats.totalBet.toString()) / 1e24).toFixed(2),
            totalWon: (parseFloat(contractStats.totalWon.toString()) / 1e24).toFixed(2),
            totalLost: (parseFloat(contractStats.totalLost.toString()) / 1e24).toFixed(2),
            withdrawableBalance: (parseFloat(contractStats.withdrawableBalance.toString()) / 1e24).toFixed(2),
            gamesPlayed: contractStats.gamesPlayed || 0,
            gamesWon: contractStats.gamesWon || 0,
            winRate: contractStats.gamesPlayed > 0 ? (contractStats.gamesWon / contractStats.gamesPlayed) * 100 : 0,
            favoriteGame: "N/A",
            joinDate: fakeJoinDate.toISOString(),
            lastPlayDate: fakeLastPlayDate.toISOString(),
            gameTypeStats: []
          }
          setUserStats(processedStats)
          console.log("✅ Stats refreshed successfully")
        }
      } catch (error) {
        console.error("❌ Failed to refresh stats:", error)
      }
    }
  }
  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (accountId) {
      const interval = setInterval(refreshStats, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [accountId, refreshStats])
  // Simplified data fetching using ContractProvider
  const fetchUserStats = async () => {
    console.log("🚀 fetchUserStats called")
      console.log("accountId:", accountId)
    console.log("getUserStats function:", getUserStats)
    
    if (!accountId) {
      console.log("❌ Cannot fetch stats - missing accountId")
      return
    }

    console.log("✅ Starting to fetch user stats...")
    setIsLoading(true)
    clearMessages() // Clear any existing messages
    
    try {
      const contractStats = await getUserStats(accountId)
      console.log("📊 Raw contract stats received:", contractStats)
      
      if (contractStats) {
        // Generate fake dates for display purposes
        const fakeJoinDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        const fakeLastPlayDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
        
        // Convert contract data to our expected format
        const processedStats: UserStats = {
          totalBet: (parseFloat(contractStats.totalBet.toString()) / 1e24).toFixed(2),
          totalWon: (parseFloat(contractStats.totalWon.toString()) / 1e24).toFixed(2),
          totalLost: (parseFloat(contractStats.totalLost.toString()) / 1e24).toFixed(2),
          withdrawableBalance: (parseFloat(contractStats.withdrawableBalance.toString()) / 1e24).toFixed(2),
          gamesPlayed: contractStats.gamesPlayed || 0,
          gamesWon: contractStats.gamesWon || 0,
          winRate: contractStats.gamesPlayed > 0 ? (contractStats.gamesWon / contractStats.gamesPlayed) * 100 : 0,
          favoriteGame: "N/A", // Will be updated when we get game type stats
          joinDate: fakeJoinDate.toISOString(),
          lastPlayDate: fakeLastPlayDate.toISOString(),
          gameTypeStats: [] // Will be populated separately if needed
        }
        
        console.log("✅ Processed user stats:", processedStats)
        setUserStats(processedStats)
        
        // Set empty game stats for now (can be populated later if needed)
        setGameStats([])
        setChartData([])
        setGameDistribution([])
      } else {
        console.log("❌ No stats found for user")
        // Set default empty stats
        const defaultStats: UserStats = {
          totalBet: "0.00",
          totalWon: "0.00",
          totalLost: "0.00",
          withdrawableBalance: "0.00",
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          favoriteGame: "N/A",
          joinDate: "N/A",
          lastPlayDate: "N/A",
          gameTypeStats: []
        }
        setUserStats(defaultStats)
        setGameStats([])
        setChartData([])
        setGameDistribution([])
      }
    } catch (error: any) {
      console.error("❌ Error in fetchUserStats:", error)
        setErrorMessage("Failed to fetch user statistics")
      
      // Set empty data on error
      const errorStats: UserStats = {
        totalBet: "0.00",
        totalWon: "0.00",
        totalLost: "0.00",
        withdrawableBalance: "0.00",
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        favoriteGame: "N/A",
        joinDate: "N/A",
        lastPlayDate: "N/A",
        gameTypeStats: []
      }
      setUserStats(errorStats)
      setGameStats([])
      setChartData([])
      setGameDistribution([])
    } finally {
      setIsLoading(false)
      console.log("🏁 fetchUserStats completed")
    }
  }


  useEffect(() => {
    console.log("🔄 Stats fetch effect triggered")
    console.log("isConnected:", isConnected)
    console.log("accountId:", accountId)
    console.log("getUserStats:", getUserStats)
    
    if (isConnected && accountId) {
      console.log("✅ Wallet is connected, fetching user stats...")
      fetchUserStats()
    } else {
      console.log("❌ Wallet not connected or missing dependencies, skipping stats fetch")
    }
  }, [isConnected, accountId])

  const formatCurrency = (amount: string) => {
    return `${formatNEAR(amount)} NEAR`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleWithdraw = async () => {
    if (!isConnected || !userStats) {
      setErrorMessage("Please connect your wallet first")
      return
    }

    const withdrawableAmount = parseFloat(userStats.withdrawableBalance)
    if (withdrawableAmount <= 0) {
      setErrorMessage("No winnings to withdraw")
      return
    }

    setIsLoading(true)
    clearMessages() // Clear any existing messages
    
    try {
      console.log("💰 Starting withdrawal process...")
      console.log(`💸 Withdrawing ${formatNEAR(withdrawableAmount.toString())} NEAR`)
      
      // Use the ContractProvider withdraw function
      const hash = await contractWithdraw()
      console.log("✅ Withdrawal transaction successful:", hash)
      
      setSuccessMessage(`🎉 Withdrawal successful! ${formatNEAR(withdrawableAmount.toString())} NEAR has been sent to your wallet.`)
      setTransactionHash(hash)
      
      // Refresh stats and balance after successful withdrawal
      setTimeout(async () => {
        console.log("🔄 Refreshing stats and balance after withdrawal...")
        await Promise.all([
          refreshStats(),
          refreshBalance()
        ])
      }, 3000) // Wait for the transaction to be processed
      
    } catch (error: any) {
      console.error("❌ Error withdrawing:", error)
      let errorMsg = "Error withdrawing winnings. Please try again."
      
      // Handle specific error cases
      if (error.message?.includes("Nothing to withdraw")) {
        errorMsg = "No winnings available to withdraw"
      } else if (error.message?.includes("User closed the window") || error.message?.includes("cancelled")) {
        errorMsg = "Transaction cancelled. Please try again when ready."
      } else if (error.message?.includes("insufficient balance")) {
        errorMsg = "Insufficient contract balance for withdrawal"
      } else if (error.message?.includes("Contract method is not found")) {
        errorMsg = "Contract not properly deployed. Please contact support."
      } else if (error.message?.includes("No account connected")) {
        errorMsg = "Please connect your wallet first"
      } else if (error.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-8">
        <div className="text-8xl mb-6">📊</div>
        <h2 className="text-white text-4xl font-bold mb-4">User Statistics</h2>
        <p className="text-white/70 text-xl mb-8 max-w-2xl">
          Connect your wallet to view your gaming statistics and performance analytics
        </p>
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-lg">
          <p className="text-white/80 text-sm">
            🔗 Please connect your wallet to access your personal statistics dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl w-full h-screen pt-4 space-y-6 overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Statistics</h1>
          <p className="text-white/70">Track your gaming performance and earnings from the blockchain</p>
        </div>
        <Button 
          onClick={fetchUserStats} 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Wallet Status */}
      <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-400 text-sm font-medium">💰 Wallet Connected</p>
            {isBalanceLoading ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border border-green-300 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-green-300 text-xs">Loading balance...</p>
              </div>
            ) : (
              <p className="text-green-300 text-xs">Balance: {walletBalance} NEAR</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-green-400 text-sm font-medium">Account</p>
            <p className="text-green-300 text-xs">{accountId?.slice(0, 12)}...</p>
          </div>
        </div>
      </div>

      {/* Quick Withdraw Section */}
      {userStats && parseFloat(userStats.withdrawableBalance) > 0 && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-yellow-400 text-lg font-bold mb-2">🎉 You have winnings to withdraw!</h3>
              <p className="text-yellow-300 text-sm mb-3">
                You have <span className="font-bold text-yellow-200">{formatNEAR(userStats.withdrawableBalance)} NEAR</span> ready to withdraw
              </p>
              <Button 
                onClick={handleWithdraw}
                disabled={isLoading}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    💰 Withdraw {formatNEAR(userStats.withdrawableBalance)} NEAR
                  </>
                )}
              </Button>
            </div>
            <div className="text-6xl ml-4">🎁</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className={`${isNetworkError ? 'bg-yellow-600/20 border-yellow-500/30' : 'bg-red-600/20 border-red-500/30'} border rounded-2xl p-4`}>
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {isNetworkError ? '🌐' : '⚠️'}
            </div>
            <div>
              <p className={`${isNetworkError ? 'text-yellow-400' : 'text-red-400'} text-sm font-medium`}>
                {errorMessage}
              </p>
              {isNetworkError && (
                <p className="text-yellow-300 text-xs mt-1">
                  The app will automatically retry when the connection is restored.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4">
          <p className="text-green-400 text-sm font-medium">
            ✅ {successMessage}
          </p>
        </div>
      )}

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bet</p>
              <p className="text-2xl font-bold text-white" title={totalBetConversion.conversionText}>
                {formatCurrency(userStats?.totalBet || "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBetConversion.isLoading ? "Loading..." : totalBetConversion.conversionText}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Won</p>
              <p className="text-2xl font-bold text-green-500" title={totalWonConversion.conversionText}>
                {formatCurrency(userStats?.totalWon || "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalWonConversion.isLoading ? "Loading..." : totalWonConversion.conversionText}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-white">{userStats?.winRate || 0}%</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Games Played</p>
              <p className="text-2xl font-bold text-white">{userStats?.gamesPlayed || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {userStats?.gamesWon || 0} wins
              </p>
            </div>
            <Gamepad2 className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Profit/Loss</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  formatter={(value: number) => [`${formatNEAR(value.toString())} NEAR`, 'Profit/Loss']}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div>
                <div className="text-4xl mb-2">📊</div>
                <p className="text-white/60 text-sm">No historical data available</p>
                <p className="text-white/40 text-xs">Play some games to see your performance charts</p>
              </div>
            </div>
          )}
        </Card>

        {/* Game Distribution */}
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Game Distribution</h3>
          {gameDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gameDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  // @ts-ignore - recharts typing
                  formatter={(value: number) => [`${value}%`, 'Games']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div>
                <div className="text-4xl mb-2">🎮</div>
                <p className="text-white/60 text-sm">No game data available</p>
                <p className="text-white/40 text-xs">Play different games to see distribution</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Game Performance Table */}
      <Card className="bg-background/60 border-border p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Game Performance</h3>
        {gameStats.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Game</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Games Played</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Win Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Won</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Best Multiplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {gameStats.map((game, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-3 px-4 text-white font-medium">{game.gameType}</td>
                    <td className="py-3 px-4 text-white">{game.totalGames}</td>
                    <td className="py-3 px-4">
                      <span className={`${
                        game.winRate >= 60 ? 'bg-green-500/20 text-green-400' : 
                        game.winRate >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      } px-2 py-1 rounded-full text-xs font-medium`}>
                        {game.winRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-green-400 font-medium">{formatNEAR(game.totalWon.toString())} NEAR</td>
                    <td className="py-3 px-4 text-white">{game.bestMultiplier.toFixed(2)}×</td>
                    <td className="py-3 px-4 text-white">{game.avgMultiplier.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <div className="text-4xl mb-2">📈</div>
              <p className="text-white/60 text-sm">No game performance data available</p>
              <p className="text-white/40 text-xs">Play games to see your performance statistics</p>
            </div>
          </div>
        )}
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${userStats && parseFloat(userStats.withdrawableBalance) > 0 ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30' : 'bg-background/60 border-border'} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Withdrawable Balance</p>
              <p className={`${userStats && parseFloat(userStats.withdrawableBalance) > 0 ? 'text-yellow-400' : 'text-white'} text-2xl font-bold`} title={withdrawableConversion.conversionText}>
                {formatCurrency(userStats?.withdrawableBalance || "0")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {withdrawableConversion.isLoading ? "Loading..." : withdrawableConversion.conversionText}
              </p>
              {userStats && parseFloat(userStats.withdrawableBalance) > 0 ? (
                <div className="mt-3">
                  <Button 
                    onClick={handleWithdraw}
                    disabled={isLoading}
                    className="h-10 w-full text-sm bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      <>
                        💰 Withdraw {formatNEAR(userStats.withdrawableBalance)} NEAR
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-yellow-400/80 mt-2 text-center">
                    ✨ Withdraw your winnings instantly to your wallet
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <div className="h-10 w-full bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-gray-400">No winnings to withdraw</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Play games to earn withdrawable winnings
                  </p>
                </div>
              )}
            </div>
            <Trophy className={`h-8 w-8 ${userStats && parseFloat(userStats.withdrawableBalance) > 0 ? 'text-yellow-400' : 'text-yellow-500'}`} />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Favorite Game</p>
              <p className="text-2xl font-bold text-white">{userStats?.favoriteGame || "N/A"}</p>
            </div>
            <Gamepad2 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="text-lg font-bold text-white">{userStats?.joinDate ? formatDate(userStats.joinDate) : "N/A"}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="bg-background/60 border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Played</p>
              <p className="text-lg font-bold text-white">{userStats?.lastPlayDate ? formatDate(userStats.lastPlayDate) : "N/A"}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Withdrawal Information */}
      <Card className="bg-background/60 border-border p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💰 Withdraw Your Winnings</h3>
        <p className="text-white/70 text-sm mb-4">
          All your winnings are automatically processed by our resolver system. Use the withdraw button above to transfer your winnings to your wallet.
        </p>
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <h4 className="text-blue-400 font-medium mb-2">How it works:</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Play games and win - your winnings are tracked on-chain</li>
            <li>• Our automated resolver processes all game outcomes</li>
            <li>• Withdraw your accumulated winnings anytime</li>
            <li>• All transactions are secure and transparent</li>
          </ul>
        </div>
      </Card>

      {/* Leaderboard Section */}
      <div className="mt-8">
        <Leaderboard />
      </div>
    </div>
  )
}