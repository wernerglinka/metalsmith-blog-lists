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
 * Returns a new sorted array without mutating the input
 *
 * @param {Array} posts - Array of blog post objects with date property
 * @returns {Array} New sorted array of posts
 */
export const sortByDate = (posts) => {
  return [...posts].sort((a, b) => {
    return a.date.getTime() - b.date.getTime();
  });
};

/**
 * Sort featured posts by their order property (low to high)
 * Returns a new sorted array without mutating the input
 *
 * @param {Array} posts - Array of featured blog post objects with order property
 * @returns {Array} New sorted array of posts
 */
export const sortByOrder = (posts) => {
  return [...posts].sort((a, b) => {
    return a.order - b.order;
  });
};

/**
 * Sort annualized posts by newest year first
 * Returns a new sorted array without mutating the input
 *
 * @param {Array} annualizedPosts - Array of year objects with year property
 * @returns {Array} New sorted array by year (newest first)
 */
export const sortByYear = (annualizedPosts) => {
  return [...annualizedPosts].sort((a, b) => {
    const yearA = a.year;
    const yearB = b.year;
    return yearA > yearB ? -1 : yearA < yearB ? 1 : 0;
  });
};
