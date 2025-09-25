const { exec } = require('child_process');
require('dotenv').config();

// Configuration
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';

console.log('🎯 Resolving pending games...');
console.log(`📋 Contract: ${CONTRACT_ID}`);
console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);

// Get pending games
async function getPendingGames() {
  return new Promise((resolve, reject) => {
    exec(`near view ${CONTRACT_ID} get_pending_games --networkId testnet`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const games = JSON.parse(stdout);
        resolve(games);
      } catch (parseError) {
        resolve([]);
      }
    });
  });
}

// Resolve a game
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

// Main function
async function resolvePendingGames() {
  try {
    console.log('\n🔍 Fetching pending games...');
    const pendingGames = await getPendingGames();
    
    if (pendingGames.length === 0) {
      console.log('✨ No pending games to resolve');
      return;
    }
    
    console.log(`📊 Found ${pendingGames.length} pending games`);
    
    for (const game of pendingGames) {
      console.log(`\n🎮 Game ID: ${game.gameId}`);
      console.log(`👤 Player: ${game.player}`);
      console.log(`💰 Amount: ${(parseFloat(game.amount) / 1e24).toFixed(4)} NEAR`);
      console.log(`🎯 Game Type: ${game.gameType}`);
      
      // Simple resolution logic - you can customize this
      const didWin = Math.random() > 0.5; // 50% win rate for demo
      const multiplier = didWin ? (1.5 + Math.random() * 1.5) : 1.0; // 1.5x to 3x for wins
      
      await resolveGame(game.gameId, didWin, multiplier);
      
      // Wait a bit between resolutions
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 All pending games resolved!');
    
  } catch (error) {
    console.log('\n❌ Error resolving games:', error.message);
    process.exit(1);
  }
}

resolvePendingGames();
