const { exec } = require('child_process');
require('dotenv').config();

// Configuration
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';

console.log('🚀 Working Game Resolver');
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

// Resolve a single game
async function resolveGame(gameId, didWin, multiplier) {
  return new Promise((resolve, reject) => {
    const args = JSON.stringify({ gameId, didWin, multiplier });
    
    // Use the resolver account to call the contract
    const command = `near call ${CONTRACT_ID} resolve_game '${args}' --accountId ${RESOLVER_ACCOUNT_ID} --networkId testnet --useLedgerKey`;
    
    console.log(`🎲 Resolving game ${gameId}: ${didWin ? 'WIN' : 'LOSE'} (${multiplier}x)`);
    console.log(`📡 Command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Error resolving game ${gameId}:`, error.message);
        reject(error);
        return;
      }
      
      console.log(`✅ Game ${gameId} resolved successfully!`);
      console.log(`📋 Result: ${stdout.trim()}`);
      resolve(stdout);
    });
  });
}

// Simple resolution logic
function determineOutcome(gameType) {
  const random = Math.random();
  
  switch (gameType) {
    case 'mines':
      // Mines: 40% win rate, 2x-4x multiplier
      const minesWin = random > 0.6;
      const minesMultiplier = minesWin ? (2.0 + Math.random() * 2.0) : 1.0;
      return { didWin: minesWin, multiplier: minesMultiplier };
      
    case 'coinflip':
      // Coinflip: 50% win rate, 1.8x multiplier
      const coinWin = random > 0.5;
      const coinMultiplier = coinWin ? 1.8 : 1.0;
      return { didWin: coinWin, multiplier: coinMultiplier };
      
    default:
      // Default: 50% win rate, 1.8x multiplier
      const defaultWin = random > 0.5;
      const defaultMultiplier = defaultWin ? 1.8 : 1.0;
      return { didWin: defaultWin, multiplier: defaultMultiplier };
  }
}

// Main resolver function
async function resolvePendingGames() {
  try {
    console.log('\n📊 Fetching pending games...');
    const pendingGames = await getPendingGames();
    
    if (pendingGames.length === 0) {
      console.log('✨ No pending games to resolve');
      return;
    }
    
    console.log(`📊 Found ${pendingGames.length} pending games`);
    
    for (const gameId of pendingGames) {
      console.log(`\n🎮 Processing game: ${gameId}`);
      
      // Get game details
      const gameDetails = await getGameDetails(gameId);
      if (gameDetails) {
        console.log(`👤 Player: ${gameDetails.player}`);
        console.log(`💰 Amount: ${(parseFloat(gameDetails.amount) / 1e24).toFixed(4)} NEAR`);
        console.log(`🎯 Game Type: ${gameDetails.gameType}`);
        
        // Determine outcome
        const { didWin, multiplier } = determineOutcome(gameDetails.gameType);
        
        // Resolve the game
        try {
          await resolveGame(gameId, didWin, multiplier);
          console.log(`✅ Game ${gameId} resolved: ${didWin ? 'WIN' : 'LOSE'} (${multiplier}x)`);
        } catch (error) {
          console.log(`❌ Failed to resolve game ${gameId}:`, error.message);
        }
        
        // Wait between resolutions
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`❌ Could not get details for game ${gameId}`);
      }
    }
    
    console.log('\n🎉 Finished processing all games!');
    
  } catch (error) {
    console.log('\n❌ Error in resolver:', error.message);
  }
}

// Run the resolver
resolvePendingGames();
