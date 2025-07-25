/**
 * Collection utilities for metalsmith-blog-lists plugin
 *
 * This file provides utilities for creating and managing blog post collections:
 * - Creating standardized post objects
 * - Building annualized collections
 * - Extracting unique years from posts
 */

import { getBlogProperty } from './blogProperty.js';

/**
 * Create a standardized post object with essential metadata
 *
 * @param {Object} file - Metalsmith file object
 * @param {string} filePath - Processed file path for links
 * @param {Object} options - Plugin options
 * @returns {Object} Standardized post object
 */
export const createPostObject = ( file, filePath, options ) => {
  return {
    title: getBlogProperty( file, 'title', 'blogTitle', options.blogObject ) ||
      getBlogProperty( file, 'blogTitle', 'title', options.blogObject ),
    excerpt: getBlogProperty( file, 'excerpt', null, options.blogObject ),
    date: new Date( getBlogProperty( file, 'date', null, options.blogObject ) ),
    author: getBlogProperty( file, 'author', null, options.blogObject ),
    path: filePath,
    image: getBlogProperty( file, 'image', null, options.blogObject ),
    order: getBlogProperty( file, 'featuredBlogpostOrder', null, options.blogObject )
  };
};

/**
 * Extract unique years from all blog posts
 *
 * @param {Array} posts - Array of blog post objects with date property
 * @returns {Set} Set of unique years as strings
 */
export const extractUniqueYears = ( posts ) => {
  const years = [];

  posts.forEach( ( post ) => {
    const d = new Date( post.date );
    // Use getUTCFullYear to ensure January 1 dates are attributed to the correct year
    const postYear = d.getUTCFullYear().toString();
    years.push( postYear );
  } );

  // Return unique years using Set
  return new Set( years );
};

/**
 * Create year-based collections from all blog posts
 *
 * @param {Array} allPosts - Array of all blog post objects
 * @param {Set} uniqueYears - Set of unique years
 * @returns {Array} Array of year objects with posts
 */
export const createAnnualizedCollections = ( allPosts, uniqueYears ) => {
  const annualizedPosts = [];

  uniqueYears.forEach( ( year ) => {
    const yearPosts = [];

    // Find all posts for this year
    allPosts.forEach( ( post ) => {
      const d = new Date( post.date );
      const postYear = d.getUTCFullYear().toString();

      // Add post to this year's collection if it matches
      if ( year === postYear ) {
        yearPosts.push( post );
      }
    } );

    // Add year and its posts to annualized collection
    annualizedPosts.push( {
      year: year,
      posts: yearPosts
    } );
  } );

  return annualizedPosts;
};

/**
 * Check if a file is in the specified blog directory
 *
 * @param {string} file - File path to check
 * @param {Object} options - Plugin options with blogDirectory
 * @returns {boolean} True if file is in blog directory
 */
export const isInBlogDirectory = ( file, options ) => {
  // Prepare blog directory path for flexible matching
  // Remove the ./ prefix from the directory for file path matching
  const blogDirWithoutPrefix = options.blogDirectory.startsWith( './' )
    ? options.blogDirectory.substring( 2 )
    : options.blogDirectory;

  // Check if file is in the blog directory using multiple matching strategies
  // This ensures compatibility with different path formats
  return file.indexOf( `${ options.blogDirectory }/` ) !== -1 ||
    file.indexOf( `${ blogDirWithoutPrefix }/` ) !== -1 ||
    file.startsWith( `${ options.blogDirectory }/` ) ||
    file.startsWith( `${ blogDirWithoutPrefix }/` );
};
