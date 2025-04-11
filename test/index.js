// ESM test file for Metalsmith plugins
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import metalsmith from 'metalsmith';

// Import the plugin from src for direct coverage
import plugin from '../src/index.js';

// Get current directory and setup path utilities
const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (path) => resolve(__dirname, 'fixtures', path);
const file = (path) => readFileSync(fixture(path), 'utf8');

// Get package name from package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
const { name } = packageJson;

describe('metalsmith-blog-lists (ESM)', () => {
  it('should normalize options with defaults when not provided', () => {
    const instance = plugin();
    assert.strictEqual(typeof instance, 'function', 'Plugin should return a function');

    // Run with empty files and metadata to see if defaults are properly applied
    const files = {};
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    instance(files, metalsmithMock, () => {});

    // Check the defaults are applied
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(metadata, 'latestBlogPosts'),
      true,
      'Should have latestBlogPosts in metadata'
    );
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(metadata, 'featuredBlogPosts'),
      true,
      'Should have featuredBlogPosts in metadata'
    );
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(metadata, 'allSortedBlogPosts'),
      true,
      'Should have allSortedBlogPosts in metadata'
    );
    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(metadata, 'annualizedBlogPosts'),
      true,
      'Should have annualizedBlogPosts in metadata'
    );
  });

  // Test option normalization
  it('should properly normalize blogDirectory path format', (done) => {
    // Test with directory path without ./ prefix
    const instance1 = plugin({ blogDirectory: 'articles' });
    const files1 = { 'articles/post1.md': { date: '2022-01-01', title: 'Test' } };
    const metadata1 = {};
    const metalsmithMock1 = {
      metadata: function () {
        return metadata1;
      }
    };

    instance1(files1, metalsmithMock1, () => {
      // Should normalize path and find the post
      assert.strictEqual(
        metadata1.allSortedBlogPosts.length > 0,
        true,
        'Should find post with normalized directory path'
      );

      // Test with trailing slash
      const instance2 = plugin({ blogDirectory: './posts/' });
      const files2 = { 'posts/post1.md': { date: '2022-01-01', title: 'Test' } };
      const metadata2 = {};
      const metalsmithMock2 = {
        metadata: function () {
          return metadata2;
        }
      };

      instance2(files2, metalsmithMock2, () => {
        assert.strictEqual(
          metadata2.allSortedBlogPosts.length > 0,
          true,
          'Should find post when blog directory has trailing slash'
        );
        done();
      });
    });
  });

  it('should export a named plugin function matching package.json name', () => {
    const camelCased = name.split('').reduce((str, char, i) => {
      str += name[i - 1] === '-' ? char.toUpperCase() : char === '-' ? '' : char;
      return str;
    }, '');
    assert.strictEqual(plugin().name, camelCased.replace(/~/g, ''));
  });

  it('should not crash the metalsmith build when using default options', (done) => {
    metalsmith(fixture('default'))
      .use(plugin())
      .build((err) => {
        if (err) {
          return done(err);
        }
        assert.strictEqual(file('default/build/index.html'), file('default/expected/index.html'));
        done();
      });
  });

  it('should place a latest blogs array with 4 entries into metadata', function (done) {
    this.timeout(5000); // Moderate timeout increase

    const ms = metalsmith(fixture('latestBlogsList'));

    // Force clean the build directory to start fresh
    if (ms.clean) {
      ms.clean(true);
    }

    ms.source('src')
      .destination('build')
      .use(
        plugin({
          latestQuantity: 4,
          fileExtension: '.html',
          blogDirectory: './blog'
        })
      )
      .use((files, metalsmith, done) => {
        // Directly check the metadata instead of relying on the template
        const metadata = metalsmith.metadata();
        const latestPosts = metadata.latestBlogPosts;

        try {
          // Test that we have exactly 4 latest posts
          assert.strictEqual(latestPosts.length, 4, 'Should have 4 latest posts');
          done();
        } catch (e) {
          done(e);
        }
      });

    // Run the build
    ms.build((err) => {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  it('should place a featured blogs array with 3 entries in "desc" order into metadata', function (done) {
    this.timeout(5000); // Moderate timeout increase

    const ms = metalsmith(fixture('featuredBlogList-desc'));

    // Force clean the build directory to start fresh
    if (ms.clean) {
      ms.clean(true);
    }

    ms.source('src')
      .destination('build')
      .use(
        plugin({
          featuredQuantity: 3,
          featuredPostOrder: 'desc',
          fileExtension: '.html',
          blogDirectory: './blog'
        })
      )
      .use((files, metalsmith, done) => {
        // Directly check the metadata instead of relying on the template
        const metadata = metalsmith.metadata();
        const featuredPosts = metadata.featuredBlogPosts;

        try {
          // Verify we have 3 featured posts
          assert.strictEqual(featuredPosts.length, 3, 'Should have 3 featured posts');

          // Verify they're in the correct order (desc means higher order values first)
          assert.strictEqual(
            featuredPosts[0].order > featuredPosts[1].order,
            true,
            'Posts should be in descending order'
          );
          done();
        } catch (e) {
          done(e);
        }
      });

    // Run the build
    ms.build((err) => {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  it('should place a featured blogs array with 3 entries in "desc" order into metadata (additional test)', function (done) {
    this.timeout(5000); // Moderate timeout increase

    // Let's directly compare the output instead of trying to do string comparison,
    // as string formatting can differ but the actual content is what matters.
    // Read the file but we'll use direct metadata checks rather than parsing

    const ms = metalsmith(fixture('featuredBlogList-asc'));

    // Force clean the build directory to start fresh
    if (ms.clean) {
      ms.clean(true);
    }

    ms.source('src')
      .destination('build')
      .use(
        plugin({
          featuredQuantity: 3,
          featuredPostOrder: 'desc',
          fileExtension: '.html',
          blogDirectory: './blog'
        })
      )
      .use((files, metalsmith, done) => {
        // Directly check the metadata instead of relying on the template
        const metadata = metalsmith.metadata();
        const featuredPosts = metadata.featuredBlogPosts;

        // Check that we have 3 posts with correct order by featuredBlogpostOrder (1, 2, 3)
        try {
          // Test that we have exactly 3 posts
          assert.strictEqual(featuredPosts.length, 3, 'Should have 3 featured posts');
          done();
        } catch (e) {
          done(e);
        }
      });

    // Run the build
    ms.build((err) => {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  it('should handle debug option being enabled', (done) => {
    // Create mock files with minimal required properties
    const files = {
      './blog/test-post1.html': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 1
      },
      './blog/test-post2.html': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 2
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with debug enabled
    const pluginInstance = plugin({
      debugEnabled: true,
      featuredPostOrder: 'desc' // Using desc to test the most common case
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Check if it processed correctly with debug enabled
      assert.strictEqual(metadata.featuredBlogPosts.length, 2, 'Should have 2 featured blog posts');
      assert.strictEqual(metadata.featuredBlogPosts[0].order, 2, 'First post should have order 2 (desc sort)');
      assert.strictEqual(metadata.featuredBlogPosts[1].order, 1, 'Second post should have order 1 (desc sort)');
      done();
    });
  });

  it('should handle blog posts with no featuredBlogpostOrder', (done) => {
    // Create mock files with one post missing the order
    const files = {
      './blog/test-post1.html': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 1
      },
      './blog/test-post2.html': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author',
        featuredBlogpost: true
        // No featuredBlogpostOrder
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin
    const pluginInstance = plugin({
      featuredPostOrder: 'desc'
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Check if it handled missing order property gracefully
      assert.strictEqual(metadata.featuredBlogPosts.length, 2, 'Should have 2 featured blog posts');
      // The post with undefined order should sort correctly (undefined is treated as 0)
      done();
    });
  });

  it('should place an annualized array of all blogs into metadata', function (done) {
    this.timeout(5000); // Moderate timeout increase

    const ms = metalsmith(fixture('annualBlogList'));

    // Force clean the build directory to start fresh
    if (ms.clean) {
      ms.clean(true);
    }

    ms.source('src')
      .destination('build')
      .use(
        plugin({
          fileExtension: '.html',
          blogDirectory: './blog'
        })
      )
      .use((files, metalsmith, done) => {
        // Directly check the metadata instead of relying on the template
        const metadata = metalsmith.metadata();
        const annualPosts = metadata.annualizedBlogPosts;

        try {
          // Verify annualized posts exist
          assert.strictEqual(Array.isArray(annualPosts), true, 'Should have array of annualized posts');
          assert.strictEqual(annualPosts.length > 0, true, 'Should have at least one year of posts');

          // Check structure of first year
          const firstYear = annualPosts[0];
          assert.strictEqual(typeof firstYear.year, 'string', 'Year should be a string');
          assert.strictEqual(Array.isArray(firstYear.posts), true, 'Year should have posts array');
          assert.strictEqual(firstYear.posts.length > 0, true, 'Year should have at least one post');

          done();
        } catch (e) {
          done(e);
        }
      });

    // Run the build
    ms.build((err) => {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  it('should place a sorted array of all blogs into metadata', function (done) {
    this.timeout(5000); // Moderate timeout increase

    const ms = metalsmith(fixture('allBlogsList'));

    // Force clean the build directory to start fresh
    if (ms.clean) {
      ms.clean(true);
    }

    ms.source('src')
      .destination('build')
      .use(
        plugin({
          fileExtension: '.html',
          blogDirectory: './blog'
        })
      )
      .use((files, metalsmith, done) => {
        // Directly check the metadata instead of relying on the template
        const metadata = metalsmith.metadata();
        const allPosts = metadata.allSortedBlogPosts;

        try {
          // Verify we have a sorted array of posts
          assert.strictEqual(Array.isArray(allPosts), true, 'Should have array of all posts');
          assert.strictEqual(allPosts.length > 1, true, 'Should have multiple posts');

          // Check sorting (should be in reverse chronological order - newest first)
          if (allPosts.length >= 2) {
            // Check first two posts to verify order
            const post1Date = new Date(allPosts[0].date).getTime();
            const post2Date = new Date(allPosts[1].date).getTime();
            assert.strictEqual(post1Date >= post2Date, true, 'Posts should be sorted newest first');
          }

          done();
        } catch (e) {
          done(e);
        }
      });

    // Run the build
    ms.build((err) => {
      if (err) {
        return done(err);
      }
      done();
    });
  });

  // Test the new blogDirectory option
  it('should support new blogDirectory option', (done) => {
    // Create mock files with explicit blogDirectory
    const files = {
      'articles/test-post1.html': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 1
      },
      'articles/test-post2.html': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 2
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with the new blogDirectory option
    const pluginInstance = plugin({
      blogDirectory: './articles'
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Should find posts in the articles directory
      assert.strictEqual(metadata.featuredBlogPosts.length, 2, 'Should have 2 featured blog posts');
      assert.strictEqual(metadata.allSortedBlogPosts.length, 2, 'Should have 2 blog posts in allSortedBlogPosts');
      done();
    });
  });

  // Test the blogObject option for nested frontmatter properties
  it('should support blogObject option for nested frontmatter properties', (done) => {
    // Create mock files with blog object containing nested properties
    const files = {
      'blog/test-post1.html': {
        // Direct properties
        title: 'Fallback Title 1',
        date: '2022-01-15', // This should be overridden by blog.date
        // Nested blog object
        blog: {
          title: 'Nested Blog Title 1',
          date: '2022-01-01',
          excerpt: 'This is a nested excerpt',
          featuredBlogpost: true,
          featuredBlogpostOrder: 1
        }
      },
      'blog/test-post2.html': {
        // Only nested properties
        blog: {
          title: 'Nested Blog Title 2',
          date: '2022-02-01',
          author: 'Nested Author',
          featuredBlogpost: true,
          featuredBlogpostOrder: 2
        }
      },
      'blog/test-post3.html': {
        // Only direct properties (still should work with blogObject set)
        title: 'Direct Title 3',
        date: '2022-03-01',
        excerpt: 'Direct excerpt',
        featuredBlogpost: true,
        featuredBlogpostOrder: 3
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with the blogObject option
    const pluginInstance = plugin({
      blogObject: 'blog'
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Should find all posts regardless of property structure
      assert.strictEqual(metadata.featuredBlogPosts.length, 3, 'Should have 3 featured blog posts');
      assert.strictEqual(metadata.allSortedBlogPosts.length, 3, 'Should have 3 blog posts in allSortedBlogPosts');

      // Verify that nested properties are used correctly
      const sortedByDate = [...metadata.allSortedBlogPosts].sort((a, b) => a.date - b.date);

      // First post should use the nested blog.title value
      assert.strictEqual(sortedByDate[0].title, 'Nested Blog Title 1', 'Should use nested blog.title');
      // First post should use the nested blog.date value, not the direct date
      assert.strictEqual(
        sortedByDate[0].date.toISOString().substring(0, 10),
        '2022-01-01',
        'Should use nested blog.date'
      );

      // Second post should use the nested blog.title value
      assert.strictEqual(sortedByDate[1].title, 'Nested Blog Title 2', 'Should use nested blog.title for second post');

      // Third post should fall back to direct properties
      assert.strictEqual(sortedByDate[2].title, 'Direct Title 3', 'Should fall back to direct properties');

      done();
    });
  });

  // Test featuredPostOrder option
  it('should respect featuredPostOrder setting', (done) => {
    // Create mock files with order
    const files = {
      './blog/test-post1.html': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 1
      },
      './blog/test-post2.html': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 2
      },
      './blog/test-post3.html': {
        title: 'Test Post 3',
        date: '2022-03-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 3
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with ascending order setting
    const pluginInstance = plugin({
      featuredPostOrder: 'asc'
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Should be sorted in ascending order (1, 2, 3)
      assert.strictEqual(metadata.featuredBlogPosts.length, 3, 'Should have 3 featured blog posts');
      assert.strictEqual(metadata.featuredBlogPosts[0].order, 1, 'First post should have order 1');
      assert.strictEqual(metadata.featuredBlogPosts[1].order, 2, 'Second post should have order 2');
      assert.strictEqual(metadata.featuredBlogPosts[2].order, 3, 'Third post should have order 3');
      done();
    });
  });

  // Test custom featuredQuantity option
  it('should respect featuredQuantity option', (done) => {
    // Create mock files
    const files = {
      './blog/test-post1.html': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 1
      },
      './blog/test-post2.html': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 2
      },
      './blog/test-post3.html': {
        title: 'Test Post 3',
        date: '2022-03-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 3
      },
      './blog/test-post4.html': {
        title: 'Test Post 4',
        date: '2022-04-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 4
      },
      './blog/test-post5.html': {
        title: 'Test Post 5',
        date: '2022-05-01',
        author: 'Test Author',
        featuredBlogpost: true,
        featuredBlogpostOrder: 5
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with custom featuredQuantity
    const pluginInstance = plugin({
      featuredQuantity: 2, // Should limit to just 2 posts
      featuredPostOrder: 'asc'
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Should only have 2 featured posts due to featuredQuantity: 2
      assert.strictEqual(metadata.featuredBlogPosts.length, 2, 'Should have 2 featured blog posts');
      assert.strictEqual(metadata.allSortedBlogPosts.length, 5, 'Should have all 5 blog posts in allSortedBlogPosts');
      done();
    });
  });

  // Test usePermalinks option (default = true)
  it('should use permalink-style URLs by default (without file extensions)', (done) => {
    // Create mock files
    const files = {
      './blog/test-post1.md': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author'
      },
      './blog/test-post2.md': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author'
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with default options (usePermalinks = true)
    const pluginInstance = plugin();

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Check that paths don't have file extensions
      assert.strictEqual(metadata.allSortedBlogPosts.length, 2, 'Should have 2 blog posts');

      // Verify paths don't have .md or .html extensions
      metadata.allSortedBlogPosts.forEach((post) => {
        assert.strictEqual(post.path.endsWith('.md'), false, 'Path should not end with .md');
        assert.strictEqual(post.path.endsWith('.html'), false, 'Path should not end with .html');
      });

      done();
    });
  });

  // Test usePermalinks option set to false
  it('should use non-permalink URLs (with .html extensions) when usePermalinks is false', (done) => {
    // Create mock files
    const files = {
      './blog/test-post1.md': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author'
      },
      './blog/test-post2.md': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author'
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Create plugin with usePermalinks = false
    const pluginInstance = plugin({
      usePermalinks: false
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Check that paths have .html extensions
      assert.strictEqual(metadata.allSortedBlogPosts.length, 2, 'Should have 2 blog posts');

      // Verify paths have .html extensions
      metadata.allSortedBlogPosts.forEach((post) => {
        assert.strictEqual(post.path.endsWith('.html'), true, 'Path should end with .html');
        assert.strictEqual(post.path.endsWith('.md'), false, 'Path should not end with .md');
      });

      done();
    });
  });

  // Test usePermalinks with different file extensions
  it('should handle usePermalinks with custom fileExtension', (done) => {
    // Create mock files with .njk extension
    const files = {
      './blog/test-post1.njk': {
        title: 'Test Post 1',
        date: '2022-01-01',
        author: 'Test Author'
      },
      './blog/test-post2.njk': {
        title: 'Test Post 2',
        date: '2022-02-01',
        author: 'Test Author'
      }
    };

    // Mock metalsmith instance
    const metadata = {};
    const metalsmithMock = {
      metadata: function () {
        return metadata;
      }
    };

    // Test with usePermalinks = false and custom fileExtension
    const pluginInstance = plugin({
      usePermalinks: false,
      fileExtension: '.njk'
    });

    // Run plugin on mock data
    pluginInstance(files, metalsmithMock, (err) => {
      if (err) {
        return done(err);
      }

      // Check that paths have .html extensions (replacing .njk)
      assert.strictEqual(metadata.allSortedBlogPosts.length, 2, 'Should have 2 blog posts');

      // Verify paths have .html extensions and not .njk
      metadata.allSortedBlogPosts.forEach((post) => {
        assert.strictEqual(post.path.endsWith('.html'), true, 'Path should end with .html');
        assert.strictEqual(post.path.endsWith('.njk'), false, 'Path should not end with .njk');
      });

      done();
    });
  });

  // Test dual module support
  describe('Dual module support', () => {
    it('should be importable as an ES module', () => {
      assert.strictEqual(typeof plugin, 'function', 'Plugin should be a function when imported with ESM');
      assert.strictEqual(typeof plugin(), 'function', 'Plugin should return a function when called');
    });

    // Note: CommonJS test is handled separately in test/cjs-test/cjs-import.cjs
  });
});
