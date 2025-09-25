#!/bin/bash

# Resolve Single Game Script
# This script resolves a single game with the outcome data passed from the frontend

# Load environment variables
source .env

CONTRACT_ID=${CONTRACT_ID:-"game-v0.testnet"}
RESOLVER_ACCOUNT_ID=${RESOLVER_ACCOUNT_ID:-"resolver-v0.testnet"}
RESOLVER_PRIVATE_KEY=${RESOLVER_PRIVATE_KEY}
NETWORK_CONFIG="testnet"

# Get parameters from command line
GAME_ID=$1
DID_WIN=$2
MULTIPLIER=$3

echo "🚀 Resolving Single Game"
echo "📋 Contract: ${CONTRACT_ID}"
echo "🔑 Resolver: ${RESOLVER_ACCOUNT_ID}"
echo "🎮 Game ID: ${GAME_ID}"
echo "📊 Outcome: ${DID_WIN} with ${MULTIPLIER}x multiplier"

if [ -z "${RESOLVER_PRIVATE_KEY}" ]; then
  echo "❌ RESOLVER_PRIVATE_KEY not found in .env file"
  exit 1
fi

if [ -z "${GAME_ID}" ] || [ -z "${DID_WIN}" ] || [ -z "${MULTIPLIER}" ]; then
  echo "❌ Missing required parameters: gameId, didWin, multiplier"
  echo "Usage: $0 <gameId> <didWin> <multiplier>"
  exit 1
fi

# Get game details first to verify it exists
echo "🔍 Fetching game details..."
GAME_DETAILS=$(near view ${CONTRACT_ID} get_game_details "{\"gameId\": \"${GAME_ID}\"}" --networkId ${NETWORK_CONFIG} 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "❌ Failed to fetch game details for ${GAME_ID}"
  exit 1
fi

echo "📋 Game details: ${GAME_DETAILS}"

# Resolve the game
echo "📡 Resolving game ${GAME_ID}..."
RESOLVE_RESULT=$(near call ${CONTRACT_ID} resolve_game "{\"gameId\": \"${GAME_ID}\", \"didWin\": ${DID_WIN}, \"multiplier\": ${MULTIPLIER}}" --accountId ${RESOLVER_ACCOUNT_ID} --networkId ${NETWORK_CONFIG} --private-key ${RESOLVER_PRIVATE_KEY} 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Game ${GAME_ID} resolved successfully!"
  echo "📋 Result: ${RESOLVE_RESULT}"
  exit 0
else
  echo "❌ Failed to resolve game ${GAME_ID}"
  echo "📋 Error: ${RESOLVE_RESULT}"
  exit 1
fi
