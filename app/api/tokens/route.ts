import { NextResponse } from 'next/server';
import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import "@/app/lib/oneclick-config";

export async function GET() {
  try {
    console.log('Fetching tokens from 1Click API...');
    const tokens = await OneClickService.getTokens();
    console.log('Successfully fetched tokens:', tokens.length);
    
    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('Tokens API error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
