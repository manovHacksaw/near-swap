/**
 * Balance Cache Service
 * Reduces RPC calls by caching balance data with smart invalidation
 */

interface CachedBalance {
  balance: string;
  timestamp: number;
  accountId: string;
}

class BalanceCacheService {
  private cache = new Map<string, CachedBalance>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Get cached balance if valid, otherwise return null
   */
  getCachedBalance(accountId: string): string | null {
    const cached = this.cache.get(accountId);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - cached.timestamp) > this.CACHE_DURATION;

    if (isExpired) {
      this.cache.delete(accountId);
      return null;
    }

    console.log(`📦 Using cached balance for ${accountId}: ${cached.balance}`);
    return cached.balance;
  }

  /**
   * Cache a balance with timestamp
   */
  setCachedBalance(accountId: string, balance: string): void {
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupOldEntries();
    }

    this.cache.set(accountId, {
      balance,
      timestamp: Date.now(),
      accountId
    });

    console.log(`💾 Cached balance for ${accountId}: ${balance}`);
  }

  /**
   * Invalidate cache for a specific account (useful after transactions)
   */
  invalidateAccount(accountId: string): void {
    this.cache.delete(accountId);
    console.log(`🗑️ Invalidated cache for ${accountId}`);
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
    console.log(`🗑️ Cleared all balance cache`);
  }

  /**
   * Clean up expired entries
   */
  private cleanupOldEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if ((now - value.timestamp) > this.CACHE_DURATION) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ accountId: string; age: number; balance: string }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([accountId, data]) => ({
      accountId,
      age: now - data.timestamp,
      balance: data.balance
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// Export singleton instance
export const balanceCache = new BalanceCacheService();
