#!/bin/bash

# Configuration
CONTRACT_ID="game-v0.testnet"
RESOLVER_ACCOUNT_ID="resolver-v0.testnet"
PRIVATE_KEY="ed25519:4EfkzL95mEn3Jqy7hmR4Q6kxCXnLeDzwvYWm5PJjVoHDX2jAEu1EP6R5Bbqcj8Vr2xft9hG5t8pdWZmTZVTn5sW"

echo "🚀 Game Resolver Script"
echo "📋 Contract: $CONTRACT_ID"
echo "🔑 Resolver: $RESOLVER_ACCOUNT_ID"

# Get pending games
echo "📊 Fetching pending games..."
PENDING_GAMES=$(near view $CONTRACT_ID get_pending_games --networkId testnet)

echo "📊 Pending games: $PENDING_GAMES"

# Get stored outcomes from the trigger server
echo "📋 Fetching stored game outcomes..."
OUTCOMES_JSON=$(curl -s http://localhost:3000/game-outcomes 2>/dev/null || echo '{"outcomes":[]}')
echo "📋 Stored outcomes: $OUTCOMES_JSON"

# Parse and resolve each game
echo "$PENDING_GAMES" | jq -r '.[]' | while read gameId; do
    if [ -n "$gameId" ]; then
        echo "🎮 Processing game: $gameId"
        
        # Get game details
        GAME_DETAILS=$(near view $CONTRACT_ID get_game_details "{\"gameId\": \"$gameId\"}" --networkId testnet)
        echo "📋 Game details: $GAME_DETAILS"
        
        # Look for stored outcome for this game
        STORED_OUTCOME=$(echo "$OUTCOMES_JSON" | jq -r ".outcomes[] | select(.gameId == \"$gameId\")" | head -1)
        
        if [ -n "$STORED_OUTCOME" ] && [ "$STORED_OUTCOME" != "null" ]; then
            # Use stored outcome
            DID_WIN=$(echo "$STORED_OUTCOME" | jq -r '.didWin')
            MULTIPLIER=$(echo "$STORED_OUTCOME" | jq -r '.multiplier')
            echo "📝 Using stored outcome: $DID_WIN with ${MULTIPLIER}x multiplier"
        else
            # Fallback to random resolution if no stored outcome
            echo "⚠️  No stored outcome found, using fallback resolution"
            DID_WIN="false"
            MULTIPLIER="1.0"
            echo "🎲 Fallback: Resolving as LOSE (1.0x)"
        fi
        
        # Resolve the game
        echo "📡 Resolving game $gameId..."
        near call $CONTRACT_ID resolve_game "{\"gameId\": \"$gameId\", \"didWin\": $DID_WIN, \"multiplier\": $MULTIPLIER}" --accountId $RESOLVER_ACCOUNT_ID --networkId testnet --private-key $PRIVATE_KEY
        
        echo "✅ Game $gameId resolved!"
        echo "---"
    fi
done

echo "🎉 All games processed!"
