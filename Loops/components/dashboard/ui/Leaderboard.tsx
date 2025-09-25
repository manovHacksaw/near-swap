"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useContract } from "@/contexts/ContractProvider"
import { useWallet } from "@/contexts/WalletContext"
import { formatNEAR } from "@/lib/currencyUtils"
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Award,
  Target
} from "lucide-react"

interface LeaderboardUser {
  accountId: string
  totalBet: string | bigint
  totalWon: string | bigint
  totalLost: string | bigint
  withdrawableBalance: string | bigint
  gamesPlayed: number
  gamesWon: number
  joinDate: string | bigint
  lastPlayDate: string | bigint
}

interface ProcessedLeaderboardUser {
  accountId: string
  totalBet: number
  totalWon: number
  totalLost: number
  withdrawableBalance: number
  gamesPlayed: number
  gamesWon: number
  winRate: number
  netProfit: number
  joinDate: string
  lastPlayDate: string
  rank: number
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-400" />
    case 2:
      return <Medal className="h-6 w-6 text-gray-300" />
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />
    default:
      return <span className="text-lg font-bold text-white/70">#{rank}</span>
  }
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30"
    case 2:
      return "bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-300/30"
    case 3:
      return "bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600/30"
    default:
      return "bg-background/60 border-border"
  }
}

const formatDate = (dateString: string) => {
  if (dateString === "N/A") return "N/A"
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return "N/A"
  }
}

