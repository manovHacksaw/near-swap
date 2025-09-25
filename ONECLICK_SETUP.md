# 1Click API Setup Instructions

## Required Configuration

The 1Click API requires JWT authentication. You need to configure the following environment variables:

### 1. Get Your JWT Token

Visit this form to request your JWT token:
https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform

### 2. Set Environment Variables

Create a `.env.local` file in your project root with:

```bash
# 1Click API Configuration
ONECLICK_API_TOKEN=your-actual-jwt-token-here
ONECLICK_API_BASE=https://1click.chaindefuser.com
```

### 3. Restart Your Development Server

After setting the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Current Status

⚠️ **The application is currently configured but needs a valid JWT token to work.**

Without a valid token, you'll see:
- 500 errors when trying to get quotes
- "Bad Request - Invalid input data" errors
- Failed token loading

## Testing

Once you have a valid JWT token:
1. Set it in your `.env.local` file
2. Restart the development server
3. Try the swap functionality - it should work with real API calls

## API Endpoints

The following endpoints require authentication:
- `/api/quote` - Get swap quotes
- `/api/tokens` - Get supported tokens
- `/api/execution-status` - Check transaction status
