#!/usr/bin/env node

// Explicitly load .env file
import dotenv from 'dotenv';
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

// Check if token is already in environment
if (!process.env.GITHUB_TOKEN) {
  console.log('GITHUB_TOKEN not found in environment, loading from .env file...');

  // Load environment variables from .env file
  const result = dotenv.config();
  
  if (result.error) {
    console.log('Error loading .env file with dotenv, trying manual method...');
  } else {
    console.log('Loaded .env file with dotenv');
  }

  // If still not found, try to read directly from the .env file
  if (!process.env.GITHUB_TOKEN) {
    try {
      // Get absolute path to .env file
      const envPath = path.resolve(process.cwd(), '.env');
      console.log(`Looking for .env file at: ${envPath}`);
      
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        const match = envFile.match(/GITHUB_TOKEN=([^\s]+)/);
        if (match && match[1]) {
          process.env.GITHUB_TOKEN = match[1];
          console.log('Loaded GITHUB_TOKEN directly from .env file');
        } else {
          console.error('Error: Could not find GITHUB_TOKEN in .env file content');
          console.error('File content format should include: GITHUB_TOKEN=your_token');
          process.exit(1);
        }
      } else {
        console.error('Error: .env file not found at', envPath);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error reading .env file:', error.message);
      process.exit(1);
    }
  }
}

// Log success
console.log('GITHUB_TOKEN loaded successfully:', `${process.env.GITHUB_TOKEN.substring(0, 4)  }...`);

// Args for release-it
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Add GitHub token to release-it call directly via arguments
const releaseItArgs = dryRun ? ['.', '--dry-run'] : ['.'];

// Check token format and validity
const token = process.env.GITHUB_TOKEN;

// IMPORTANT: This is the critical check - if the token has spaces, linebreaks, or is malformed, fix it
let cleanToken = token.trim().replace(/[\r\n]+/g, '');
console.log('Checking for line breaks in token...');
if (token.includes('\n') || token.includes('\r')) {
  console.log('WARNING: Found linebreak in token - removing it (this was likely the issue!)');
}

// Remove any quotes if they were accidentally included
if ((cleanToken.startsWith('"') && cleanToken.endsWith('"')) || 
    (cleanToken.startsWith("'") && cleanToken.endsWith("'"))) {
  cleanToken = cleanToken.substring(1, cleanToken.length - 1);
  console.log('Warning: Removed quotes from token - this may have been the issue');
}

console.log('Token format check:');
console.log(`- Token length: ${cleanToken.length}`);
console.log(`- Token starts with: ${cleanToken.substring(0, 7)}...`);

if (cleanToken.length < 30) {
  console.error('ERROR: Token appears to be too short to be valid!');
  process.exit(1);
}

// Set the GitHub token back in the environment with the cleaned version
process.env.GITHUB_TOKEN = cleanToken;

// Pass arguments to release-it
releaseItArgs.push('--github.token', cleanToken);

// Log the command (but don't show the full token)
const safeArgs = [...releaseItArgs];
if (safeArgs.includes('--github.token')) {
  const tokenIndex = safeArgs.indexOf('--github.token') + 1;
  if (tokenIndex < safeArgs.length) {
    safeArgs[tokenIndex] = `${safeArgs[tokenIndex].substring(0, 7)}...`;
  }
}
console.log('Executing release-it with these args:', safeArgs);

// Try passing token without using environment variable
// This bypasses potential issues with release-it not reading the environment correctly
const resultEnv = { ...process.env };
delete resultEnv.GITHUB_TOKEN; // Remove from env since we're passing it explicitly via arg

console.log(`Environment check before spawning:
- GITHUB_TOKEN in process.env: ${!!process.env.GITHUB_TOKEN}
- GITHUB_TOKEN first few chars: ${process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.substring(0, 7) : 'not found'}
- Current directory: ${process.cwd()}
- release-it path: ${require.resolve('release-it')}`);

// Spawn release-it process
const result = spawnSync('./node_modules/.bin/release-it', releaseItArgs, { 
  stdio: 'inherit',
  env: resultEnv  // Pass environment without GITHUB_TOKEN since we're using --github.token
});

process.exit(result.status);
