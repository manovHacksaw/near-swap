#!/bin/bash

# Start Resolver System
# This script starts the trigger server and sets up the resolver system

echo "🚀 Starting Resolver System..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run: node scripts/setup-env.js"
    exit 1
fi

# Load environment variables
source .env

echo "📋 Configuration:"
echo "   Contract: ${CONTRACT_ID}"
echo "   Resolver: ${RESOLVER_ACCOUNT_ID}"
echo "   RPC URL: ${NEAR_RPC_URL}"
echo ""

# Check if resolver account has balance
echo "🔍 Checking resolver account balance..."
BALANCE=$(near account view-account-summary ${RESOLVER_ACCOUNT_ID} --network-config testnet 2>/dev/null | grep "Balance" | awk '{print $2}' || echo "0 NEAR")
echo "   Resolver balance: ${BALANCE}"

if [[ "$BALANCE" == "0 NEAR" ]]; then
    echo "⚠️  Warning: Resolver account has no balance!"
    echo "   Please fund the resolver account with some NEAR for gas fees."
    echo "   You can do this by sending NEAR to: ${RESOLVER_ACCOUNT_ID}"
    echo ""
fi

# Start the trigger server
echo "🌐 Starting trigger server..."
echo "   Server will run on: http://localhost:3001"
echo "   Health check: http://localhost:3001/health"
echo "   Trigger endpoint: http://localhost:3001/resolve-game"
echo ""

# Start trigger server in background
node scripts/trigger-server.js &
TRIGGER_SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server started successfully
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Trigger server started successfully!"
    echo "   PID: ${TRIGGER_SERVER_PID}"
else
    echo "❌ Failed to start trigger server"
    kill $TRIGGER_SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎯 Resolver system is ready!"
echo ""
echo "📝 How it works:"
echo "   1. User plays a game in the frontend"
echo "   2. When game ends, frontend sends outcome data directly to resolver"
echo "   3. Trigger server receives the data and runs resolve-single-game.sh"
echo "   4. Resolver script resolves the game with the provided outcome data"
echo ""
echo "🔧 To test the system:"
echo "   curl -X POST http://localhost:3001/resolve-game \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"gameId\":\"test-123\",\"didWin\":true,\"multiplier\":2.5,\"gameType\":\"mines\",\"player\":\"user.testnet\"}'"
echo ""
echo "🛑 To stop the system:"
echo "   kill ${TRIGGER_SERVER_PID}"
echo ""

# Keep script running and show server logs
echo "📊 Server logs (Ctrl+C to stop):"
echo "----------------------------------------"
wait $TRIGGER_SERVER_PID
