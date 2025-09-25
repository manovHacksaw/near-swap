# 🎯 Automated Game Resolver System

This dApp uses an automated resolver system to process game outcomes without requiring user interaction for game resolution.

## 🔧 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Resolver Configuration
```bash
npm run setup-resolver
```

This will create a `.env` file with the required configuration.

### 3. Get Resolver Private Key
```bash
near keys list resolver.game-program.testnet --networkId testnet
```

Copy the private key and update your `.env` file:
```env
RESOLVER_PRIVATE_KEY=ed25519:YOUR_ACTUAL_PRIVATE_KEY_HERE
```

## 🚀 Running the Resolver

### One-time Resolution
```bash
npm run resolver
```

### Continuous Monitoring (with auto-restart)
```bash
npm run resolver:watch
```

## 🎮 How It Works

### Game Flow:
1. **User starts a game** → Game is created with `Pending` status
2. **User plays the game** → Game outcome is determined locally
3. **User cashes out or loses** → Game remains `Pending` on-chain
4. **Resolver script runs** → Automatically resolves all pending games
5. **User withdraws winnings** → From the stats page

### Resolver Logic:
- Fetches all pending games from the contract
- Processes each game based on the game type and outcome
- Calls `resolve_game` with the appropriate parameters
- Updates game status to `Won` or `Lost`
- Credits winnings to user's withdrawable balance

## 🔐 Security Features

- **Resolver-only access**: Only the resolver account can call `resolve_game`
- **Private key security**: Private key stored in `.env` (never committed)
- **Automatic processing**: No manual intervention required
- **Transparent transactions**: All resolutions are recorded on-chain

## 📊 Monitoring

The resolver script provides detailed logging:
- ✅ Successful game resolutions
- ❌ Failed resolutions with error details
- 📊 Pending game counts
- 🔗 Transaction hashes for verification

## 🛠️ Customization

### Resolver Logic
Edit `scripts/resolver.js` to customize:
- Game outcome determination
- Multiplier calculations
- Resolution timing
- Error handling

### Contract Methods
The contract provides these methods for the resolver:
- `get_pending_games()` - Get all pending games
- `get_game_details(gameId)` - Get specific game details
- `resolve_game(gameId, didWin, multiplier)` - Resolve a game

## 🚨 Troubleshooting

### Common Issues:

1. **"RESOLVER_PRIVATE_KEY not found"**
   - Make sure your `.env` file exists and contains the private key
   - Run `npm run setup-resolver` to create the file

2. **"Only the resolver can call this method"**
   - Verify the resolver account ID in `.env` matches the contract
   - Check that the private key belongs to the resolver account

3. **"Game not found"**
   - The game might have already been resolved
   - Check the game ID is correct

4. **Network errors**
   - Verify your internet connection
   - Check if the NEAR RPC endpoint is accessible

### Debug Mode:
Add `DEBUG=true` to your `.env` file for verbose logging.

## 📈 Production Deployment

For production deployment:

1. **Use a dedicated resolver account** with limited permissions
2. **Set up monitoring** for the resolver script
3. **Configure auto-restart** using PM2 or similar
4. **Set up alerts** for failed resolutions
5. **Regular backups** of the resolver configuration

## 🔄 Integration with Frontend

The frontend is designed to work seamlessly with the resolver:
- Games show "pending resolution" status
- Users can withdraw winnings from the stats page
- No manual resolution required from users
- Real-time updates when games are resolved

## 📝 Environment Variables

```env
# Required
CONTRACT_ID=game-v0.testnet
RESOLVER_ACCOUNT_ID=resolver-v0.testnet
RESOLVER_PRIVATE_KEY=ed25519:YOUR_PRIVATE_KEY

# Optional
NEAR_RPC_URL=https://near-testnet.api.pagoda.co/rpc/v1
DEBUG=false
```

## 🎯 Benefits

- **User Experience**: No need to sign resolution transactions
- **Automation**: Games are resolved automatically
- **Security**: Centralized resolution with proper access control
- **Transparency**: All resolutions are recorded on-chain
- **Scalability**: Can handle multiple games simultaneously
