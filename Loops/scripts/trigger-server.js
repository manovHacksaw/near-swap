#!/usr/bin/env node

/**
 * Trigger Server
 * 
 * A simple HTTP server that receives game outcome triggers from the frontend
 * and automatically runs the resolver script to process the game.
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.TRIGGER_SERVER_PORT || 3001;

// Middleware
app.use(express.json());

// CORS middleware for frontend requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Resolve game endpoint - accepts game outcome data directly
app.post('/resolve-game', async (req, res) => {
  try {
    const { gameId, didWin, multiplier, gameType, player } = req.body;
    
    if (!gameId || didWin === undefined || !multiplier) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: gameId, didWin, multiplier' 
      });
    }
    
    console.log(`🚀 Resolving game: ${gameId}`);
    console.log(`📋 Outcome: ${didWin ? 'WIN' : 'LOSE'} with ${multiplier}x multiplier`);
    console.log(`📋 Game type: ${gameType}, Player: ${player}`);
    
    // Run the resolver script with the game data
    const resolverPath = path.join(__dirname, 'resolve-single-game.sh');
    
    console.log(`📡 Executing resolver script: ${resolverPath}`);
    
    const resolverProcess = spawn('bash', [resolverPath, gameId, didWin, multiplier], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    resolverProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Game ${gameId} resolved successfully!`);
        res.json({ 
          success: true, 
          message: `Game ${gameId} resolved successfully`,
          gameId,
          didWin,
          multiplier,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error(`❌ Failed to resolve game ${gameId} with code: ${code}`);
        res.status(500).json({ 
          success: false, 
          message: `Failed to resolve game ${gameId}`,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    resolverProcess.on('error', (error) => {
      console.error(`❌ Failed to start resolver: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: `Failed to start resolver: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('❌ Error resolving game:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get pending games endpoint (for debugging)
app.get('/pending-games', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
    const NETWORK_CONFIG = 'testnet';
    
    exec(`near contract call-function as-read-only ${CONTRACT_ID} get_pending_games json-args '{}' network-config ${NETWORK_CONFIG}`, 
      (error, stdout, stderr) => {
        if (error) {
          console.error('Error fetching pending games:', error);
          res.status(500).json({ error: error.message });
          return;
        }
        
        try {
          const pendingGames = JSON.parse(stdout.trim());
          res.json({ 
            pendingGames,
            count: pendingGames.length,
            timestamp: new Date().toISOString()
          });
        } catch (parseError) {
          res.status(500).json({ error: 'Failed to parse pending games response' });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trigger server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Resolve game: http://localhost:${PORT}/resolve-game`);
  console.log(`📊 Pending games: http://localhost:${PORT}/pending-games`);
  console.log('');
  console.log('💡 To resolve a game from frontend:');
  console.log(`   POST http://localhost:${PORT}/resolve-game`);
  console.log('   Body: { "gameId": "game-123", "didWin": true, "multiplier": 2.5, "gameType": "mines", "player": "user.testnet" }');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down trigger server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down trigger server...');
  process.exit(0);
});
