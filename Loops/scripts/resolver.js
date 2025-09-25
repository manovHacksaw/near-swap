const { connect, keyStores, utils } = require('near-api-js');
const fs = require('fs');
require('dotenv').config();

// Configuration
const NETWORK_ID = 'testnet';
const NODE_URL = 'https://near-testnet.api.pagoda.co/rpc/v1';
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';
const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY;

if (!RESOLVER_PRIVATE_KEY) {
  console.error('❌ RESOLVER_PRIVATE_KEY not found in .env file');
  process.exit(1);
}

// Initialize NEAR connection
async function initNear() {
  const keyStore = new keyStores.InMemoryKeyStore();
  
  // Add the resolver's private key
  const keyPair = utils.KeyPair.fromString(RESOLVER_PRIVATE_KEY);
  await keyStore.setKey(NETWORK_ID, RESOLVER_ACCOUNT_ID, keyPair);

  const config = {
    networkId: NETWORK_ID,
    nodeUrl: NODE_URL,
    keyStore,
  };

  return await connect(config);
}

// Get pending games from contract
async function getPendingGames(near) {
  try {
    const account = await near.account(CONTRACT_ID);
    const result = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_pending_games',
      args: {}
    });
    return result || [];
  } catch (error) {
    console.error('❌ Error getting pending games:', error.message);
    return [];
  }
}

// Get game details
async function getGameDetails(near, gameId) {
  try {
    const account = await near.account(CONTRACT_ID);
    const result = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_game_details',
      args: { gameId }
    });
    return result;
  } catch (error) {
    console.error(`❌ Error getting game details for ${gameId}:`, error.message);
    return null;
  }
}

// Resolve a game
async function resolveGame(near, gameId, didWin, multiplier = 1.0) {
  try {
    const account = await near.account(RESOLVER_ACCOUNT_ID);
    
    console.log(`🎯 Resolving game ${gameId}: ${didWin ? 'WIN' : 'LOSS'} (${multiplier}×)`);
    
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'resolve_game',
      args: { gameId, didWin, multiplier },
      gas: '300000000000000', // 300 TGas
      attachedDeposit: '0'
    });

    console.log(`✅ Game ${gameId} resolved successfully!`);
    console.log(`📋 Transaction: ${result.transaction.hash}`);
    return result;
  } catch (error) {
    console.error(`❌ Error resolving game ${gameId}:`, error.message);
    throw error;
  }
}

// Main resolver function
async function runResolver() {
  console.log('🚀 Starting automated game resolver...');
  console.log(`📋 Contract: ${CONTRACT_ID}`);
  console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);
  
  try {
    const near = await initNear();
    console.log('✅ Connected to NEAR network');

    // Get pending games
    const pendingGames = await getPendingGames(near);
    console.log(`📊 Found ${pendingGames.length} pending games`);

    if (pendingGames.length === 0) {
      console.log('✨ No pending games to resolve');
      return;
    }

    // Process each pending game
    for (const gameId of pendingGames) {
      try {
        const gameDetails = await getGameDetails(near, gameId);
        
        if (!gameDetails) {
          console.log(`⚠️ Game ${gameId} not found, skipping...`);
          continue;
        }

        // For now, we'll implement a simple resolution logic
        // In a real implementation, you'd integrate with your game logic
        const gameType = gameDetails.gameType || 'unknown';
        const amount = gameDetails.amount;
        
        console.log(`🎮 Processing ${gameType} game ${gameId}`);
        console.log(`💰 Amount: ${utils.format.formatNearAmount(amount)} NEAR`);

        // Simple resolution logic - you can customize this based on your needs
        let didWin = false;
        let multiplier = 1.0;

        // Example: For testing, resolve 70% as wins
        if (Math.random() < 0.7) {
          didWin = true;
          multiplier = 1.5 + Math.random() * 2.0; // Random multiplier between 1.5x and 3.5x
        }

        await resolveGame(near, gameId, didWin, multiplier);
        
        // Wait a bit between resolutions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
