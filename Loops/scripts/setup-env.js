const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');

const envContent = `# NEAR Contract Configuration
CONTRACT_ID=game-v0.testnet
RESOLVER_ACCOUNT_ID=resolver-v0.testnet

# Resolver Private Key (for automated game resolution)
RESOLVER_PRIVATE_KEY="ed25519:4EfkzL95mEn3Jqy7hmR4Q6kxCXnLeDzwvYWm5PJjVoHDX2jAEu1EP6R5Bbqcj8Vr2xft9hG5t8pdWZmTZVTn5sW"

# Optional: Custom RPC endpoint
NEAR_RPC_URL=https://near-testnet.api.pagoda.co/rpc/v1
DEBUG=true
`;

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
} else {
  console.log('📝 Updating .env file...');
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated');
}

console.log('\n📋 Configuration:');
console.log(`Contract ID: game-v0.testnet`);
console.log(`Resolver Account: resolver-v0.testnet`);
console.log(`RPC Endpoint: https://near-testnet.api.pagoda.co/rpc/v1`);

console.log('\n🚀 Next steps:');
console.log('1. Run: node scripts/initialize-contract.js');
console.log('2. Test resolver: node scripts/simple-resolver.js');
console.log('3. Start automated resolver: node scripts/resolver.js');
