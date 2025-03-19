// ESM test file
import { strictEqual } from 'node:assert';
import plugin from '../lib/index.js';

// Basic test to verify ESM import is working
const instance = plugin();
strictEqual(typeof instance, 'function', 'Plugin should export a function via ESM');

export function testEsmImport() {
  strictEqual(typeof plugin, 'function', 'Plugin should be a function when imported with ESM');
  return true;
}

// Return success message when run directly
if (import.meta.url === import.meta.main) {
  console.log('ESM import test passed!');
}