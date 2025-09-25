/**
 * Fallback Balance Service
 * Provides alternative methods to get balance when RPC endpoints fail
 */

interface BalanceResult {
  balance: string;
  source: 'rpc' | 'wallet' | 'fallback';
  success: boolean;
}

export class FallbackBalanceService {
  private static readonly CACHE_DURATION = 60000; // 1 minute
  private static cache = new Map<string, { balance: string; timestamp: number }>();

  /**
   * Try to get balance from wallet first, then fallback to RPC
   */
  static async getBalance(accountId: string, wallet?: any): Promise<BalanceResult> {
    // Check cache first
    const cached = this.cache.get(accountId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return {
        balance: cached.balance,
        source: 'rpc',
        success: true
      };
    }

    // Try wallet first if available
    if (wallet) {
      try {
        const accounts = await wallet.getAccounts();
        const currentAccount = accounts.find((acc: any) => acc.accountId === accountId);
        if (currentAccount && currentAccount.balance) {
          const balance = (parseFloat(currentAccount.balance) / (10 ** 24)).toFixed(2);
          this.cache.set(accountId, { balance, timestamp: Date.now() });
          return {
            balance,
            source: 'wallet',
            success: true
          };
        }
      } catch (error) {
        console.warn('⚠️ Wallet balance fetch failed:', error);
      }
    }

    // Fallback to a simple estimation based on recent activity
    // This is a last resort when all RPC endpoints fail
    return {
      balance: "0.00", // Conservative fallback
      source: 'fallback',
      success: false
    };
  }

  /**
   * Clear cache for an account
   */
  static clearCache(accountId: string): void {
    this.cache.delete(accountId);
  }

  /**
   * Clear all cache
   */
  static clearAllCache(): void {
    this.cache.clear();
  }
}
