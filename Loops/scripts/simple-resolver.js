const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// Configuration
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';

console.log('🚀 Starting automated game resolver...');
console.log(`📋 Contract: ${CONTRACT_ID}`);
console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);

// Function to execute NEAR CLI commands
function executeNearCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        console.warn('Warning:', stderr);
      }
      resolve(stdout);
    });
  });
}

// Get pending games from contract
async function getPendingGames() {
  try {
    console.log('📊 Fetching pending games...');
    const command = `near contract call-function as-read-only ${CONTRACT_ID} get_pending_games json-args '{}' network-config testnet`;
    const result = await executeNearCommand(command);
    
    // Parse the result to extract the array
    const lines = result.split('\n');
    let jsonResult = null;
    
    for (const line of lines) {
      if (line.includes('[') && line.includes(']')) {
        try {
          jsonResult = JSON.parse(line.trim());
          break;
        } catch (e) {
          // Continue looking for valid JSON
        }
      }
    }
    
    if (jsonResult && Array.isArray(jsonResult)) {
      console.log(`✅ Found ${jsonResult.length} pending games`);
      return jsonResult;
    } else {
      console.log('✅ No pending games found');
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting pending games:', error.message);
    return [];
  }
}

// Get game details
async function getGameDetails(gameId) {
  try {
    const command = `near contract call-function as-read-only ${CONTRACT_ID} get_game_details json-args '{"gameId": "${gameId}"}' network-config testnet`;
    const result = await executeNearCommand(command);
    
    // Parse the result
    const lines = result.split('\n');
    for (const line of lines) {
      if (line.includes('{') && line.includes('}')) {
        try {
          return JSON.parse(line.trim());
        } catch (e) {
          // Continue looking for valid JSON
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error getting game details for ${gameId}:`, error.message);
    return null;
  }
}

// Resolve a game
async function resolveGame(gameId, didWin, multiplierPercent = 100) {
  try {
    console.log(`🎯 Resolving game ${gameId}: ${didWin ? 'WIN' : 'LOSS'} (${multiplierPercent}%)`);
    
    const command = `near contract call-function ${CONTRACT_ID} resolve_game json-args '{"gameId": "${gameId}", "didWin": ${didWin}, "multiplierPercent": ${multiplierPercent}}' prepaid-gas 100.0 Tgas attached-deposit 0 yoctoNEAR sign-as ${RESOLVER_ACCOUNT_ID} network-config testnet`;
    
    const result = await executeNearCommand(command);
    
    // Extract transaction hash from result
    const lines = result.split('\n');
    for (const line of lines) {
      if (line.includes('Transaction ID:')) {
        const txHash = line.split('Transaction ID:')[1].trim();
        console.log(`✅ Game ${gameId} resolved successfully!`);
        console.log(`📋 Transaction: ${txHash}`);
        return txHash;
      }
    }
    
    console.log(`✅ Game ${gameId} resolved successfully!`);
    return 'unknown';
  } catch (error) {
    console.error(`❌ Error resolving game ${gameId}:`, error.message);
    throw error;
  }
}

// Main resolver function
async function runResolver() {
  try {
    // Get pending games
    const pendingGames = await getPendingGames();

    if (pendingGames.length === 0) {
      console.log('✨ No pending games to resolve');
      return;
    }

    // Process each pending game
    for (const gameId of pendingGames) {
      try {
        const gameDetails = await getGameDetails(gameId);
        
        if (!gameDetails) {
          console.log(`⚠️ Game ${gameId} not found, skipping...`);
          continue;
        }

        const gameType = gameDetails.gameType || 'unknown';
        const amount = gameDetails.amount;
        
        console.log(`🎮 Processing ${gameType} game ${gameId}`);
        console.log(`💰 Amount: ${(parseFloat(amount) / 1e24).toFixed(4)} NEAR`);

        // Simple resolution logic - you can customize this based on your needs
        let didWin = false;
        let multiplierPercent = 100;

        // Example: For testing, resolve 70% as wins
        if (Math.random() < 0.7) {
          didWin = true;
          multiplierPercent = 150 + Math.floor(Math.random() * 200); // Random multiplier between 150% and 350%
        }

        await resolveGame(gameId, didWin, multiplierPercent);
        
        // Wait a bit between resolutions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to process game ${gameId}:`, error.message);
        continue;
      }
    }

    console.log('✅ Resolver run completed');
    
  } catch (error) {
    console.error('❌ Resolver error:', error.message);
    process.exit(1);
  }
}

// Run the resolver
if (require.main === module) {
  runResolver().catch(console.error);
}

module.exports = { runResolver, resolveGame, getPendingGames, getGameDetails };
