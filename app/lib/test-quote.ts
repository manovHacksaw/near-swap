import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';

// Test quote request based on the working example from swap.ts
export function createTestQuoteRequest(
  fromToken: string,
  toToken: string,
  amount: string,
  accountId: string
): QuoteRequest {
  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + 5);

  return {
    dry: false,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance: 10, // 0.1%
    depositType: QuoteRequest.depositType.INTENTS,
    originAsset: fromToken,
    destinationAsset: toToken,
    amount: amount,
    refundTo: accountId,
    refundType: QuoteRequest.refundType.INTENTS,
    recipient: accountId,
    recipientType: QuoteRequest.recipientType.INTENTS,
    deadline: deadline.toISOString(),
  };
}

// Example test request
export const testQuoteRequest = createTestQuoteRequest(
  "nep141:wrap.near",
  "nep141:eth.omft.near", 
  "100000000000000000000000", // 0.1 NEAR in yoctoNEAR
  "test.near"
);
