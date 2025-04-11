/**
 * @typedef Options
 * @property {number} latestQuantity - Number of posts to show in latest blog posts list
 * @property {number} featuredQuantity - Number of posts to show in featured blog posts list
 * @property {string} featuredPostOrder - Order of featured posts: "asc" or "desc"
 * @property {string} fileExtension - File extension of blog posts (e.g., ".md")
 * @property {string} blogDirectory - Relative path to blog directory (e.g., "./blog")
 * @property {string} blogObject - Name of the blog object in frontmatter (e.g., "blog" for thisFile.blog.title) or empty string for direct properties
 */

/** @type {Options} */
const defaults = {
  latestQuantity: 3,
  featuredQuantity: 3,
  featuredPostOrder: 'desc',
  fileExtension: '.md',
  blogDirectory: './blog',
  // Relative path to blog directory (can include subdirectories)
  blogObject: '' // Empty string means direct properties (thisFile.title), otherwise nested (thisFile[blogObject].title)
};

/**
 * Normalize plugin options
 * @param {Options} [options]
 * @returns {Object}
 */
function normalizeOptions(options) {
  // Start with defaults
  const result = Object.assign({}, defaults, options || {});

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
function initMetalsmithBlogLists(options) {
  options = normalizeOptions(options);
  return function metalsmithBlogLists(files, metalsmith, done) {
    // Get debug function from metalsmith
    const debug = metalsmith.debug ? metalsmith.debug('metalsmith-blog-lists') : () => {};
    debug('Starting blog-lists plugin with options: %O', options);
    const featuredBlogPosts = [];
    const allSortedBlogPosts = [];
    const annualizedBlogPosts = [];
    let latestBlogPosts = [];
    let temp;
    Object.keys(files).forEach(file => {
      const thisFile = files[file];

      // we only look at blog posts
      // Remove the ./ prefix from the directory for file path matching
      const blogDirWithoutPrefix = options.blogDirectory.startsWith('./') ? options.blogDirectory.substring(2) : options.blogDirectory;

      // Check all possible directory formats to maximize compatibility
      const isInBlogDirectory = file.indexOf(`${options.blogDirectory}/`) !== -1 || file.indexOf(`${blogDirWithoutPrefix}/`) !== -1 || file.startsWith(`${options.blogDirectory}/`) || file.startsWith(`${blogDirWithoutPrefix}/`);
      if (isInBlogDirectory) {
        const filePath = file.replace(options.fileExtension, '');

        // Get properties based on whether we're using a nested blog object or direct properties
        const getBlogProperty = (file, propertyName, fallbackName) => {
          // If blogObject is specified and exists in the file
          if (options.blogObject && file[options.blogObject]) {
            // First try the property in the blog object
            if (file[options.blogObject][propertyName] !== undefined) {
              return file[options.blogObject][propertyName];
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

        // Check if post is featured
        const isFeatured = getBlogProperty(thisFile, 'featuredBlogpost', null);

        // assemble a sorted all blogs list
        // this list may be used when the whole list of blog posts is needed to
        // create a context influenced list like showing all other posts by
        // a particular author when we show a blog post.
        temp = {
          title: getBlogProperty(thisFile, 'title', 'blogTitle') || getBlogProperty(thisFile, 'blogTitle', 'title'),
          excerpt: getBlogProperty(thisFile, 'excerpt', null),
          date: new Date(getBlogProperty(thisFile, 'date', null)),
          author: getBlogProperty(thisFile, 'author', null),
          path: filePath,
          image: getBlogProperty(thisFile, 'image', null),
          order: getBlogProperty(thisFile, 'featuredBlogpostOrder', null)
        };
        allSortedBlogPosts.push(temp);

        // create the featured blog posts array
        // requires:
        //    featuredBlogpost: true
        //    featuredBlogpostOrder: <integer>
        //    featuredPostOrder:: "asc" | "desc"
        // to be set in the files frontmatter
        if (isFeatured) {
          featuredBlogPosts.push(temp);
        }
      }
    });

    // arrays are build, now sort them
    allSortedBlogPosts.sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });
    featuredBlogPosts.sort((a, b) => {
      return a.order - b.order;
    });

    // Get the sort order (maintain backward compatibility for featuredPostSortOrder)
    const sortOrder = options.featuredPostOrder;
    debug('Using sort order from options: %s', sortOrder);
    debug('Featured blog posts before final sort: %O', featuredBlogPosts);

    // We've already sorted by order (low to high = 1, 2, 3)
    // For ascending order (asc), keep current sort (low to high = 1, 2, 3)
    // For descending order (desc), we need to reverse (high to low = 3, 2, 1)
    if (sortOrder === 'asc') {
      debug('Using ascending sort order (low to high = 1, 2, 3)');
      // Already in ascending order (low to high), so no change needed
    } else {
      // Default is descending order (high to low)
      debug('Using descending sort order (high to low = 3, 2, 1)');
      featuredBlogPosts.reverse();
    }
    debug('Featured blog posts after sorting: %O', featuredBlogPosts);
    featuredBlogPosts.splice(options.featuredQuantity);

    // create the yearly archive list from array allSortedBlogPosts
    // get the year from the blog date
    const blogYears = [];
    let postYear;
    allSortedBlogPosts.forEach((post, _index) => {
      const d = new Date(post.date);
      // we use getUTCFullYear so a January 1 date will attributed to the correct year
      postYear = d.getUTCFullYear().toString();
      // build year array
      blogYears.push(postYear);
    });
    const yearArrayKeys = new Set(blogYears);
    yearArrayKeys.forEach(year => {
      const temp = [];
      allSortedBlogPosts.forEach((post, _index) => {
        const d = new Date(post.date);
        // we use getUTCFullYear so a January 1 date will attributed to the correct year
        postYear = d.getUTCFullYear().toString();
        // check if this post is in this year
        if (year === postYear) {
          temp.push(post);
        }
      });
      annualizedBlogPosts.push({
        year: year,
        posts: temp
      });
    });

    // Sort annualizedBlogPosts by newest year first
    annualizedBlogPosts.sort((a, b) => {
      a = a.year;
      b = b.year;
      return a > b ? -1 : a < b ? 1 : 0;
    });

    // create the latest blog posts array
    latestBlogPosts = allSortedBlogPosts.reverse().slice(0, options.latestQuantity);

    // Add to metalsmith.metadata for global access
    const metadata = metalsmith.metadata();
    metadata.latestBlogPosts = latestBlogPosts;
    metadata.featuredBlogPosts = featuredBlogPosts;
    metadata.allSortedBlogPosts = allSortedBlogPosts;
    metadata.annualizedBlogPosts = annualizedBlogPosts;

    // update metadata
    metalsmith.metadata(metadata);
    done();
  };
}

export { initMetalsmithBlogLists as default };
//# sourceMappingURL=index.js.map
