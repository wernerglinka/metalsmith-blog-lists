#!/usr/bin/env node

// Test direct GitHub API authentication
import dotenv from 'dotenv';
import https from 'https';

// Load environment variables from .env file
dotenv.config();

console.log('Testing GitHub token authentication...');

// Get token from environment or prompt
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('No GITHUB_TOKEN found in environment');
  process.exit(1);
}

console.log(`Token starts with: ${token.substring(0, 8)}...`);
console.log(`Token length: ${token.length}`);

// Format validation
if (!token.match(/^ghp_[a-zA-Z0-9]{36}$/)) {
  console.warn('Token format warning: Token does not match expected format (should be ghp_XXXXXXXXXX...)');
}

// Test the token with a simple API request
const options = {
  hostname: 'api.github.com',
  path: '/user',
  method: 'GET',
  headers: {
    'User-Agent': 'GitHub-Token-Test',
    'Authorization': `token ${token}`
  }
};

const req = https.request(options, (res) => {
  console.log(`Status code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Authentication successful!');
        console.log(`Authenticated as: ${parsed.login}`);
      } else {
        console.error('❌ Authentication failed!');
        console.error('Error message:', parsed.message);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();