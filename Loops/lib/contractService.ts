import { WalletSelector } from '@near-wallet-selector/core'
import { Account } from '@near-wallet-selector/core'
import { parseNEAR, CONTRACT_ID } from '@/near.config'

export class ContractService {
  private selector: WalletSelector
  private account: Account
  private contractId: string

  constructor(selector: WalletSelector, account: Account, contractId: string = CONTRACT_ID) {
    this.selector = selector
    this.account = account
    this.contractId = contractId
  }

  /**
   * Start a new game with a bet amount
   * @param gameId - Unique identifier for the game
   * @param betAmount - Amount to bet in NEAR (as string)
   * @param gameType - Type of game being played (optional)
   * @returns Transaction hash
   */
  async startGame(gameId: string, betAmount: string, gameType?: string): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      // Convert NEAR to yoctoNEAR using the existing utility
      const betInNEAR = parseFloat(betAmount)
      
      // Handle edge cases
      if (isNaN(betInNEAR) || betInNEAR < 0) {
        throw new Error("Invalid bet amount")
      }
      
      const yoctoNEAR = parseNEAR(betAmount)
      
      // Convert to BigInt and back to string to avoid scientific notation issues
      const depositBigInt = BigInt(yoctoNEAR)
      const depositString = depositBigInt.toString()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'start_game',
              args: { gameId, gameType: gameType || "unknown" },
              gas: '300000000000000', // 300 TGas
              deposit: depositString,
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error starting game:', error)
      throw new Error(error.message || 'Failed to start game')
    }
  }

  /**
   * Resolve a game with proper contract parameters
   * @param gameId - Game ID to resolve
   * @param didWin - Whether the player won
   * @param multiplier - Win multiplier
   * @returns Transaction hash
   */
  async resolveGame(gameId: string, didWin: boolean, multiplier: number = 1.0): Promise<string> {
    console.log('🎯 ContractService.resolveGame called')
    console.log('🎮 Game ID:', gameId)
    console.log('🏆 Did Win:', didWin)
    console.log('📊 Multiplier:', multiplier)
    console.log('📋 Contract ID:', this.contractId)
    console.log('👤 Account ID (from wallet):', this.account.accountId)
    
    try {
      const wallet = await this.selector.wallet()
      
      const transactionParams = {
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall' as const,
            params: {
              methodName: 'resolve_game',
              args: { gameId, didWin, multiplier },
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      }
      
      console.log('📡 Sending resolve_game transaction:', transactionParams)
      
      const result = await wallet.signAndSendTransaction(transactionParams)
      
      console.log('✅ resolve_game transaction successful:', result.transaction.hash)
      return result.transaction.hash
    } catch (error: any) {
      console.error('❌ Error resolving game:', error)
      console.error('Error details:', error)
      
      // Extract more detailed error information
      let errorMessage = 'Failed to resolve game'
      
      // @ts-ignore - best effort error type
      if (error.message) {
        // @ts-ignore - best effort error type
        errorMessage = error.message
      // @ts-ignore - best effort error type
      } else if (error.kind && error.kind.FunctionCallError) {
        // @ts-ignore - best effort error type
        const executionError = error.kind.FunctionCallError.ExecutionError
        if (executionError && executionError.includes('Only the resolver can call this method')) {
          errorMessage = 'Only the resolver account can resolve games. This is a security feature.'
        } else if (executionError) {
          errorMessage = `Contract error: ${executionError}`
        }
      }
      
      console.error('📋 Final error message:', errorMessage)
      
      throw new Error(errorMessage)
    }
  }

  /**
   * Get game details by game ID
   * @param gameId - Game ID to query
   * @returns Game details or null
   */
  async getGameDetails(gameId: string): Promise<any> {
    console.log('🔍 ContractService.getGameDetails called with gameId:', gameId)
    console.log('📋 Contract ID:', this.contractId)
    
    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_game_details',
          args_base64: Buffer.from(JSON.stringify({ gameId })).toString('base64'),
        },
      }
      
      console.log('📡 Making RPC request to NEAR:', requestBody)
      
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📨 RPC response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 RPC response data:', data)
      
      // Handle RPC errors
      if (data.error) {
        console.error('❌ RPC error:', data.error)
        if (data.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(data.error.message || 'RPC error occurred')
      }
      
      if (data.result && data.result.result) {
        const decodedResult = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        console.log('✅ Decoded game details:', decodedResult)
        return decodedResult
      }
      
      console.log('❌ No result in RPC response - game may not exist')
      return null
    } catch (error: any) {
      console.error('❌ Error getting game details:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching game details')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get game details')
      }
    }
  }

  async getUserData() {
    
  }


  /**
   * Get comprehensive user statistics using new SecureGames contract
   * @param accountId - User account ID
   * @returns Comprehensive user stats object
   */
  async getUserStats(accountId: string): Promise<any> {
    console.log('🔍 ContractService.getUserStats called with accountId:', accountId)
    console.log('📋 Contract ID:', this.contractId)
    
    try {
      // Get basic user stats
      const userStatsRequest = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_user_stats',
          args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
        },
      }

      // Get game type stats
      const gameStatsRequest = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_user_game_stats',
          args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
        },
      }
      
      console.log('📡 Making RPC requests to NEAR for user stats')
      
      // RPC endpoints with fallbacks - using more reliable endpoints
      const rpcEndpoints = [
        'https://near-testnet.api.pagoda.co/rpc/v1',
        'https://testnet-rpc.near.org',
        'https://rpc.testnet.near.org'
      ]

      // Try each endpoint until one works
      let userStatsResponse: Response | undefined
      let gameStatsResponse: Response | undefined
      let lastError: Error | null = null

      for (const endpoint of rpcEndpoints) {
        try {
          console.log(`🔄 Trying RPC endpoint: ${endpoint}`)
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          const responses = await Promise.all([
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userStatsRequest),
              signal: controller.signal
            }),
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(gameStatsRequest),
              signal: controller.signal
            })
          ])

          clearTimeout(timeoutId)
          
          userStatsResponse = responses[0]
          gameStatsResponse = responses[1]
          
          if (userStatsResponse.ok && gameStatsResponse.ok) {
            console.log(`✅ RPC requests successful with ${endpoint}`)
            break
          } else {
            throw new Error(`HTTP errors: ${userStatsResponse.status}, ${gameStatsResponse.status}`)
          }
        } catch (error: any) {
          console.warn(`❌ RPC endpoint ${endpoint} failed:`, error.message)
          lastError = error
          // Continue to next endpoint
        }
      }

      if (!userStatsResponse || !gameStatsResponse) {
        throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`)
      }

      console.log('📨 RPC response statuses:', userStatsResponse.status, gameStatsResponse.status)
      
      if (!userStatsResponse.ok || !gameStatsResponse.ok) {
        throw new Error(`HTTP error! status: ${userStatsResponse.status}, ${gameStatsResponse.status}`)
      }
      
      const [userStatsData, gameStatsData] = await Promise.all([
        userStatsResponse.json(),
        gameStatsResponse.json()
      ])
      
      console.log('📊 RPC response data:', { userStatsData, gameStatsData })
      
      // Handle RPC errors
      if (userStatsData.error) {
        console.error('❌ RPC error in user stats:', userStatsData.error)
        if (userStatsData.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(userStatsData.error.message || 'RPC error occurred')
      }

      if (gameStatsData.error) {
        console.error('❌ RPC error in game stats:', gameStatsData.error)
        if (gameStatsData.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(gameStatsData.error.message || 'RPC error occurred')
      }
      
      // Decode results
      let userStats = null
      let gameTypeStats = []

      if (userStatsData.result && userStatsData.result.result) {
        userStats = JSON.parse(Buffer.from(userStatsData.result.result, 'base64').toString())
        console.log('✅ Decoded user stats:', userStats)
      }

      if (gameStatsData.result && gameStatsData.result.result) {
        gameTypeStats = JSON.parse(Buffer.from(gameStatsData.result.result, 'base64').toString())
        console.log('✅ Decoded game type stats:', gameTypeStats)
      }

      // If no user stats, return null
      if (!userStats) {
        console.log('❌ No user stats found - user may not have played yet')
        return null
      }

      // Calculate win rate
      const winRate = userStats.gamesPlayed > 0 ? (userStats.gamesWon / userStats.gamesPlayed) * 100 : 0
      
      // Find favorite game (most played)
      let favoriteGame = "N/A"
      let maxGames = 0
      for (const gameStat of gameTypeStats) {
        if (gameStat.gamesPlayed > maxGames) {
          maxGames = gameStat.gamesPlayed
          favoriteGame = gameStat.gameType
        }
      }

      // Transform game type stats to match expected format
      const transformedGameTypeStats = gameTypeStats.map((stat: any) => ({
        gameType: stat.gameType,
        totalBets: parseFloat(stat.totalBets) / 1e24, // Convert from yoctoNEAR to NEAR
        totalWon: parseFloat(stat.totalWon) / 1e24,
        totalLost: parseFloat(stat.totalLost) / 1e24,
        gamesPlayed: stat.gamesPlayed,
        gamesWon: stat.gamesWon,
        winRate: stat.gamesPlayed > 0 ? (stat.gamesWon / stat.gamesPlayed) * 100 : 0,
        avgMultiplier: stat.gamesPlayed > 0 ? stat.totalMultiplierPercent / stat.gamesPlayed / 100 : 0,
        bestMultiplier: stat.bestMultiplierPercent / 100
      }))

      // Return comprehensive stats in expected format
      const comprehensiveStats = {
        totalBet: userStats.totalBet.toString(),
        totalWon: userStats.totalWon.toString(),
        totalLost: userStats.totalLost.toString(),
        withdrawableBalance: userStats.withdrawableBalance.toString(),
        gamesPlayed: userStats.gamesPlayed,
        gamesWon: userStats.gamesWon,
        winRate: winRate,
        favoriteGame: favoriteGame,
        joinDate: userStats.joinDate?.toString() || "0",
        lastPlayDate: userStats.lastPlayDate?.toString() || "0",
        gameTypeStats: transformedGameTypeStats
      }

      console.log('✅ Returning comprehensive stats:', comprehensiveStats)
      return comprehensiveStats
      
    } catch (error: any) {
      console.error('❌ Error getting user stats:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching user stats')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get user stats')
      }
    }
  }

  /**
   * Get comprehensive user statistics including game type breakdown
   * @param accountId - User account ID
   * @returns Comprehensive user stats object
   */
  async getUserComprehensiveStats(accountId: string): Promise<any> {
    console.log('🔍 ContractService.getUserComprehensiveStats called with accountId:', accountId)
    console.log('📋 Contract ID:', this.contractId)
    
    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_user_comprehensive_stats',
          args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
        },
      }
      
      console.log('📡 Making RPC request to NEAR:', requestBody)
      
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📨 RPC response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 RPC response data:', data)
      
      // Handle RPC errors
      if (data.error) {
        console.error('❌ RPC error:', data.error)
        if (data.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(data.error.message || 'RPC error occurred')
      }
      
      if (data.result && data.result.result) {
        const decodedResult = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        console.log('✅ Decoded comprehensive user stats:', decodedResult)
        return decodedResult
      }
      
      console.log('❌ No result in RPC response - user may not have stats yet')
      return null
    } catch (error: any) {
      console.error('❌ Error getting comprehensive user stats:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching user stats')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get comprehensive user stats')
      }
    }
  }

  /**
   * Get user game type statistics
   * @param accountId - User account ID
   * @returns Array of game type statistics
   */
  async getUserGameStats(accountId: string): Promise<any[]> {
    console.log('🔍 ContractService.getUserGameStats called with accountId:', accountId)
    console.log('📋 Contract ID:', this.contractId)
    
    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_user_game_stats',
          args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
        },
      }
      
      console.log('📡 Making RPC request to NEAR:', requestBody)
      
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📨 RPC response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 RPC response data:', data)
      
      // Handle RPC errors
      if (data.error) {
        console.error('❌ RPC error:', data.error)
        if (data.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(data.error.message || 'RPC error occurred')
      }
      
      if (data.result && data.result.result) {
        const decodedResult = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        console.log('✅ Decoded user game stats:', decodedResult)
        return decodedResult
      }
      
      console.log('❌ No result in RPC response - user may not have game stats yet')
      return []
    } catch (error: any) {
      console.error('❌ Error getting user game stats:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching user game stats')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get user game stats')
      }
    }
  }

  /**
   * Get contract-wide statistics
   * @returns Contract statistics object
   */
  async getContractStats(): Promise<any> {
    console.log('🔍 ContractService.getContractStats called')
    console.log('📋 Contract ID:', this.contractId)
    
    try {
      const requestBody = {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: this.contractId,
          method_name: 'get_contract_stats',
          args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
        },
      }
      
      console.log('📡 Making RPC request to NEAR:', requestBody)
      
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📨 RPC response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 RPC response data:', data)
      
      // Handle RPC errors
      if (data.error) {
        console.error('❌ RPC error:', data.error)
        if (data.error.message?.includes('Contract method is not found')) {
          throw new Error('Contract method is not found')
        }
        throw new Error(data.error.message || 'RPC error occurred')
      }
      
      if (data.result && data.result.result) {
        const decodedResult = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        console.log('✅ Decoded contract stats:', decodedResult)
        return decodedResult
      }
      
      console.log('❌ No result in RPC response')
      return null
    } catch (error: any) {
      console.error('❌ Error getting contract stats:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching contract stats')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get contract stats')
      }
    }
  }

  /**
   * Withdraw winnings
   * @returns Transaction hash
   */
  async withdraw(): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'withdraw',
              args: {},
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error withdrawing:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to withdraw')
    }
  }

  /**
   * Get contract total losses
   * @returns Total losses amount
   */
  async getContractTotalLosses(): Promise<string> {
    try {
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_contract_total_losses',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return Buffer.from(data.result.result, 'base64').toString()
      }
      return '0'
    } catch (error: any) {
      console.error('Error getting contract losses:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to get contract losses')
    }
  }

  /**
   * Get total number of users
   * @returns Total users count
   */
  async getTotalUsers(): Promise<number> {
    try {
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_total_users',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return parseInt(Buffer.from(data.result.result, 'base64').toString())
      }
      return 0
    } catch (error: any) {
      console.error('Error getting total users:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to get total users')
    }
  }

  /**
   * Check if user has pending bet
   * @param accountId - User account ID
   * @returns Boolean indicating if user has pending bet
   */
  async hasPendingBet(accountId: string): Promise<boolean> {
    try {
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_pending_bet',
            args_base64: Buffer.from(JSON.stringify({ accountId })).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        const result = JSON.parse(Buffer.from(data.result.result, 'base64').toString())
        return result !== null
      }
      return false
    } catch (error: any) {
      console.error('Error checking pending bet:', error)
      return false // Default to false if method doesn't exist
    }
  }

  /**
   * Get oracle account ID
   * @returns Oracle account ID
   */
  async getOracleAccount(): Promise<string> {
    try {
      const response = await fetch('https://near-testnet.api.pagoda.co/rpc/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: this.contractId,
            method_name: 'get_oracle_account',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          },
        }),
      })

      const data = await response.json()
      if (data.result && data.result.result) {
        return Buffer.from(data.result.result, 'base64').toString().replace(/"/g, '')
      }
      return 'oracle.testnet'
    } catch (error: any) {
      console.error('Error getting oracle account:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to get oracle account')
    }
  }

  /**
   * Set oracle account (admin only)
   * @param oracleAccountId - New oracle account ID
   * @returns Transaction hash
   */
  async setOracleAccount(oracleAccountId: string): Promise<string> {
    try {
      const wallet = await this.selector.wallet()
      
      const result = await wallet.signAndSendTransaction({
        signerId: this.account.accountId,
        receiverId: this.contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'set_oracle_account',
              args: { oracleAccountId },
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      })

      return result.transaction.hash
    } catch (error: any) {
      console.error('Error setting oracle account:', error)
      // @ts-ignore - best effort error type
      throw new Error(error.message || 'Failed to set oracle account')
    }
  }
}