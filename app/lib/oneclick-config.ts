import { OpenAPI } from '@defuse-protocol/one-click-sdk-typescript';

// Configure 1Click API
export function configureOneClickAPI() {
  // Set the base URL
  OpenAPI.BASE = process.env.ONECLICK_API_BASE || 'https://1click.chaindefuser.com';
  
  // Set the JWT token - you need to get this from:
  // https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform
  const token = process.env.ONECLICK_API_TOKEN;
  
  if (!token || token === 'your-jwt-token-here') {
    console.warn('⚠️  ONECLICK_API_TOKEN not configured. Please set your JWT token in environment variables.');
    console.warn('   Get your token from: https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform');
    console.warn('   Current token value:', token ? 'Set but invalid' : 'Not set');
    return false;
  }
  
  OpenAPI.TOKEN = token;
  console.log('✅ 1Click API configured successfully');
  return true;
}

// Initialize the API configuration
configureOneClickAPI();
