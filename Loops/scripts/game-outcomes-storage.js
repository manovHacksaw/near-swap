#!/usr/bin/env node

/**
 * Game Outcomes Storage
 * 
 * Simple file-based storage for game outcomes that can be accessed by both
 * the frontend (via HTTP API) and the resolver script (via file system).
 */

const fs = require('fs');
const path = require('path');

const OUTCOMES_FILE = path.join(__dirname, '..', 'game-outcomes.json');

class GameOutcomesStorage {
  constructor() {
    this.ensureOutcomesFile();
  }

  ensureOutcomesFile() {
    if (!fs.existsSync(OUTCOMES_FILE)) {
      fs.writeFileSync(OUTCOMES_FILE, JSON.stringify([], null, 2));
    }
  }

  /**
   * Store a game outcome
   */
  storeOutcome(outcome) {
    try {
      const outcomes = this.getOutcomes();
      const updatedOutcomes = [...outcomes, outcome];
      
      // Keep only the last 100 outcomes to prevent file bloat
      const trimmedOutcomes = updatedOutcomes.slice(-100);
      
      fs.writeFileSync(OUTCOMES_FILE, JSON.stringify(trimmedOutcomes, null, 2));
      console.log(`📝 Stored game outcome: ${outcome.gameId} - ${outcome.didWin ? 'WIN' : 'LOSE'} at ${outcome.multiplier}x`);
      return true;
    } catch (error) {
      console.error('❌ Failed to store game outcome:', error);
      return false;
    }
  }

  /**
   * Get all stored outcomes
   */
  getOutcomes() {
    try {
      if (!fs.existsSync(OUTCOMES_FILE)) {
        return [];
      }
      const data = fs.readFileSync(OUTCOMES_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to read outcomes:', error);
      return [];
    }
  }

  /**
   * Get outcome for a specific game
   */
  getOutcomeForGame(gameId) {
    const outcomes = this.getOutcomes();
    return outcomes.find(outcome => outcome.gameId === gameId) || null;
  }

  /**
   * Remove an outcome after processing
   */
  removeOutcome(gameId) {
    try {
      const outcomes = this.getOutcomes();
      const filteredOutcomes = outcomes.filter(outcome => outcome.gameId !== gameId);
      fs.writeFileSync(OUTCOMES_FILE, JSON.stringify(filteredOutcomes, null, 2));
      console.log(`🗑️ Removed outcome for game: ${gameId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove outcome:', error);
      return false;
    }
  }

  /**
   * Clear all outcomes
   */
  clearAllOutcomes() {
    try {
      fs.writeFileSync(OUTCOMES_FILE, JSON.stringify([], null, 2));
      console.log('🧹 Cleared all game outcomes');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear outcomes:', error);
      return false;
    }
  }

  /**
   * Get pending outcomes (not yet processed)
   */
  getPendingOutcomes() {
    return this.getOutcomes();
  }
}

// Export singleton instance
const gameOutcomesStorage = new GameOutcomesStorage();

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const gameId = process.argv[3];

  switch (command) {
    case 'list':
      console.log('📋 All stored outcomes:');
      console.log(JSON.stringify(gameOutcomesStorage.getOutcomes(), null, 2));
      break;
    
    case 'get':
      if (!gameId) {
        console.error('❌ Please provide a game ID');
        process.exit(1);
      }
      const outcome = gameOutcomesStorage.getOutcomeForGame(gameId);
      if (outcome) {
        console.log(`📋 Outcome for game ${gameId}:`);
        console.log(JSON.stringify(outcome, null, 2));
      } else {
        console.log(`❌ No outcome found for game ${gameId}`);
      }
      break;
    
    case 'remove':
      if (!gameId) {
        console.error('❌ Please provide a game ID');
        process.exit(1);
      }
      gameOutcomesStorage.removeOutcome(gameId);
      break;
    
    case 'clear':
      gameOutcomesStorage.clearAllOutcomes();
      break;
    
    default:
      console.log('Usage: node game-outcomes-storage.js <command> [gameId]');
      console.log('Commands:');
      console.log('  list     - List all stored outcomes');
      console.log('  get <id> - Get outcome for specific game');
      console.log('  remove <id> - Remove outcome for specific game');
      console.log('  clear    - Clear all outcomes');
      break;
  }
}

module.exports = gameOutcomesStorage;
