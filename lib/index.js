import debugModule from 'debug';
const debug = debugModule( 'metalsmith-blog-lists' );
import path from 'path';

/**
 * @typedef Options
 * @property {String} key
 */

/** @type {Options} */
const defaults = {
  latestQuantity: 3,
  featuredQuantity: 3,
  featuredPostOrder: "desc",
  featuredPostSortOrder: "desc",
  fileExtension: ".md",
  blogDirectory: "blog", // Directory name only - without trailing slash (new recommended option)
  blogDirectoryName: "./blog", // Full directory path for backward compatibility
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
  
  // Handle backward compatibility for blogDirectory/blogDirectoryName
  if (options && options.blogDirectory && !options.blogDirectoryName) {
    // If only blogDirectory is provided, use it to set blogDirectoryName
    result.blogDirectoryName = `./${options.blogDirectory}`;
    result.blogDirectory = options.blogDirectory;
  } else if (options && options.blogDirectoryName && !options.blogDirectory) {
    // If only blogDirectoryName is provided, extract blogDirectory from it
    // Remove "./" prefix if present
    const dirName = options.blogDirectoryName.startsWith('./') 
      ? options.blogDirectoryName.substring(2) 
      : options.blogDirectoryName;
      
    // Remove trailing slash if present
    result.blogDirectory = dirName.endsWith('/') 
      ? dirName.substring(0, dirName.length - 1) 
      : dirName;
  }
  
  // Ensure blogDirectoryName has the correct format (starts with ./ and doesn't end with /)
  let dirPath = result.blogDirectoryName;
  if (!dirPath.startsWith('./')) {
    dirPath = `./${dirPath}`;
  }
  if (dirPath.endsWith('/')) {
    dirPath = dirPath.substring(0, dirPath.length - 1);
  }
  result.blogDirectoryName = dirPath;
  
  return result;
}

/**
 * A Metalsmith plugin to add various blog lists to metadata
 *
 * @param {Options} options
 * @returns {import('metalsmith').Plugin}
 */
function initMetalsmithBlogLists( options ) {
  options = normalizeOptions( options );

  return function metalsmithBlogLists( files, metalsmith, done ) {

    let latestBlogPosts = [];
    const featuredBlogPosts = [];
    const allSortedBlogPosts = [];
    const annualizedBlogPosts = [];
    const unsortedAnnualizedBlogPosts = [];
    let temp;

    Object.keys( files ).forEach( function ( file ) {
      const thisFile = files[ file ];

      // we only look at blog posts
      // Check all possible directory formats to maximize compatibility
      if ( file.indexOf( `${ options.blogDirectoryName }/` ) !== -1 || 
           file.indexOf( `${ options.blogDirectory }/` ) !== -1 ||
           file.indexOf( `./${ options.blogDirectory }/` ) !== -1 ||
           file.startsWith( `${ options.blogDirectory }/` ) || 
           file.startsWith( `${ options.blogDirectoryName }/` ) ) {
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
    allSortedBlogPosts.sort( function ( a, b ) {
      return a.date.getTime() - b.date.getTime();
    } );

    featuredBlogPosts.sort( function ( a, b ) {
      return a.order - b.order;
    } );
    
    // Support both option names for backward compatibility
    const sortOrder = options.featuredPostSortOrder || options.featuredPostOrder;
    
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
      if (options.debugEnabled) debug('Using ascending sort order (low to high = 1, 2, 3)');
      // Already in ascending order (low to high), so no change needed
    } else {
      // Default is descending order (high to low)
      if (options.debugEnabled) debug('Using descending sort order (high to low = 3, 2, 1)');
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

    allSortedBlogPosts.forEach( function ( post, index ) {
      const d = new Date( post.date );
      // we use getUTCFullYear so a January 1 date will attributed to the correct year
      postYear = d.getUTCFullYear().toString();
      // build year array
      blogYears.push( postYear );
    } );

    const yearArrayKeys = new Set( blogYears );
    yearArrayKeys.forEach( function ( year ) {
      const temp = [];
      allSortedBlogPosts.forEach( function ( post, index ) {
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

    // sort unsortedAnnualizedBlogPosts by newest year first
    annualizedBlogPosts.sort( function ( a, b ) {
      a = a.year;
      b = b.year;
      return a > b ? -1 : ( a < b ? 1 : 0 );
    } );

    // create the latest blog posts array
    latestBlogPosts = allSortedBlogPosts.reverse().slice( 0, options.latestQuantity );

    // Add to metalsmith.metadata for global access
    const metadata = metalsmith.metadata();
    metadata[ 'latestBlogPosts' ] = latestBlogPosts;
    metadata[ 'featuredBlogPosts' ] = featuredBlogPosts;
    metadata[ 'allSortedBlogPosts' ] = allSortedBlogPosts;
    metadata[ 'annualizedBlogPosts' ] = annualizedBlogPosts;

    // update metadata
    metalsmith.metadata( metadata );

    done();
  };
}

export default initMetalsmithBlogLists;
