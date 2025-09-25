import { NextRequest, NextResponse } from 'next/server';
import { OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import "@/app/lib/oneclick-config";

export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json();
    console.log('Quote request received:', JSON.stringify(body, null, 2));
    
    // Log the current API configuration
    console.log('API Base URL:', process.env.ONECLICK_API_BASE || 'https://1click.chaindefuser.com');
    console.log('Token configured:', !!process.env.ONECLICK_API_TOKEN);
    
    const { quote } = await OneClickService.getQuote(body);
    console.log('Quote response:', quote);
    
    return NextResponse.json({ quote });
  } catch (error: any) {
    console.error('Quote API error details:', {
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
