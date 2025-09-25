import { WalletSelector } from '@near-wallet-selector/core'
import { Account } from '@near-wallet-selector/core'
import { CONTRACT_ID } from '@/near.config'

export class ResolverService {
  private selector: WalletSelector
  private account: Account
  private contractId: string

  constructor(selector: WalletSelector, account: Account, contractId: string = CONTRACT_ID) {
    this.selector = selector
    this.account = account
    this.contractId = contractId
  }

  /**
   * Resolve a game as the resolver account
   * @param gameId - Game ID to resolve
   * @param didWin - Whether the player won
   * @param multiplier - Win multiplier
   * @returns Transaction hash
   */
  async resolveGame(gameId: string, didWin: boolean, multiplier: number = 1.0): Promise<string> {
    console.log('🎯 ResolverService.resolveGame called')
    console.log('🎮 Game ID:', gameId)
    console.log('🏆 Did Win:', didWin)
    console.log('📊 Multiplier:', multiplier)
    console.log('📋 Contract ID:', this.contractId)
    console.log('👤 Resolver Account ID:', this.account.accountId)
    
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
          errorMessage = 'Only the resolver account can resolve games. Please use the resolver account.'
        } else if (executionError) {
          errorMessage = `Contract error: ${executionError}`
        }
      }
      
      console.error('📋 Final error message:', errorMessage)
      
      throw new Error(errorMessage)
    }
  }

  /**
   * Get resolver account ID from contract
   * @returns Resolver account ID
   */
  async getResolverAccount(): Promise<string> {
    console.log('🔍 ResolverService.getResolverAccount called')
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
          method_name: 'get_resolver_account',
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
        console.log('✅ Decoded resolver account:', decodedResult)
        return decodedResult
      }
      
      console.log('❌ No result in RPC response')
      return ''
    } catch (error: any) {
      console.error('❌ Error getting resolver account:', error)
      console.error('Error details:', error)
      
      // Re-throw with more specific error messages
      // @ts-ignore - best effort error type
      if (error.message?.includes('Contract method is not found')) {
        throw new Error('Contract method is not found')
      // @ts-ignore - best effort error type
      } else if (error.message?.includes('HTTP error')) {
        throw new Error('Network error occurred while fetching resolver account')
      } else {
        // @ts-ignore - best effort error type
        throw new Error(error.message || 'Failed to get resolver account')
      }
    }
  }
}
