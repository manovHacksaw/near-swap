#!/bin/bash

# NEAR Contract Testing Script
# This script helps you test your betting contract using NEAR CLI

echo "🎲 NEAR Betting Contract Testing Script"
echo "======================================"

# Check if NEAR CLI is installed
if ! command -v near &> /dev/null; then
    echo "❌ NEAR CLI is not installed. Please install it first:"
    echo "   npm install -g near-cli"
    exit 1
fi

echo "✅ NEAR CLI is installed: $(near --version)"

# Set network to testnet
echo "🌐 Setting network to testnet..."
near network-config testnet

# Create a test account (you'll need to run this interactively)
echo ""
echo "📝 Step 1: Create a test account (run this command manually):"
echo "   near account create-account sponsor-by-faucet-service YOUR_ACCOUNT.testnet autogenerate-new-keypair"
echo ""

# Deploy the contract
echo "📦 Step 2: Deploy the contract (replace YOUR_ACCOUNT with your account):"
echo "   near deploy --wasmFile build/hello_near.wasm --accountId YOUR_ACCOUNT.testnet"
echo ""

# Test functions
echo "🎯 Step 3: Test the contract functions:"
echo ""
echo "   # Place a bet (1 NEAR)"
echo "   near call YOUR_ACCOUNT.testnet bet --deposit 1 --accountId YOUR_ACCOUNT.testnet"
echo ""
echo "   # Check user stats"
echo "   near view YOUR_ACCOUNT.testnet get_user '{\"accountId\":\"YOUR_ACCOUNT.testnet\"}'"
echo ""
echo "   # Place another bet (0.5 NEAR)"
echo "   near call YOUR_ACCOUNT.testnet bet --deposit 0.5 --accountId YOUR_ACCOUNT.testnet"
echo ""
echo "   # Check updated stats"
echo "   near view YOUR_ACCOUNT.testnet get_user '{\"accountId\":\"YOUR_ACCOUNT.testnet\"}'"
echo ""
echo "   # Withdraw winnings"
echo "   near call YOUR_ACCOUNT.testnet withdraw --accountId YOUR_ACCOUNT.testnet"
echo ""
echo "   # Check final stats (winnings should be 0)"
echo "   near view YOUR_ACCOUNT.testnet get_user '{\"accountId\":\"YOUR_ACCOUNT.testnet\"}'"
echo ""

echo "🔍 Additional useful commands:"
echo "   # Check account balance"
echo "   near account view-account-summary YOUR_ACCOUNT.testnet"
echo ""
echo "   # View contract state"
echo "   near view YOUR_ACCOUNT.testnet get_user '{\"accountId\":\"YOUR_ACCOUNT.testnet\"}'"
echo ""

echo "📋 Expected Results:"
echo "   - After betting 1 NEAR: totalBet = 1 NEAR, winnings = 2 NEAR"
echo "   - After betting 0.5 NEAR: totalBet = 1.5 NEAR, winnings = 3 NEAR"
echo "   - After withdrawal: totalBet = 1.5 NEAR, winnings = 0 NEAR"
echo ""

echo "✨ Happy testing! Remember to replace YOUR_ACCOUNT with your actual account ID."
