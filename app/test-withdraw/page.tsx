"use client";

import { useState } from 'react';

export default function TestWithdrawPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWithdrawQuote = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dry: true, // Start with dry run to test format
          depositMode: "SIMPLE",
          swapType: "EXACT_INPUT",
          slippageTolerance: 100,
          depositType: "INTENTS",
          originAsset: "nep141:wrap.near",
          destinationAsset: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", // USDT on Ethereum
          amount: "100000000000000000000000", // 0.1 NEAR
          refundTo: "test.near",
          refundType: "INTENTS",
          recipient: "0x1234567890123456789012345678901234567890", // Valid Ethereum address
          recipientType: "DESTINATION_CHAIN",
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error?.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testWithdrawQuoteReal = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dry: false, // Real quote request
          depositMode: "SIMPLE",
          swapType: "EXACT_INPUT",
          slippageTolerance: 100,
          depositType: "INTENTS",
          originAsset: "nep141:wrap.near",
          destinationAsset: "nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near", // USDT on Ethereum
          amount: "100000000000000000000000", // 0.1 NEAR
          refundTo: "test.near",
          refundType: "INTENTS",
          recipient: "0x1234567890123456789012345678901234567890", // Valid Ethereum address
          recipientType: "DESTINATION_CHAIN",
          deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error?.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Withdraw Quote Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Withdraw Quote Request</h2>
          <p className="text-gray-600 mb-4">
            This will test the withdraw quote functionality with a known good request.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={testWithdrawQuote}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Dry Run'}
            </button>
            
            <button
              onClick={testWithdrawQuoteReal}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Real Quote'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <pre className="text-red-700 text-sm whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">Success!</h3>
            <pre className="text-green-700 text-sm whitespace-pre-wrap overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
