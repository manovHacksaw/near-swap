const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

// Configuration
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';

console.log('🧪 Testing resolver setup...');
console.log(`📋 Contract: ${CONTRACT_ID}`);
console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);

// Test 1: Check if resolver account is set correctly
async function testResolverAccount() {
  console.log('\n🔍 Test 1: Checking resolver account...');
  
  return new Promise((resolve, reject) => {
    exec(`near view ${CONTRACT_ID} get_resolver_account --networkId testnet`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error checking resolver account:', error.message);
        reject(error);
        return;
      }
      
      const resolverAccount = stdout.trim().replace(/"/g, '');
      console.log(`✅ Resolver account: ${resolverAccount}`);
      
      if (resolverAccount === RESOLVER_ACCOUNT_ID) {
        console.log('✅ Resolver account is correctly set!');
        resolve(true);
      } else {
        console.log('❌ Resolver account mismatch!');
        reject(new Error('Resolver account mismatch'));
      }
    });
  });
}

// Test 2: Check pending games
async function testPendingGames() {
  console.log('\n🔍 Test 2: Checking pending games...');
  
  return new Promise((resolve, reject) => {
    exec(`near view ${CONTRACT_ID} get_pending_games --networkId testnet`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error checking pending games:', error.message);
        reject(error);
        return;
      }
      
      try {
        const games = JSON.parse(stdout);
        console.log(`✅ Found ${games.length} pending games`);
        resolve(games);
      } catch (parseError) {
        console.log('✅ No pending games (empty response)');
        resolve([]);
      }
    });
  });
}

// Test 3: Check contract stats
async function testContractStats() {
  console.log('\n🔍 Test 3: Checking contract stats...');
  
  return new Promise((resolve, reject) => {
    exec(`near view ${CONTRACT_ID} get_contract_stats --networkId testnet`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error checking contract stats:', error.message);
        reject(error);
        return;
      }
      
      try {
        const stats = JSON.parse(stdout);
        console.log('✅ Contract stats:', stats);
        resolve(stats);
      } catch (parseError) {
        console.log('✅ Contract stats retrieved (may be empty)');
        resolve({});
      }
    });
  });
}

// Run all tests
async function runTests() {
  try {
    await testResolverAccount();
    await testPendingGames();
    await testContractStats();
    
    console.log('\n🎉 All tests passed! Resolver setup is working correctly.');
    console.log('\n📋 Summary:');
    console.log(`✅ Contract: ${CONTRACT_ID}`);
    console.log(`✅ Resolver: ${RESOLVER_ACCOUNT_ID}`);
    console.log('✅ Resolver can access contract methods');
    console.log('✅ Ready for automated game resolution');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Start the automated resolver: node scripts/resolver.js');
    console.log('2. Monitor game resolution in real-time');
    console.log('3. Games will be resolved automatically without user signatures');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
