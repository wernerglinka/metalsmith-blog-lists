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

    // Initialize arrays to store different blog post collections
    const featuredBlogPosts = []; // Will hold posts marked as featured
    const allSortedBlogPosts = []; // Will hold all blog posts sorted by date
    const annualizedBlogPosts = []; // Will hold posts organized by year
    let latestBlogPosts = []; // Will hold most recent posts
    let temp; // Temporary object for building post data

    // Process each file in the Metalsmith files object
    Object.keys(files).forEach((file) => {
      const thisFile = files[file];

      if (isInBlogDirectory(file, options)) {
        // Get the file path for use in links, handling both permalink and non-permalink formats
        const filePath = getFilePath(file, options);

        // Check if post is featured by looking for featuredBlogpost property
        const isFeatured = getBlogProperty(thisFile, 'featuredBlogpost', null, options.blogObject);

        // Create a standardized post object with essential metadata
        temp = createPostObject(thisFile, filePath, options);

        // Add to all blog posts collection
        allSortedBlogPosts.push(temp);

        // If post is marked as featured, add to featured posts collection
        if (isFeatured) {
          featuredBlogPosts.push(temp);
        }
      }
    });

    // Sort all blog posts by date (oldest to newest)
    sortByDate(allSortedBlogPosts);

    // Sort featured posts by their order property (low to high)
    sortByOrder(featuredBlogPosts);

    // Apply the featured post order setting (asc or desc)
    const sortOrder = options.featuredPostOrder;

    debug('Using sort order from options: %s', sortOrder);
    debug('Featured blog posts before final sort: %O', featuredBlogPosts);

    // Apply the featured post order setting (asc or desc)
    if (sortOrder === 'desc') {
      // Default is descending order (high to low)
      featuredBlogPosts.reverse();
    }
    // For ascending order (asc), keep current sort (low to high = 1, 2, 3)

    debug('Featured blog posts after sorting: %O', featuredBlogPosts);

    // Limit featured posts to the specified quantity
    featuredBlogPosts.splice(options.featuredQuantity);

    // Create the yearly archive list from allSortedBlogPosts
    const uniqueYears = extractUniqueYears(allSortedBlogPosts);
    const annualizedCollections = createAnnualizedCollections(allSortedBlogPosts, uniqueYears);
    annualizedBlogPosts.push(...annualizedCollections);

    // Sort annualized posts by newest year first
    sortByYear(annualizedBlogPosts);

    // Create latest blog posts array (most recent posts)
    // Reverse allSortedBlogPosts to get newest first, then take specified quantity
    latestBlogPosts = allSortedBlogPosts.reverse().slice(0, options.latestQuantity);

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
