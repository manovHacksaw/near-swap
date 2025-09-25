"use client";

import { useState } from 'react';

export default function TestQuotePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testQuote = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dry: false,
          depositMode: "SIMPLE",
          swapType: "EXACT_INPUT",
          slippageTolerance: 100,
          depositType: "INTENTS",
          originAsset: "nep141:wrap.near",
          destinationAsset: "nep141:eth.bridge.near",
          amount: "100000000000000000000000", // 0.1 NEAR
          refundTo: "test.near",
          refundType: "INTENTS",
          recipient: "test.near",
          recipientType: "INTENTS",
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">1Click API Quote Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Quote Request</h2>
          <p className="text-gray-600 mb-4">
            This will test the 1Click API with a known good request to help debug any issues.
          </p>
          
          <button
            onClick={testQuote}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Testing...' : 'Test Quote API'}
          </button>
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
