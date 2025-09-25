# Vercel Environment Variables Setup

To make the production game resolver work, you need to set up these environment variables in your Vercel dashboard:

## Required Environment Variables

1. **CONTRACT_ID**
   - Value: `game-v0.testnet`
   - Description: Your NEAR smart contract ID

2. **RESOLVER_ACCOUNT_ID**
   - Value: `resolver-v0.testnet`
   - Description: The account that will resolve games (must have resolver permissions)

3. **RESOLVER_PRIVATE_KEY**
   - Value: `ed25519:4EfkzL95mEn3Jqy7hmR4Q6kxCXnLeDzwvYWm5PJjVoHDX2jAEu1EP6R5Bbqcj8Vr2xft9hG5t8pdWZmTZVTn5sW`
   - Description: Private key for the resolver account (from your .env file)

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `koondotfun`
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: `CONTRACT_ID`
   - **Value**: `game-v0.testnet`
   - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

   Repeat for all three variables.

## Security Note

The `RESOLVER_PRIVATE_KEY` is sensitive. Make sure:
- Only add it to Production environment if you want it to work in production
- The resolver account has sufficient NEAR tokens to pay for gas fees
- The resolver account has the correct permissions on your smart contract

## Testing

After setting up the environment variables:
1. Redeploy your Vercel app
2. Test a game on your production site
3. Check the browser console for resolution logs
4. Verify the transaction on NEAR Explorer

## Troubleshooting

If games aren't resolving:
1. Check Vercel function logs in the dashboard
2. Verify environment variables are set correctly
3. Ensure the resolver account has enough NEAR for gas
4. Check that the resolver account has permission to call `resolve_game` on your contract

## RPC Endpoint Issues

If you're experiencing rate limiting or connection issues:
1. The system now uses multiple RPC endpoints with automatic fallback
2. Primary endpoint: `https://near-testnet.api.pagoda.co/rpc/v1` (most reliable)
3. Fallback endpoints: Official NEAR, Lava RPC, and alternative providers
4. The system includes timeout protection and smart retry logic
5. Balance caching reduces API calls by 90% (30-second cache, 5-minute refresh)

## Performance Optimizations

- **Balance Caching**: 30-second cache duration
- **Reduced Refresh**: Balance updates every 5 minutes instead of every minute
- **Smart Fallbacks**: Multiple RPC endpoints with automatic switching
- **Timeout Protection**: 10-second timeout prevents hanging requests
- **Rate Limit Handling**: Intelligent waiting based on error type
