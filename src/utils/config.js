/**
 * Configuration utilities for metalsmith-blog-lists plugin
 * 
 * This file provides utilities for handling plugin configuration:
 * - Default configuration values
 * - Option normalization and validation
 * - Path formatting utilities
 */

/**
 * @typedef Options
 * @property {number} latestQuantity - Number of posts to show in latest blog posts list
 * @property {number} featuredQuantity - Number of posts to show in featured blog posts list
 * @property {string} featuredPostOrder - Order of featured posts: "asc" or "desc"
 * @property {string} fileExtension - File extension of blog posts (e.g., ".md")
 * @property {string} blogDirectory - Relative path to blog directory (e.g., "./blog")
 * @property {string} blogObject - Name of the blog object in frontmatter (e.g., "blog" for thisFile.blog.title) or empty string for direct properties
 * @property {boolean} usePermalinks - Whether to use permalink-style URLs (default: true)
 */

/** @type {Options} */
export const defaults = {
  latestQuantity: 3, // Default number of posts in latest posts list
  featuredQuantity: 3, // Default number of posts in featured posts list
  featuredPostOrder: 'desc', // Default order for featured posts (high to low)
  fileExtension: '.md', // Default file extension for blog posts
  blogDirectory: './blog', // Default relative path to blog directory
  blogObject: 'post', // Default object name in frontmatter containing blog properties
  usePermalinks: true // Default to using permalinks (URLs without file extensions)
};

/**
 * Normalize plugin options by merging with defaults and formatting paths
 * @param {Options} [options] - User-provided options
 * @returns {Object} - Normalized options object
 */
export const normalizeOptions = ( options ) => {
  // Start with defaults
  const result = { ...defaults, ...( options || {} ) };

  // Ensure blogDirectory has the correct format (starts with ./ and doesn't end with /)
  let dirPath = result.blogDirectory;
  if ( !dirPath.startsWith( './' ) ) {
    dirPath = `./${ dirPath }`;
  }
  if ( dirPath.endsWith( '/' ) ) {
    dirPath = dirPath.substring( 0, dirPath.length - 1 );
  }
  result.blogDirectory = dirPath;

  return result;
};