import { NextResponse } from 'next/server';
import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
import { testQuoteRequest } from '@/app/lib/test-quote';
import "@/app/lib/oneclick-config";

export async function GET() {
  try {
    console.log('Testing quote request with:', JSON.stringify(testQuoteRequest, null, 2));
    
    const { quote } = await OneClickService.getQuote(testQuoteRequest);
    console.log('Test quote response:', quote);
    
    return NextResponse.json({ 
      success: true,
      quote,
      testRequest: testQuoteRequest
    });
  } catch (error: any) {
    console.error('Test quote error:', {
      message: error.message,
      status: error.status,
      body: error.body,
      stack: error.stack
    });
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.body || error.stack,
      testRequest: testQuoteRequest
    }, { status: 500 });
  }
}
