// Tests for dual module support
import assert from 'node:assert';
import { testEsmImport } from './esm-import.mjs';

// Use dynamic import to load the CommonJS file
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

describe('Dual module support', () => {
  it('should be importable as an ES module', () => {
    assert.strictEqual(testEsmImport(), true, 'ESM import should work');
  });
  
  it('should be importable as a CommonJS module', async () => {
    const cjsTest = require('./cjs-test/cjs-import.cjs');
    assert.strictEqual(cjsTest.testCjsImport(), true, 'CommonJS import should work');
  });
});