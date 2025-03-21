import debugModule from 'debug';
const debug = debugModule('metalsmith-blog-lists');

/**
 * @typedef Options
 * @property {number} latestQuantity - Number of posts to show in latest blog posts list
 * @property {number} featuredQuantity - Number of posts to show in featured blog posts list
 * @property {string} featuredPostOrder - Order of featured posts: "asc" or "desc"
 * @property {string} fileExtension - File extension of blog posts (e.g., ".md")
 * @property {string} blogDirectory - Relative path to blog directory (e.g., "./blog")
 * @property {boolean} debugEnabled - Enable debug logging
 */

/** @type {Options} */
const defaults = {
  latestQuantity: 3,
  featuredQuantity: 3,
  featuredPostOrder: "desc",
  fileExtension: ".md",
  blogDirectory: "./blog", // Relative path to blog directory (can include subdirectories)
  debugEnabled: false
};

/**
 * Normalize plugin options
 * @param {Options} [options]
 * @returns {Object}
 */
function normalizeOptions( options ) {
  // Start with defaults
  const result = Object.assign( {}, defaults, options || {} );
  
  // Ensure blogDirectory has the correct format (starts with ./ and doesn't end with /)
  let dirPath = result.blogDirectory;
  if (!dirPath.startsWith('./')) {
    dirPath = `./${dirPath}`;
  }
  if (dirPath.endsWith('/')) {
    dirPath = dirPath.substring(0, dirPath.length - 1);
  }
  result.blogDirectory = dirPath;
  
  return result;
}

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
function initMetalsmithBlogLists( options ) {
  options = normalizeOptions( options );

  return function metalsmithBlogLists( files, metalsmith, done ) {

    const featuredBlogPosts = [];
    const allSortedBlogPosts = [];
    const annualizedBlogPosts = [];
    let latestBlogPosts = [];
    let temp;

    Object.keys( files ).forEach( ( file ) => {
      const thisFile = files[ file ];

      // we only look at blog posts
      // Remove the ./ prefix from the directory for file path matching
      const blogDirWithoutPrefix = options.blogDirectory.startsWith('./') 
        ? options.blogDirectory.substring(2) 
        : options.blogDirectory;
        
      // Check all possible directory formats to maximize compatibility
      const isInBlogDirectory = 
           file.indexOf( `${ options.blogDirectory }/` ) !== -1 || 
           file.indexOf( `${ blogDirWithoutPrefix }/` ) !== -1 ||
           file.startsWith( `${ options.blogDirectory }/` ) || 
           file.startsWith( `${ blogDirWithoutPrefix }/` );
           
      if (isInBlogDirectory) {
        const filePath = file.replace( options.fileExtension, "" );

        // assemble a sorted all blogs list
        // this list may be used when the whole list of blog posts is needed to
        // create a context influenced list like showing all other posts by
        // a particular author when we show a blog post.
        temp = {
          "title": thisFile.blogTitle || thisFile.title,
          "excerpt": thisFile.excerpt,
          "date": new Date( thisFile.date ),
          "author": thisFile.author,
          "path": filePath,
          "image": thisFile.image,
          "order": thisFile.featuredBlogpostOrder
        };
        allSortedBlogPosts.push( temp );

        // create the featured blog posts array
        // requires:
        //    featuredBlogpost: true
        //    featuredBlogpostOrder: <integer>
        //    featuredPostOrder:: "asc" | "desc"
        // to be set in the files frontmatter
        if ( thisFile.featuredBlogpost ) {
          featuredBlogPosts.push( temp );
        }
      }
    } );

    // arrays are build, now sort them
    allSortedBlogPosts.sort( ( a, b ) => {
      return a.date.getTime() - b.date.getTime();
    } );

    featuredBlogPosts.sort( ( a, b ) => {
      return a.order - b.order;
    } );
    
    // Get the sort order (maintain backward compatibility for featuredPostSortOrder)
    const sortOrder = options.featuredPostOrder;
    
    // Debug the provided options
    if (options.debugEnabled) {
      debug('Using sort order from options: %s', sortOrder);
    }
    
    if (options.debugEnabled) {
      debug('Featured blog posts before final sort: %O', featuredBlogPosts);
      debug('Sort order setting: %s', sortOrder);
    }
    
    // We've already sorted by order (low to high = 1, 2, 3)
    // For ascending order (asc), keep current sort (low to high = 1, 2, 3)
    // For descending order (desc), we need to reverse (high to low = 3, 2, 1)
    if (sortOrder === 'asc') {
      if (options.debugEnabled) {debug('Using ascending sort order (low to high = 1, 2, 3)');}
      // Already in ascending order (low to high), so no change needed
    } else {
      // Default is descending order (high to low)
      if (options.debugEnabled) {debug('Using descending sort order (high to low = 3, 2, 1)');}
      featuredBlogPosts.reverse();
    }
    
    if (options.debugEnabled) {
      debug('Featured blog posts after sorting: %O', featuredBlogPosts);
    }
    featuredBlogPosts.splice( options.featuredQuantity );

    // create the yearly archive list from array allSortedBlogPosts
    // get the year from the blog date
    const blogYears = [];
    let postYear;

    allSortedBlogPosts.forEach( ( post, _index ) => {
      const d = new Date( post.date );
      // we use getUTCFullYear so a January 1 date will attributed to the correct year
      postYear = d.getUTCFullYear().toString();
      // build year array
      blogYears.push( postYear );
    } );

    const yearArrayKeys = new Set( blogYears );
    yearArrayKeys.forEach( ( year ) => {
      const temp = [];
      allSortedBlogPosts.forEach( ( post, _index ) => {
        const d = new Date( post.date );
        // we use getUTCFullYear so a January 1 date will attributed to the correct year
        postYear = d.getUTCFullYear().toString();
        // check if this post is in this year
        if ( year === postYear ) {
          temp.push( post );
        }
      } );
      annualizedBlogPosts.push( {
        "year": year,
        "posts": temp
      } );
    } );

    // Sort annualizedBlogPosts by newest year first
    annualizedBlogPosts.sort( ( a, b ) => {
      a = a.year;
      b = b.year;
      return a > b ? -1 : ( a < b ? 1 : 0 );
    } );

    // create the latest blog posts array
    latestBlogPosts = allSortedBlogPosts.reverse().slice( 0, options.latestQuantity );

    // Add to metalsmith.metadata for global access
    const metadata = metalsmith.metadata();
    metadata.latestBlogPosts = latestBlogPosts;
    metadata.featuredBlogPosts = featuredBlogPosts;
    metadata.allSortedBlogPosts = allSortedBlogPosts;
    metadata.annualizedBlogPosts = annualizedBlogPosts;

    // update metadata
    metalsmith.metadata( metadata );

    done();
  };
}

// ESM export
export default initMetalsmithBlogLists;

// CommonJS export compatibility
if (typeof module !== 'undefined') {
  module.exports = initMetalsmithBlogLists;
}