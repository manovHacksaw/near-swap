const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// Configuration
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';

console.log('🚀 Starting automated game resolver (CLI version)...');
console.log(`📋 Contract: ${CONTRACT_ID}`);
console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);

// Get pending games using NEAR CLI
async function getPendingGames() {
  return new Promise((resolve, reject) => {
    exec(`near view ${CONTRACT_ID} get_pending_games --networkId testnet`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error getting pending games:', error.message);
        reject(error);
        return;
      }
      
      try {
        const games = JSON.parse(stdout);
        resolve(games);
      } catch (parseError) {
        console.log('✅ No pending games (empty response)');
        resolve([]);
      }
    });
  });
}

// Get game details
async function getGameDetails(gameId) {
  return new Promise((resolve, reject) => {
    const args = JSON.stringify({ gameId });
    exec(`near view ${CONTRACT_ID} get_game_details '${args}' --networkId testnet`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const gameDetails = JSON.parse(stdout);
        resolve(gameDetails);
      } catch (parseError) {
        resolve(null);
      }
    });
  });
}

// Resolve a game using NEAR CLI
async function resolveGame(gameId, didWin, multiplier) {
  return new Promise((resolve, reject) => {
    const args = JSON.stringify({ gameId, didWin, multiplier });
    const command = `near call ${CONTRACT_ID} resolve_game '${args}' --accountId ${RESOLVER_ACCOUNT_ID} --networkId testnet`;
    
    console.log(`🎲 Resolving game ${gameId}: ${didWin ? 'WIN' : 'LOSE'} (${multiplier}x)`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Error resolving game ${gameId}:`, error.message);
        reject(error);
        return;
      }
      
      console.log(`✅ Game ${gameId} resolved successfully!`);
      console.log(`📋 Transaction: ${stdout.trim()}`);
      resolve(stdout);
    });
  });
}

// Simple game resolution logic
function determineGameOutcome(gameType, gameDetails) {
  // This is a simple deterministic resolution based on game type
  // In production, you might want to use more sophisticated logic
  
  switch (gameType) {
    case 'coinflip':
      // 50% win rate for coinflip
      const didWin = Math.random() > 0.5;
      const multiplier = didWin ? 1.8 : 1.0;
      return { didWin, multiplier };
      
    case 'mines':
      // Mines game - higher risk, higher reward
      const minesWin = Math.random() > 0.6; // 40% win rate
      const minesMultiplier = minesWin ? (2.0 + Math.random() * 2.0) : 1.0; // 2x to 4x
      return { didWin: minesWin, multiplier: minesMultiplier };
      
    case 'paaji':
      // Paaji game - medium risk
      const paajiWin = Math.random() > 0.55; // 45% win rate
      const paajiMultiplier = paajiWin ? (1.5 + Math.random() * 1.0) : 1.0; // 1.5x to 2.5x
      return { didWin: paajiWin, multiplier: paajiMultiplier };
      
    case 'rugs':
      // Rugs game - high risk, high reward
      const rugsWin = Math.random() > 0.7; // 30% win rate
      const rugsMultiplier = rugsWin ? (3.0 + Math.random() * 2.0) : 1.0; // 3x to 5x
      return { didWin: rugsWin, multiplier: rugsMultiplier };
      
    default:
      // Default: 50% win rate, 1.8x multiplier
      const defaultWin = Math.random() > 0.5;
      const defaultMultiplier = defaultWin ? 1.8 : 1.0;
      return { didWin: defaultWin, multiplier: defaultMultiplier };
  }
}

// Main resolver loop
async function resolveGames() {
  try {
    console.log('📊 Fetching pending games...');
    const pendingGames = await getPendingGames();
    
    if (pendingGames.length === 0) {
      console.log('✨ No pending games to resolve');
      return;
    }
    
    console.log(`📊 Found ${pendingGames.length} pending games`);
    
    for (const game of pendingGames) {
      console.log(`\n🎮 Processing game: ${game.gameId}`);
      console.log(`👤 Player: ${game.player}`);
      console.log(`💰 Amount: ${(parseFloat(game.amount) / 1e24).toFixed(4)} NEAR`);
      console.log(`🎯 Game Type: ${game.gameType}`);
      
      // Get detailed game information
      const gameDetails = await getGameDetails(game.gameId);
      if (gameDetails) {
        console.log(`📋 Game Details:`, gameDetails);
      }
      
      // Determine game outcome
      const { didWin, multiplier } = determineGameOutcome(game.gameType, gameDetails);
      
      // Resolve the game
      await resolveGame(game.gameId, didWin, multiplier);
      
      // Wait between resolutions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('\n🎉 All pending games resolved!');
    
  } catch (error) {
    console.log('\n❌ Error in resolver:', error.message);
  }
}

// Run resolver in a loop
async function runResolver() {
  console.log('🔄 Starting resolver loop...');
  
  while (true) {
    try {
      await resolveGames();
      
      // Wait 30 seconds before checking again
      console.log('\n⏳ Waiting 30 seconds before next check...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.log('❌ Resolver loop error:', error.message);
      console.log('⏳ Waiting 60 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Resolver stopped by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Resolver stopped by system');
  process.exit(0);
});

// Start the resolver
runResolver();
