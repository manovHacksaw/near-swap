import { NextRequest, NextResponse } from 'next/server';
import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import "@/app/lib/oneclick-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, depositAddress } = body;
    
    if (!txHash || !depositAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: txHash and depositAddress' },
        { status: 400 }
      );
    }
    
    console.log('Submitting deposit transaction:', { txHash, depositAddress });
    
    const result = await OneClickService.submitDepositTx({
      txHash,
      depositAddress
    });
    
    console.log('Deposit submission result:', result);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Deposit submission error:', {
      message: error.message,
      status: error.status,
      body: error.body,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: error.message,
      details: error.body || error.stack
    }, { status: 500 });
  }
}
