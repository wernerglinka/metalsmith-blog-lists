// Minimal CommonJS test file - just verifies the CJS module works
const assert = require('node:assert').strict;
const metalsmith = require('metalsmith');

// Import the plugin using the CommonJS format
const plugin = require('../lib/index.cjs');

describe('metalsmith-blog-lists (CommonJS)', () => {
  // Verify the module loads correctly and exports a function
  it('should be properly importable as a CommonJS module', () => {
    assert.strictEqual(typeof plugin, 'function', 'Plugin should be a function when required with CommonJS');
    assert.strictEqual(typeof plugin(), 'function', 'Plugin should return a function when called');
  });
  
  // Test that the plugin actually works with minimal functionality
  it('should create expected metadata collections when used', () => {
    const instance = plugin();
    
    // Create a simple test with mock files and metadata
    const files = {
      'blog/test1.md': { 
        title: 'Test Post 1', 
        date: '2023-01-01', 
        featuredBlogpost: true,
        featuredBlogpostOrder: 1
      },
      'blog/test2.md': { 
        title: 'Test Post 2', 
        date: '2023-02-01'
      }
    };
    
    const metadata = {};
    const metalsmithMock = {
      metadata: function() { return metadata; }
    };
    
    // Run the plugin
    instance(files, metalsmithMock, () => {});
    
    // Verify the plugin created the expected metadata collections
    assert.strictEqual(Array.isArray(metadata.latestBlogPosts), true, 'Should create latestBlogPosts array');
    assert.strictEqual(Array.isArray(metadata.featuredBlogPosts), true, 'Should create featuredBlogPosts array');
    assert.strictEqual(Array.isArray(metadata.allSortedBlogPosts), true, 'Should create allSortedBlogPosts array');
    assert.strictEqual(Array.isArray(metadata.annualizedBlogPosts), true, 'Should create annualizedBlogPosts array');
    
    // Verify content is processed correctly
    assert.strictEqual(metadata.allSortedBlogPosts.length, 2, 'Should have 2 posts in allSortedBlogPosts');
    assert.strictEqual(metadata.featuredBlogPosts.length, 1, 'Should have 1 post in featuredBlogPosts');
  });
});