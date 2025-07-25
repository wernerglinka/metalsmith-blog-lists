/**
 * Sorting utilities for metalsmith-blog-lists plugin
 *
 * This file provides utilities for sorting blog post collections:
 * - Date-based sorting for chronological ordering
 * - Order-based sorting for featured posts
 * - Year extraction and grouping utilities
 */

/**
 * Sort blog posts by date (oldest to newest)
 *
 * @param {Array} posts - Array of blog post objects with date property
 * @returns {Array} Sorted array of posts
 */
export const sortByDate = (posts) => {
  return posts.sort((a, b) => {
    return a.date.getTime() - b.date.getTime();
  });
};

/**
 * Sort featured posts by their order property (low to high)
 *
 * @param {Array} posts - Array of featured blog post objects with order property
 * @returns {Array} Sorted array of posts
 */
export const sortByOrder = (posts) => {
  return posts.sort((a, b) => {
    return a.order - b.order;
  });
};

/**
 * Apply the featured post order setting (asc or desc)
 *
 * @param {Array} posts - Array of posts already sorted by order
 * @param {string} sortOrder - 'asc' for ascending, 'desc' for descending
 * @returns {Array} Posts in the requested order
 */
export const applyFeaturedOrder = (posts, sortOrder) => {
  // For ascending order (asc), keep current sort (low to high = 1, 2, 3)
  // For descending order (desc), reverse (high to low = 3, 2, 1)
  if (sortOrder === 'asc') {
    // Already in ascending order (low to high), so no change needed
    return posts;
  }
  // Default is descending order (high to low)
  return [...posts].reverse();
};

/**
 * Sort annualized posts by newest year first
 *
 * @param {Array} annualizedPosts - Array of year objects with year property
 * @returns {Array} Sorted array by year (newest first)
 */
export const sortByYear = (annualizedPosts) => {
  return annualizedPosts.sort((a, b) => {
    const yearA = a.year;
    const yearB = b.year;
    return yearA > yearB ? -1 : yearA < yearB ? 1 : 0;
  });
};
