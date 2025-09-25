import { NextRequest, NextResponse } from 'next/server';
import { connect, keyStores, KeyPair, Account } from 'near-api-js';
import * as dotenv from 'dotenv';

dotenv.config();

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

    const CONTRACT_ID = process.env.CONTRACT_ID!;
    const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID!;
    const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY!;
    const NETWORK_ID = 'testnet';

    if (!RESOLVER_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, message: 'Resolver private key not configured' },
        { status: 500 }
      );
    }

    // Setup keyStore and NEAR connection
    const keyStore = new keyStores.InMemoryKeyStore();

    const keyPair = KeyPair.fromString(RESOLVER_PRIVATE_KEY);
    console.log("KEYE PAIR", keyPair);
    await keyStore.setKey(NETWORK_ID, RESOLVER_ACCOUNT_ID, keyPair);

    const near = await connect({
      networkId: NETWORK_ID,
      keyStore,
      nodeUrl: `https://rpc.${NETWORK_ID}.near.org`,
      walletUrl: `https://wallet.${NETWORK_ID}.near.org`,
      helperUrl: `https://helper.${NETWORK_ID}.near.org`,
    });

    const resolverAccount = await near.account(RESOLVER_ACCOUNT_ID);

    // Call the smart contract function
    const result = await resolverAccount.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'resolve_game',
      args: { gameId, didWin, multiplier },
      gas: '300000000000000', // 300 TGas
      attachedDeposit: '0',
    });

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
      note: "Game resolved using near-api-js (no CLI script)",
    });

  } catch (error: any) {
    console.error('❌ Error resolving game:', error);
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
