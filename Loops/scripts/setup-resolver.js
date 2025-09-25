const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up automated game resolver...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# NEAR Contract Configuration
CONTRACT_ID=game-v0.testnet
RESOLVER_ACCOUNT_ID=resolver-v0.testnet

# Resolver Private Key (for automated game resolution)
# Get this from: near keys list resolver-v0.testnet --networkId testnet
RESOLVER_PRIVATE_KEY=ed25519:YOUR_PRIVATE_KEY_HERE

# Optional: Custom RPC endpoint
# NEAR_RPC_URL=https://near-testnet.api.pagoda.co/rpc/v1
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Get your resolver private key:');
console.log('   near keys list resolver.game-program.testnet --networkId testnet');
console.log('\n2. Update the .env file with your private key:');
console.log('   RESOLVER_PRIVATE_KEY=ed25519:YOUR_ACTUAL_PRIVATE_KEY');
console.log('\n3. Run the resolver:');
console.log('   npm run resolver');
console.log('\n4. For continuous monitoring:');
console.log('   npm run resolver:watch');
console.log('\n🔐 Security Note:');
console.log('- Keep your private key secure and never commit it to version control');
console.log('- The resolver account should only be used for game resolution');
console.log('- Consider using a dedicated resolver account with limited permissions');