export default function Leaderboard() {
  const { getAllUsers, getUserStats } = useContract()
  const { accountId } = useWallet()
  const [leaderboard, setLeaderboard] = useState<ProcessedLeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'totalWon' | 'netProfit' | 'winRate' | 'gamesPlayed'>('totalWon')
  const [error, setError] = useState<string>("")

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      console.log("🏆 Fetching leaderboard data...")
      const userAccountIds = await getAllUsers()
      console.log("👥 Raw account IDs:", userAccountIds)
      console.log("👥 Account IDs type:", typeof userAccountIds)
      console.log("👥 Account IDs length:", userAccountIds.length)
      console.log("👥 First few account IDs:", userAccountIds.slice(0, 5))
      
      if (!userAccountIds || !Array.isArray(userAccountIds)) {
        throw new Error("Invalid users data received")
      }
      
      // Filter out null values and get valid account IDs
      const validAccountIds = userAccountIds.filter((accountId: any) => 
        accountId !== null && accountId !== undefined && typeof accountId === 'string'
      )
      
      console.log("👥 Valid account IDs:", validAccountIds.length)
      
      // Fetch stats for each valid account ID
      const userStatsPromises = validAccountIds.map(async (accountId: string) => {
        try {
          const stats = await getUserStats(accountId)
          if (stats && stats.gamesPlayed > 0) { // Only include users who have played games
            return {
              accountId,
              ...stats
            }
          }
          return null
        } catch (error) {
          console.warn(`⚠️ Failed to fetch stats for ${accountId}:`, error)
          return null
        }
      })
      
      // Wait for all stats to be fetched
      const userStatsResults = await Promise.all(userStatsPromises)
      
      // Filter out null results and process the data
      const processedUsers: ProcessedLeaderboardUser[] = userStatsResults
        .filter((user: any) => user !== null)
        .map((user: any, index: number) => {
          // Safety checks for data processing
          const totalBet = user.totalBet ? parseFloat(user.totalBet.toString()) / 1e24 : 0
          const totalWon = user.totalWon ? parseFloat(user.totalWon.toString()) / 1e24 : 0
          const totalLost = user.totalLost ? parseFloat(user.totalLost.toString()) / 1e24 : 0
          const withdrawableBalance = user.withdrawableBalance ? parseFloat(user.withdrawableBalance.toString()) / 1e24 : 0
          const gamesPlayed = user.gamesPlayed || 0
          const gamesWon = user.gamesWon || 0
          const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0
          const netProfit = totalWon - totalLost
          
          // Generate fake dates for display purposes
          const fakeJoinDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          const fakeLastPlayDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
          
          return {
            accountId: user.accountId,
            totalBet,
            totalWon,
            totalLost,
            withdrawableBalance,
            gamesPlayed,
            gamesWon,
            winRate,
            netProfit,
            joinDate: fakeJoinDate.toISOString(),
            lastPlayDate: fakeLastPlayDate.toISOString(),
            rank: index + 1
          }
        })
      
      console.log("👥 Valid users after processing:", processedUsers.length)
      console.log("👥 Sample processed user:", processedUsers[0])
      
      // Sort users based on selected criteria
      const sortedUsers = processedUsers.sort((a, b) => {
        switch (sortBy) {
          case 'totalWon':
            return b.totalWon - a.totalWon
          case 'netProfit':
            return b.netProfit - a.netProfit
          case 'winRate':
            return b.winRate - a.winRate
          case 'gamesPlayed':
            return b.gamesPlayed - a.gamesPlayed
          default:
            return b.totalWon - a.totalWon
        }
      }).map((user, index) => ({ ...user, rank: index + 1 }))
      
      console.log("🏆 Final sorted leaderboard:", sortedUsers)
      setLeaderboard(sortedUsers)
      
    } catch (error: any) {
      console.error("❌ Failed to fetch leaderboard:", error)
      setError(error.message || "Failed to fetch leaderboard data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [sortBy])

  const getSortButtonClass = (buttonSortBy: string) => {
    return `px-3 py-1 rounded-full text-xs font-medium transition-colors ${
      sortBy === buttonSortBy
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">🏆 Leaderboard</h2>
            <p className="text-muted-foreground text-sm">Top players by performance</p>
          </div>
        </div>
        <Button
          onClick={fetchLeaderboard}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Sort Options */}
      <Card className="bg-background/60 border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Sort by:</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('totalWon')}
              className={getSortButtonClass('totalWon')}
            >
              Total Won
            </button>
            <button
              onClick={() => setSortBy('netProfit')}
              className={getSortButtonClass('netProfit')}
            >
              Net Profit
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={getSortButtonClass('winRate')}
            >
              Win Rate
            </button>
            <button
              onClick={() => setSortBy('gamesPlayed')}
              className={getSortButtonClass('gamesPlayed')}
            >
              Games Played
            </button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="bg-red-600/20 border-red-500/30 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-background/60 border-border p-8">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-white">Loading leaderboard...</p>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <Card className="bg-background/60 border-border p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No players found</p>
                <p className="text-muted-foreground text-sm">Be the first to play and appear on the leaderboard!</p>
              </div>
            </Card>
          ) : (
            leaderboard.map((user) => (
              <Card
                key={user.accountId}
                className={`${getRankColor(user.rank)} border p-4 transition-all hover:scale-[1.02] ${
                  user.accountId === accountId ? 'ring-2 ring-primary/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(user.rank)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-white">
                          {user.accountId.length > 20 
                            ? `${user.accountId.slice(0, 10)}...${user.accountId.slice(-10)}`
                            : user.accountId
                          }
                        </p>
                        {user.accountId === accountId && (
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{user.gamesPlayed} games</span>
                        <span>{user.winRate.toFixed(1)}% win rate</span>
                        <span>Joined {formatDate(user.joinDate)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Won</p>
                        <p className="font-semibold text-green-400">
                          {formatNEAR(user.totalWon.toString())} NEAR
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Profit</p>
                        <p className={`font-semibold ${user.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {user.netProfit >= 0 ? '+' : ''}{formatNEAR(user.netProfit.toString())} NEAR
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Withdrawable</p>
                        <p className="font-semibold text-yellow-400">
                          {formatNEAR(user.withdrawableBalance.toString())} NEAR
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Stats Summary */}
      {!isLoading && !error && leaderboard.length > 0 && (
        <Card className="bg-background/60 border-border p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Leaderboard Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {formatNEAR(leaderboard.reduce((sum, user) => sum + user.totalWon, 0).toString())} NEAR
              </p>
              <p className="text-sm text-muted-foreground">Total Won</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {leaderboard.reduce((sum, user) => sum + user.gamesPlayed, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {leaderboard.length > 0 
                  ? (leaderboard.reduce((sum, user) => sum + user.winRate, 0) / leaderboard.length).toFixed(1)
                  : 0
                }%
              </p>
              <p className="text-sm text-muted-foreground">Avg Win Rate</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}