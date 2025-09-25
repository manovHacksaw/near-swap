import { NextRequest, NextResponse } from 'next/server';
import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import "@/app/lib/oneclick-config";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depositAddress = searchParams.get('depositAddress');
    const depositMemo = searchParams.get('depositMemo'); // Optional, required for some chains like Stellar
    
    if (!depositAddress) {
      return NextResponse.json(
        { error: 'Missing depositAddress parameter' },
        { status: 400 }
      );
    }
    
    console.log('Checking execution status for:', { depositAddress, depositMemo });
    
    // Call the API with optional memo parameter
    const status = await OneClickService.getExecutionStatus(
      depositAddress,
      depositMemo || undefined
    );
    
    console.log('Execution status:', status);
    
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Execution status API error:', {
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
