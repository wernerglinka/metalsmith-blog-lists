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
const defaults = {
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
const normalizeOptions = ( options ) => {
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
const plugin = ( options ) => {
  options = normalizeOptions( options );

  // Create the plugin function with arrow syntax
  const metalsmithBlogLists = ( files, metalsmith, done ) => {
    // Get debug function from metalsmith
    const debug = metalsmith.debug ? metalsmith.debug( 'metalsmith-blog-lists' ) : () => { };

    debug( 'Starting blog-lists plugin with options: %O', options );

    // Initialize arrays to store different blog post collections
    const featuredBlogPosts = []; // Will hold posts marked as featured
    const allSortedBlogPosts = []; // Will hold all blog posts sorted by date
    const annualizedBlogPosts = []; // Will hold posts organized by year
    let latestBlogPosts = []; // Will hold most recent posts
    let temp; // Temporary object for building post data

    // Process each file in the Metalsmith files object
    Object.keys( files ).forEach( ( file ) => {
      const thisFile = files[ file ];

      // Prepare blog directory path for flexible matching
      // Remove the ./ prefix from the directory for file path matching
      const blogDirWithoutPrefix = options.blogDirectory.startsWith( './' )
        ? options.blogDirectory.substring( 2 )
        : options.blogDirectory;

      // Check if file is in the blog directory using multiple matching strategies
      // This ensures compatibility with different path formats
      const isInBlogDirectory =
        file.indexOf( `${ options.blogDirectory }/` ) !== -1 ||
        file.indexOf( `${ blogDirWithoutPrefix }/` ) !== -1 ||
        file.startsWith( `${ options.blogDirectory }/` ) ||
        file.startsWith( `${ blogDirWithoutPrefix }/` );

      if ( isInBlogDirectory ) {
        // Get the file path for use in links, handling both permalink and non-permalink formats
        let filePath;
        if ( options.usePermalinks ) {
          // For permalinks: remove extension (e.g., 'blog/post')
          filePath = file.replace( options.fileExtension, '' );

          // Handle index files - remove trailing '/index'
          if ( filePath.endsWith( '/index' ) ) {
            filePath = filePath.replace( /\/index$/, '' );
          }
        } else {
          // For non-permalinks: replace .md with .html
          filePath = file.replace( options.fileExtension, '.html' );
        }

        /**
         * Helper function to get blog properties from either nested object or direct properties
         * Supports both formats:
         * - Nested: file.post.title
         * - Direct: file.title
         * Also tries fallback property names if provided
         */
        const getBlogProperty = ( file, propertyName, fallbackName ) => {
          // If blogObject is specified and exists in the file
          if ( options.blogObject && file[ options.blogObject ] ) {
            // First try the property in the blog object
            if ( file[ options.blogObject ][ propertyName ] !== undefined ) {
              return file[ options.blogObject ][ propertyName ];
            }
          }

          // Try direct properties as fallbacks
          if ( file[ propertyName ] !== undefined ) {
            return file[ propertyName ];
          }

          // Try alternative property name if provided
          if ( fallbackName && file[ fallbackName ] !== undefined ) {
            return file[ fallbackName ];
          }

          // Return undefined if not found
          return undefined;
        };

        // Check if post is featured by looking for featuredBlogpost property
        const isFeatured = getBlogProperty( thisFile, 'featuredBlogpost', null );

        // Create a standardized post object with essential metadata
        temp = {
          title: getBlogProperty( thisFile, 'title', 'blogTitle' ) || getBlogProperty( thisFile, 'blogTitle', 'title' ),
          excerpt: getBlogProperty( thisFile, 'excerpt', null ),
          date: new Date( getBlogProperty( thisFile, 'date', null ) ),
          author: getBlogProperty( thisFile, 'author', null ),
          path: filePath,
          image: getBlogProperty( thisFile, 'image', null ),
          order: getBlogProperty( thisFile, 'featuredBlogpostOrder', null )
        };

        // Add to all blog posts collection
        allSortedBlogPosts.push( temp );

        // If post is marked as featured, add to featured posts collection
        if ( isFeatured ) {
          featuredBlogPosts.push( temp );
        }
      }
    } );

    // Sort all blog posts by date (oldest to newest)
    allSortedBlogPosts.sort( ( a, b ) => {
      return a.date.getTime() - b.date.getTime();
    } );

    // Sort featured posts by their order property (low to high)
    featuredBlogPosts.sort( ( a, b ) => {
      return a.order - b.order;
    } );

    // Apply the featured post order setting (asc or desc)
    const sortOrder = options.featuredPostOrder;

    debug( 'Using sort order from options: %s', sortOrder );
    debug( 'Featured blog posts before final sort: %O', featuredBlogPosts );

    // Handle sort order for featured posts
    // We've already sorted by order (low to high = 1, 2, 3)
    // For ascending order (asc), keep current sort (low to high = 1, 2, 3)
    // For descending order (desc), we need to reverse (high to low = 3, 2, 1)
    if ( sortOrder === 'asc' ) {
      debug( 'Using ascending sort order (low to high = 1, 2, 3)' );
      // Already in ascending order (low to high), so no change needed
    } else {
      // Default is descending order (high to low)
      debug( 'Using descending order (high to low = 3, 2, 1)' );
      featuredBlogPosts.reverse();
    }

    debug( 'Featured blog posts after sorting: %O', featuredBlogPosts );

    // Limit featured posts to the specified quantity
    featuredBlogPosts.splice( options.featuredQuantity );

    // Create the yearly archive list from allSortedBlogPosts
    const blogYears = [];
    let postYear;

    // Extract years from all blog posts
    allSortedBlogPosts.forEach( ( post, _index ) => {
      const d = new Date( post.date );
      // Use getUTCFullYear to ensure January 1 dates are attributed to the correct year
      postYear = d.getUTCFullYear().toString();
      // Add year to array (will have duplicates at this point)
      blogYears.push( postYear );
    } );

    // Get unique years using Set
    const yearArrayKeys = new Set( blogYears );

    // Create year-based collections
    yearArrayKeys.forEach( ( year ) => {
      const temp = [];
      // Find all posts for this year
      allSortedBlogPosts.forEach( ( post, _index ) => {
        const d = new Date( post.date );
        postYear = d.getUTCFullYear().toString();
        // Add post to this year's collection if it matches
        if ( year === postYear ) {
          temp.push( post );
        }
      } );
      // Add year and its posts to annualized collection
      annualizedBlogPosts.push( {
        year: year,
        posts: temp
      } );
    } );

    // Sort annualized posts by newest year first
    annualizedBlogPosts.sort( ( a, b ) => {
      a = a.year;
      b = b.year;
      return a > b ? -1 : a < b ? 1 : 0;
    } );

    // Create latest blog posts array (most recent posts)
    // Reverse allSortedBlogPosts to get newest first, then take specified quantity
    latestBlogPosts = allSortedBlogPosts.reverse().slice( 0, options.latestQuantity );

    // Add all collections to metalsmith.metadata for global access in templates
    const metadata = metalsmith.metadata();
    metadata.latestBlogPosts = latestBlogPosts;
    metadata.featuredBlogPosts = featuredBlogPosts;
    metadata.allSortedBlogPosts = allSortedBlogPosts;
    metadata.annualizedBlogPosts = annualizedBlogPosts;

    // Update metadata
    metalsmith.metadata( metadata );

    // Signal completion to Metalsmith
    done();
  };

  // Return the function
  return metalsmithBlogLists;
};

// Set the function name for compatibility with tests
Object.defineProperty( plugin, 'name', { value: 'initMetalsmithBlogLists' } );

// Export the plugin
export default plugin;
