// CommonJS test file
'use strict';

const assert = require('assert');
const plugin = require('../../lib/index.cjs');

// Basic test to verify CommonJS import is working
const instance = plugin();
assert.strictEqual(typeof instance, 'function', 'Plugin should export a function via CommonJS');

// Return success message when run directly
if (require.main === module) {
  console.log('CommonJS import test passed!');
}

module.exports = {
  testCjsImport: () => {
    assert.strictEqual(typeof plugin, 'function', 'Plugin should be a function when imported with CommonJS');
    return true;
  }
};