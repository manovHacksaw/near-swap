const { connect, keyStores, utils } = require('near-api-js');
const fs = require('fs');
require('dotenv').config();

// Configuration
const NETWORK_ID = 'testnet';
const NODE_URL = 'https://near-testnet.api.pagoda.co/rpc/v1';
const CONTRACT_ID = process.env.CONTRACT_ID || 'game-v0.testnet';
const RESOLVER_ACCOUNT_ID = process.env.RESOLVER_ACCOUNT_ID || 'resolver-v0.testnet';
const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY;

if (!RESOLVER_PRIVATE_KEY) {
  console.error('❌ RESOLVER_PRIVATE_KEY not found in .env file');
  process.exit(1);
}

// Initialize NEAR connection
async function initNear() {
  const keyStore = new keyStores.InMemoryKeyStore();
  
  // Add the resolver's private key
  const keyPair = utils.KeyPair.fromString(RESOLVER_PRIVATE_KEY);
  await keyStore.setKey(NETWORK_ID, RESOLVER_ACCOUNT_ID, keyPair);

  const config = {
    networkId: NETWORK_ID,
    nodeUrl: NODE_URL,
    keyStore,
  };

  return await connect(config);
}

// Initialize the contract with resolver account
async function initializeContract() {
  console.log('🚀 Initializing contract with resolver account...');
  console.log(`📋 Contract: ${CONTRACT_ID}`);
  console.log(`🔑 Resolver: ${RESOLVER_ACCOUNT_ID}`);
  
  try {
    const near = await initNear();
    const account = await near.account(RESOLVER_ACCOUNT_ID);
    
    console.log('📡 Calling init method on contract...');
    
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'init',
      args: { resolverAccountId: RESOLVER_ACCOUNT_ID },
      gas: '300000000000000', // 300 TGas
    });
    
    console.log('✅ Contract initialized successfully!');
    console.log('📋 Transaction hash:', result.transaction.hash);
    console.log('🔗 View on Explorer:', `https://explorer.testnet.near.org/transactions/${result.transaction.hash}`);
    
    // Verify the initialization
    console.log('\n🔍 Verifying initialization...');
    const resolverAccount = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_resolver_account',
      args: {}
    });
    
    console.log('✅ Resolver account set to:', resolverAccount);
    
    if (resolverAccount === RESOLVER_ACCOUNT_ID) {
      console.log('🎉 Contract successfully initialized with resolver account!');
    } else {
      console.log('❌ Resolver account mismatch!');
    }
    
  } catch (error) {
    console.error('❌ Error initializing contract:', error);
    
    if (error.message?.includes('Contract method is not found')) {
      console.log('💡 The contract might already be initialized or the method name is incorrect.');
    } else if (error.message?.includes('insufficient balance')) {
      console.log('💡 Make sure the resolver account has enough NEAR for gas fees.');
    }
    
    process.exit(1);
  }
}

// Run the initialization
initializeContract();
