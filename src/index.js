import { normalizeOptions } from './utils/config.js';
import { getBlogProperty, getFilePath } from './utils/blogProperty.js';
import { sortByDate, sortByOrder, sortByYear } from './utils/sorting.js';
import {
  createPostObject,
  extractUniqueYears,
  createAnnualizedCollections,
  isInBlogDirectory
} from './utils/collections.js';

/**
 * A Metalsmith plugin to add various blog lists to metadata
 *
 * Creates four collections of blog posts:
 * - latestBlogPosts: Most recent posts, limited by latestQuantity
 * - featuredBlogPosts: Posts marked as featured in frontmatter, limited by featuredQuantity
 * - allSortedBlogPosts: All blog posts sorted by date
 * - annualizedBlogPosts: Blog posts organized by year
 *
 * @param {Options} options - Plugin options
 * @returns {import('metalsmith').Plugin} - Metalsmith plugin function
 */
const plugin = (options) => {
  options = normalizeOptions(options);

  // Create the plugin function with arrow syntax
  const metalsmithBlogLists = (files, metalsmith, done) => {
    // Get debug function from metalsmith
    const debug = metalsmith.debug ? metalsmith.debug('metalsmith-blog-lists') : () => {};

    debug('Starting blog-lists plugin with options: %O', options);

    // Initialize arrays to collect blog posts during file processing
    const collectedPosts = [];
    const collectedFeatured = [];

    // Process each file in the Metalsmith files object
    Object.keys(files).forEach((file) => {
      const thisFile = files[file];

      if (isInBlogDirectory(file, options)) {
        // Get the file path for use in links, handling both permalink and non-permalink formats
        const filePath = getFilePath(file, options);

        // Check if post is featured by looking for featuredBlogpost property
        const isFeatured = getBlogProperty(thisFile, 'featuredBlogpost', null, options.blogObject);

        // Create a standardized post object with essential metadata
        const postObject = createPostObject(thisFile, filePath, options);

        // Add to all blog posts collection
        collectedPosts.push(postObject);

        // If post is marked as featured, add to featured posts collection
        if (isFeatured) {
          collectedFeatured.push(postObject);
        }
      }
    });

    // Sort all blog posts by date (oldest to newest)
    const allSortedBlogPosts = sortByDate(collectedPosts);

    // Sort featured posts by their order property (low to high)
    let featuredBlogPosts = sortByOrder(collectedFeatured);

    // Apply the featured post order setting (asc or desc)
    const sortOrder = options.featuredPostOrder;

    debug('Using sort order from options: %s', sortOrder);
    debug('Featured blog posts before final sort: %O', featuredBlogPosts);

    // Apply the featured post order setting (asc or desc)
    if (sortOrder === 'desc') {
      // Descending order (high to low)
      featuredBlogPosts = [...featuredBlogPosts].reverse();
    }
    // For ascending order (asc), keep current sort (low to high = 1, 2, 3)

    debug('Featured blog posts after sorting: %O', featuredBlogPosts);

    // Limit featured posts to the specified quantity
    featuredBlogPosts = featuredBlogPosts.slice(0, options.featuredQuantity);

    // Create the yearly archive list from allSortedBlogPosts
    const uniqueYears = extractUniqueYears(allSortedBlogPosts);
    const annualizedCollections = createAnnualizedCollections(allSortedBlogPosts, uniqueYears);

    // Sort annualized posts by newest year first
    const annualizedBlogPosts = sortByYear(annualizedCollections);

    // Create latest blog posts array (most recent posts)
    // Reverse a copy to get newest first, then take specified quantity
    const latestBlogPosts = [...allSortedBlogPosts].reverse().slice(0, options.latestQuantity);

    // Add all collections to metalsmith.metadata for global access in templates
    const metadata = metalsmith.metadata();
    metadata.latestBlogPosts = latestBlogPosts;
    metadata.featuredBlogPosts = featuredBlogPosts;
    metadata.allSortedBlogPosts = allSortedBlogPosts;
    metadata.annualizedBlogPosts = annualizedBlogPosts;

    // Update metadata
    metalsmith.metadata(metadata);

    // Signal completion to Metalsmith
    done();
  };

  // Return the function
  return metalsmithBlogLists;
};

// Set the function name for compatibility with tests
Object.defineProperty(plugin, 'name', { value: 'initMetalsmithBlogLists' });

// Export the plugin
export default plugin;
