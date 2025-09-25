# 🎲 NEAR Betting Contract Testing Guide

## Prerequisites
- ✅ NEAR CLI installed (`near-cli-rs 0.22.2`)
- ✅ Contract built (`build/hello_near.wasm`)
- ✅ Testnet network configured

## Step-by-Step Testing Process

### 1. Create a Test Account

```bash
# Create a new test account (interactive command)
near account create-account sponsor-by-faucet-service YOUR_ACCOUNT.testnet autogenerate-new-keypair

# Example:
near account create-account sponsor-by-faucet-service game-bet-demo.testnet autogenerate-new-keypair
```

### 2. Deploy the Contract

```bash
# Deploy to testnet
near contract deploy --wasmFile build/hello_near.wasm --accountId YOUR_ACCOUNT.testnet

# Example:
near contract deploy --wasmFile build/hello_near.wasm --accountId game-bet-demo.testnet
```

### 3. Test Contract Functions

#### Place a Bet (1 NEAR)
```bash
near contract call-function as-transaction YOUR_ACCOUNT.testnet bet \
  --args '{}' \
  --deposit 1 \
  --accountId YOUR_ACCOUNT.testnet
```

#### Check User Stats
```bash
near contract call-function as-read-only YOUR_ACCOUNT.testnet get_user \
  --args '{"accountId":"YOUR_ACCOUNT.testnet"}'
```

#### Place Another Bet (0.5 NEAR)
```bash
near contract call-function as-transaction YOUR_ACCOUNT.testnet bet \
  --args '{}' \
  --deposit 0.5 \
  --accountId YOUR_ACCOUNT.testnet
```

#### Check Updated Stats
```bash
near contract call-function as-read-only YOUR_ACCOUNT.testnet get_user \
  --args '{"accountId":"YOUR_ACCOUNT.testnet"}'
```

#### Withdraw Winnings
```bash
near contract call-function as-transaction YOUR_ACCOUNT.testnet withdraw \
  --args '{}' \
  --accountId YOUR_ACCOUNT.testnet
```

#### Check Final Stats
```bash
near contract call-function as-read-only YOUR_ACCOUNT.testnet get_user \
  --args '{"accountId":"YOUR_ACCOUNT.testnet"}'
```

### 4. Additional Useful Commands

#### Check Account Balance
```bash
near account view-account-summary YOUR_ACCOUNT.testnet
```

#### View Transaction History
```bash
near transaction view-transaction-status --hash TRANSACTION_HASH
```

## Expected Results

| Action | Total Bet | Winnings |
|--------|-----------|----------|
| Initial | 0 NEAR | 0 NEAR |
| Bet 1 NEAR | 1 NEAR | 2 NEAR |
| Bet 0.5 NEAR | 1.5 NEAR | 3 NEAR |
| Withdraw | 1.5 NEAR | 0 NEAR |

## Network Configuration

The following testnet connections are available:
- `testnet` - Standard testnet
- `testnet-fastnear` - Fast testnet
- `testnet-lava` - Lava testnet

## Troubleshooting

### Common Issues:
1. **Account not found**: Make sure you created the account first
2. **Insufficient balance**: Get testnet tokens from faucet
3. **Contract not deployed**: Deploy the contract before testing
4. **Function not found**: Check function names are correct (case-sensitive)

### Getting Testnet Tokens:
```bash
# Visit the faucet URL from your network config
# For testnet: https://helper.nearprotocol.com/account
```

## Contract Functions Summary

| Function | Type | Description | Parameters |
|----------|------|-------------|------------|
| `bet` | Call (Payable) | Place a bet | None (deposit required) |
| `withdraw` | Call | Withdraw winnings | None |
| `get_user` | View | Get user stats | `{"accountId": "string"}` |

## Security Notes

- This is a test contract with simple doubling logic
- In production, implement proper game logic and security measures
- Always test on testnet before mainnet deployment
- Keep your private keys secure

---

**Happy Testing! 🚀**
