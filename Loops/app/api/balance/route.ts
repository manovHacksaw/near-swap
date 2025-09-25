import { NextRequest, NextResponse } from 'next/server';
import { providers, utils } from 'near-api-js';
import { balanceCache } from '@/lib/balanceCache';
import { FallbackBalanceService } from '@/lib/fallbackBalanceService';
import { MockBalanceService } from '@/lib/mockBalanceService';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cachedBalance = balanceCache.getCachedBalance(accountId);
    if (cachedBalance) {
      return NextResponse.json({ 
        balance: cachedBalance, 
        cached: true,
        endpoint: 'cache'
      });
    }
    
    console.log(`🔍 API Balance Route: Fetching fresh balance for ${accountId}`);
    
    // Use multiple RPC endpoints for reliability (prioritizing faster, more reliable ones)
    const rpcEndpoints = [
      'https://near-testnet.api.pagoda.co/rpc/v1', // Pagoda - usually more reliable
      'https://testnet-rpc.near.org', // Official backup
      'https://rpc.testnet.near.org', // Official (deprecated but still works sometimes)
      'https://near-testnet.lava.build', // Lava RPC
      'https://testnet.nearapi.org' // Alternative provider
    ];
    
    let lastError;
    for (const endpoint of rpcEndpoints) {
      try {
        const provider = new providers.JsonRpcProvider({ 
          url: endpoint,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Add timeout to prevent hanging requests (reduced for faster fallback)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
        });
        
        const queryPromise = provider.query({
          request_type: "view_account",
          account_id: accountId,
          finality: "final",
        });
        
        const res: any = await Promise.race([queryPromise, timeoutPromise]);
        
        const formattedBalance = utils.format.formatNearAmount(res.amount, 2);
        
        // Cache the result
        balanceCache.setCachedBalance(accountId, formattedBalance);
        
        return NextResponse.json({
          balance: formattedBalance,
          endpoint: endpoint,
          cached: false
        });
      } catch (error: any) {
        console.warn(`RPC endpoint ${endpoint} failed:`, error.message);
        lastError = error;
        
        // If it's a rate limit error, wait before trying next endpoint
        if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('Rate limits exceeded')) {
          console.log("⏳ API Balance Route: Rate limited, waiting 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // If it's a timeout or connection error, wait less
        if (error.message?.includes('timeout') || error.message?.includes('fetch failed') || error.message?.includes('ConnectTimeoutError')) {
          console.log("⏳ API Balance Route: Connection timeout, waiting 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        continue;
      }
    }
    
    // If all endpoints failed, try fallback service
    console.log('⚠️ All RPC endpoints failed, trying fallback service...');
    const fallbackResult = await FallbackBalanceService.getBalance(accountId);
    
    if (fallbackResult.success) {
      return NextResponse.json({
        balance: fallbackResult.balance,
        endpoint: 'fallback',
        cached: false,
        source: fallbackResult.source
      });
    }
    
    // If even fallback failed, use mock balance for development
    if (MockBalanceService.shouldUseMock()) {
      const mockBalance = MockBalanceService.getMockBalance(accountId);
      return NextResponse.json({
        balance: mockBalance,
        endpoint: 'mock',
        cached: false,
        source: 'mock',
        note: 'Using mock balance for development'
      });
    }
    
    // If even fallback failed, return error
    throw lastError;
  } catch (error: any) {
    console.error('Failed to fetch balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', details: error.message },
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
