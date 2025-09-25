# 🎯 Step-by-Step Commands for tanjiroman.testnet

## Prerequisites
- Make sure you have testnet NEAR tokens
- Get tokens from: https://helper.nearprotocol.com/account

## Step 1: Create Account (if needed)
```bash
near account create-account sponsor-by-faucet-service tanjiroman.testnet autogenerate-new-keypair
```

## Step 2: Deploy Contract
```bash
near contract deploy --wasmFile build/hello_near.wasm --accountId tanjiroman.testnet
```

## Step 3: Test Betting Functions

### Place First Bet (1 NEAR)
```bash
near contract call-function as-transaction tanjiroman.testnet bet --args '{}' --deposit 1 --accountId tanjiroman.testnet
```

### Check User Stats After First Bet
```bash
near contract call-function as-read-only tanjiroman.testnet get_user --args '{"accountId":"tanjiroman.testnet"}'
```
**Expected Result:** `totalBet: "1000000000000000000000000", winnings: "2000000000000000000000000"`

### Place Second Bet (0.5 NEAR)
```bash
near contract call-function as-transaction tanjiroman.testnet bet --args '{}' --deposit 0.5 --accountId tanjiroman.testnet
```

### Check User Stats After Second Bet
```bash
near contract call-function as-read-only tanjiroman.testnet get_user --args '{"accountId":"tanjiroman.testnet"}'
```
**Expected Result:** `totalBet: "1500000000000000000000000", winnings: "3000000000000000000000000"`

### Withdraw All Winnings
```bash
near contract call-function as-transaction tanjiroman.testnet withdraw --args '{}' --accountId tanjiroman.testnet
```

### Check Final User Stats
```bash
near contract call-function as-read-only tanjiroman.testnet get_user --args '{"accountId":"tanjiroman.testnet"}'
```
**Expected Result:** `totalBet: "1500000000000000000000000", winnings: "0"`

## Additional Commands

### Check Account Balance
```bash
near account view-account-summary tanjiroman.testnet
```

### Inspect Contract Functions
```bash
near contract inspect tanjiroman.testnet
```

## Notes
- All amounts are in yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
- The contract doubles your bet as winnings
- Withdrawing resets winnings to 0 but keeps totalBet history
- Function names are case-sensitive

## Troubleshooting
- If account doesn't exist: Create it first with Step 1
- If insufficient balance: Get testnet tokens from faucet
- If contract not deployed: Run Step 2 first
- If function fails: Check function name spelling
