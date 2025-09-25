#!/bin/bash

# NEAR Betting Contract Demo Commands
# Copy and paste these commands one by one to test your contract

echo "🎲 NEAR Betting Contract Demo Commands"
echo "======================================"
echo ""
echo "Replace 'YOUR_ACCOUNT' with your actual testnet account ID"
echo ""

# Step 1: Create account (run this first)
echo "📝 Step 1: Create a test account"
echo "near account create-account sponsor-by-faucet-service tanjiroman.testnet autogenerate-new-keypair"
echo ""

# Step 2: Deploy contract
echo "📦 Step 2: Deploy the contract"
echo "near contract deploy --wasmFile build/hello_near.wasm --accountId tanjiroman.testnet"
echo ""

# Step 3: Test functions
echo "🎯 Step 3: Test the betting functions"
echo ""

echo "# Place first bet (1 NEAR)"
echo "near contract call-function as-transaction tanjiroman.testnet bet --args '{}' --deposit 1 --accountId tanjiroman.testnet"
echo ""

echo "# Check user stats after first bet"
echo "near contract call-function as-read-only tanjiroman.testnet get_user --args '{\"accountId\":\"tanjiroman.testnet\"}'"
echo ""

echo "# Place second bet (0.5 NEAR)"
echo "near contract call-function as-transaction tanjiroman.testnet bet --args '{}' --deposit 0.5 --accountId tanjiroman.testnet"
echo ""

echo "# Check user stats after second bet"
echo "near contract call-function as-read-only tanjiroman.testnet get_user --args '{\"accountId\":\"tanjiroman.testnet\"}'"
echo ""

echo "# Withdraw all winnings"
echo "near contract call-function as-transaction tanjiroman.testnet withdraw --args '{}' --accountId tanjiroman.testnet"
echo ""

echo "# Check final user stats"
echo "near contract call-function as-read-only tanjiroman.testnet get_user --args '{\"accountId\":\"tanjiroman.testnet\"}'"
echo ""

echo "🔍 Additional useful commands:"
echo ""

echo "# Check account balance"
echo "near account view-account-summary tanjiroman.testnet"
echo ""

echo "# Inspect contract functions"
echo "near contract inspect tanjiroman.testnet"
echo ""

echo "📋 Expected Results:"
echo "  After betting 1 NEAR:    totalBet = 1 NEAR,    winnings = 2 NEAR"
echo "  After betting 0.5 NEAR:  totalBet = 1.5 NEAR,  winnings = 3 NEAR"
echo "  After withdrawal:        totalBet = 1.5 NEAR,  winnings = 0 NEAR"
echo ""

echo "💡 Tips:"
echo "  - Make sure you have testnet NEAR tokens"
echo "  - Get tokens from: https://helper.nearprotocol.com/account"
echo "  - All amounts are in NEAR (not yoctoNEAR)"
echo "  - Function names are case-sensitive"
echo ""

echo "✨ Ready to test! Copy the commands above and replace YOUR_ACCOUNT with your account ID."
