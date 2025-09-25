import { NextRequest, NextResponse } from 'next/server';
import { connect, keyStores, utils } from 'near-api-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, didWin, multiplier, gameType, player } = body;

    if (!gameId || didWin === undefined || !multiplier) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: gameId, didWin, multiplier' },
        { status: 400 }
      );
    }

    console.log(`🚀 Production Resolver: Resolving game ${gameId}`);
    console.log(`📋 Outcome: ${didWin ? 'WIN' : 'LOSE'} with ${multiplier}x multiplier`);
    console.log(`📋 Game type: ${gameType}, Player: ${player}`);

    // Get environment variables
    const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
    const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';
    const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY;

    if (!RESOLVER_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, message: 'Resolver private key not configured in environment variables' },
        { status: 500 }
      );
    }

    console.log(`🔧 Contract: ${CONTRACT_ID}`);
    console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);

    // Try multiple RPC endpoints for reliability
    const rpcEndpoints = [
      'https://near-testnet.api.pagoda.co/rpc/v1', // Pagoda - usually more reliable
      'https://testnet-rpc.near.org', // Official backup
      'https://rpc.testnet.near.org', // Official (deprecated but still works sometimes)
      'https://near-testnet.lava.build', // Lava RPC
      'https://testnet.nearapi.org' // Alternative provider
    ];

    let result;
    let lastError;

    for (const nodeUrl of rpcEndpoints) {
      try {
        console.log(`🔗 Trying RPC endpoint: ${nodeUrl}`);
        
        // REAL BLOCKCHAIN TRANSACTION - Using near-api-js HIGH LEVEL approach
        console.log(`🔗 Making REAL blockchain transaction for ${gameId}`);
        
        // Set up key store with private key (following official docs)
        const keyStore = new keyStores.InMemoryKeyStore();
        const keyPair = utils.KeyPairEd25519.fromString(RESOLVER_PRIVATE_KEY);
        
        // Add the key to keyStore (must be inside async function)
        await keyStore.setKey("testnet", RESOLVER_ACCOUNT_ID, keyPair);
        
        // Configuration used to connect to NEAR (following official docs)
        const config = {
          networkId: "testnet",
          keyStore,
          nodeUrl: nodeUrl,
          walletUrl: "https://wallet.testnet.near.org",
          helperUrl: "https://helper.testnet.near.org",
          explorerUrl: "https://testnet.nearblocks.io",
        };
        
        // Connect to NEAR! :)
        const near = await connect(config);
        
        // Create a NEAR account object
        const senderAccount = await near.account(RESOLVER_ACCOUNT_ID);
        
        // Check account balance first
        const balance = await senderAccount.getAccountBalance();
        console.log(`💰 Resolver account balance: ${balance.available} yoctoNEAR`);
        
        // Call the contract to resolve the game - REAL BLOCKCHAIN TRANSACTION
        // Using functionCall method (similar to sendMoney but for contract calls)
        result = await senderAccount.functionCall({
          contractId: CONTRACT_ID,
          methodName: "resolve_game",
          args: {
            gameId: gameId,
            didWin: didWin,
            multiplier: multiplier
          },
          gas: BigInt("300000000000000"),  // 300 TGas
          attachedDeposit: BigInt("0"),    // in yoctoNEAR
        });
        
        console.log(`✅ REAL blockchain transaction successful for ${gameId}`);
        console.log(`📝 Transaction hash: ${result.transaction.hash}`);
        break; // Success, exit the loop
        
      } catch (error: any) {
        console.warn(`❌ Failed to resolve via ${nodeUrl}:`, error.message);
        lastError = error;
        
        // If it's a rate limit error, wait before trying next endpoint
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          console.log("⏳ Rate limited, waiting 3 seconds...");
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        continue;
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to resolve game after trying all endpoints');
    }

    console.log('✅ Game resolved successfully:', result);

    return NextResponse.json({
      success: true,
      message: `Game ${gameId} resolved successfully on blockchain`,
      gameId,
      didWin,
      multiplier,
      gameType,
      player,
      contractId: CONTRACT_ID,
      resolverAccountId: RESOLVER_ACCOUNT_ID,
      transactionHash: result.transaction.hash,
      timestamp: new Date().toISOString(),
      note: "Game was successfully resolved on the NEAR blockchain in real-time using near-api-js"
    });

  } catch (error: any) {
    console.error('❌ Production Resolver: Error resolving game:', error);
    return NextResponse.json(
      { success: false, message: `Error resolving game: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}