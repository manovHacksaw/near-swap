/**
 * Game Outcome Service
 * 
 * This service stores game outcomes locally so the resolver script can pick them up
 * and automatically resolve games. Only the resolver account can call resolve_game.
 */

export interface GameOutcome {
  gameId: string;
  didWin: boolean;
  multiplier: number;
  timestamp: number;
  gameType: string;
  player: string;
}

class GameOutcomeService {
  private readonly STORAGE_KEY = 'game_outcomes';

  /**
   * Resolve game directly by sending outcome data to resolver
   */
  async resolveGame(outcome: GameOutcome): Promise<void> {
    try {
      console.log(`🚀 Resolving game: ${outcome.gameId} - ${outcome.didWin ? 'WIN' : 'LOSE'} at ${outcome.multiplier}x`);
      
        // Both development and production now use the same near-api-js approach
        const apiEndpoint = '/api/resolve-game';
      
      console.log(`🔧 Using unified near-api-js resolver: ${apiEndpoint}`);
      
      // Use the appropriate API route
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: outcome.gameId,
          didWin: outcome.didWin,
          multiplier: outcome.multiplier,
          gameType: outcome.gameType,
          player: outcome.player
        })
      });
      
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Game resolved successfully:', result);
            console.log('ℹ️ Transaction hash:', result.transactionHash);
          } else {
            const errorData = await response.json();
            console.error('❌ Failed to resolve game:', errorData.message);
            throw new Error(errorData.message);
          }
    } catch (error) {
      console.error('❌ Error resolving game:', error);
      throw error;
    }
  }


  /**
   * Get all stored game outcomes
   */
  getStoredOutcomes(): GameOutcome[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get stored outcomes:', error);
      return [];
    }
  }

  /**
   * Get outcomes for a specific game ID
   */
  getOutcomeForGame(gameId: string): GameOutcome | null {
    const outcomes = this.getStoredOutcomes();
    return outcomes.find(outcome => outcome.gameId === gameId) || null;
  }

  /**
   * Remove an outcome after it's been processed
   */
  removeOutcome(gameId: string): void {
    try {
      const outcomes = this.getStoredOutcomes();
      const filteredOutcomes = outcomes.filter(outcome => outcome.gameId !== gameId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredOutcomes));
      console.log(`🗑️ Removed outcome for game: ${gameId}`);
    } catch (error) {
      console.error('❌ Failed to remove outcome:', error);
    }
  }

  /**
   * Clear all stored outcomes (useful for testing)
   */
  clearAllOutcomes(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 Cleared all game outcomes');
    } catch (error) {
      console.error('❌ Failed to clear outcomes:', error);
    }
  }

  /**
   * Get outcomes that haven't been processed yet (for resolver script)
   */
  getPendingOutcomes(): GameOutcome[] {
    return this.getStoredOutcomes();
  }
}

// Export singleton instance
export const gameOutcomeService = new GameOutcomeService();
