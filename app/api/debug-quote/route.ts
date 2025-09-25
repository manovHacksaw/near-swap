import { NextRequest, NextResponse } from 'next/server';
import { OneClickService, QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import "@/app/lib/oneclick-config";

export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json();
    console.log('=== DEBUG QUOTE REQUEST ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // Log environment
    console.log('Environment check:');
    console.log('- Has token:', !!process.env.ONECLICK_API_TOKEN);
    console.log('- Token length:', process.env.ONECLICK_API_TOKEN?.length || 0);
    console.log('- Base URL:', process.env.ONECLICK_API_BASE || 'https://1click.chaindefuser.com');
    
    // Try to make the API call
    console.log('Making API call...');
    const { quote } = await OneClickService.getQuote(body);
    console.log('API call successful!');
    console.log('Quote response:', quote);
    
    return NextResponse.json({ 
      success: true,
      quote,
      requestBody: body
    });
  } catch (error: any) {
    console.log('=== DEBUG QUOTE ERROR ===');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error status:', error.status);
    console.log('Error body:', error.body);
    console.log('Error stack:', error.stack);
    
    // Try to parse the error body if it's a string
    let errorDetails = error.body;
    if (typeof error.body === 'string') {
      try {
        errorDetails = JSON.parse(error.body);
      } catch (e) {
        // Keep as string if not JSON
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: {
        type: error.constructor.name,
        message: error.message,
        status: error.status,
        body: errorDetails,
        stack: error.stack
      },
      requestBody: body
    }, { status: 500 });
  }
}
