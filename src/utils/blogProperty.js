/**
 * Blog property utilities for metalsmith-blog-lists plugin
 *
 * This file provides utilities for extracting blog properties from frontmatter:
 * - Getting properties from nested objects or direct properties
 * - Fallback property name handling
 * - File path processing for permalinks
 */

/**
 * Helper function to get blog properties from either nested object or direct properties
 * Supports both formats:
 * - Nested: file.post.title
 * - Direct: file.title
 * Also tries fallback property names if provided
 *
 * @param {Object} file - Metalsmith file object with frontmatter
 * @param {string} propertyName - Primary property name to look for
 * @param {string|null} fallbackName - Alternative property name to try
 * @param {string} blogObject - Name of nested blog object (e.g., "post")
 * @returns {*} The property value or undefined if not found
 */
export const getBlogProperty = (file, propertyName, fallbackName, blogObject) => {
  // If blogObject is specified and exists in the file
  if (blogObject && file[blogObject]) {
    // First try the property in the blog object
    if (file[blogObject][propertyName] !== undefined) {
      return file[blogObject][propertyName];
    }
  }

  // Try direct properties as fallbacks
  if (file[propertyName] !== undefined) {
    return file[propertyName];
  }

  // Try alternative property name if provided
  if (fallbackName && file[fallbackName] !== undefined) {
    return file[fallbackName];
  }

  // Return undefined if not found
  return undefined;
};

/**
 * Get the file path for use in links, handling both permalink and non-permalink formats
 *
 * @param {string} file - Original file path
 * @param {Object} options - Plugin options containing usePermalinks and fileExtension
 * @returns {string} Processed file path suitable for links
 */
export const getFilePath = (file, options) => {
  let filePath;

  if (options.usePermalinks) {
    // For permalinks: remove extension (e.g., 'blog/post')
    filePath = file.replace(options.fileExtension, '');

    // Handle index files - remove trailing '/index'
    if (filePath.endsWith('/index')) {
      filePath = filePath.replace(/\/index$/, '');
    }
  } else {
    // For non-permalinks: replace .md with .html
    filePath = file.replace(options.fileExtension, '.html');
  }

  return filePath;
};
