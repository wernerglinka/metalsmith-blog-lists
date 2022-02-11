/**
 * @typedef Options
 * @property {String} key
 */

/** @type {Options} */
const defaults = {
  latestQuantity: 3,
  featuredQuantity: 3,
  featuredPostOrder: "desc"
}

/**
 * Normalize plugin options
 * @param {Options} [options]
 * @returns {Object}
 */
function normalizeOptions(options) {
  return Object.assign({}, defaults, options || {})
}

function doSomething(file, path) {
  file.path = path
  return file
}

/**
 * A Metalsmith plugin to add various blog lists to metadata
 *
 * @param {Options} options
 * @returns {import('metalsmith').Plugin}
 */
function initBlogLists(options) {
  options = normalizeOptions(options)

  return function blogLists(files, metalsmith, done) {
    setImmediate(done)

    const latestBlogPosts = [];
    const featuredBlogPosts = [];
    const allSortedBlogPosts = [];
    const temp = [];
    
    Object.keys(files).forEach(function(file){
      var thisFile = files[file];

      // we only look at blog posts
      if ((file.indexOf('blog/') !== -1) && (thisFile.file_type === "blog_post")) {

          // assemble a sorted all blogs list
          // this list may be used when the whole list of blog posts is needed to
          // create a context influenced list like showing all other posts by
          // a particular author when we show a blog post.
          temp = {
              "title":  thisFile.title,
              "date":   thisFile.date,
              "path":   thisFile.path.replace('.html', ''),
              "image":  thisFile.image,
              "listBg": thisFile.blog_list_bg
          }
          allSortedBlogPosts.push(temp);
          allSortedBlogPosts.sort(function(a,b) {
              return a.date.getTime() - b.date.getTime();
          });

          // create the featured blog posts array
          // requires:
          //    featured_blog_post: true
          //    featured_blog_post_order: <integer>
          //    featured_blog_post_sort_order: "asc" | "desc"
          // to be set in the files frontmatter
          if ( thisFile.featured_blog_post ) {
              temp = {
                  "title" :  thisFile.title,
                  "date" :   thisFile.date,
                  "path" :   thisFile.path.replace('.html', '')
              }
          }
          featuredBlogPosts.push(temp);
          featuredBlogPosts.sort(function(a,b) {
              return a.order - b.order;
          });
          if (options.featured_blog_post_sort_order === 'desc') {
              featuredBlogPosts.reverse();
          }
          featuredBlogPosts.splice(options.featured_quantity);
        }
    });

    // create the yearly archive list from array allSortedBlogPosts
    // get the year from the blog date
    allSortedBlogPosts.reverse();
    allSortedBlogPosts.forEach(function(post, index) {
        var d = new Date(post.date);
        // we use getUTCFullYear so a January 1 date will attributed to the correct year
        postYear = d.getUTCFullYear().toString();
        // build the annualized blog list
        if (!unsortedAnnualizedBlogPosts[postYear]) {
          unsortedAnnualizedBlogPosts[postYear] = [];
        }
        unsortedAnnualizedBlogPosts[postYear].push(allSortedBlogPosts[index]);
    });

    // sort unsortedAnnualizedBlogPosts by newest year first
    // turn unsortedAnnualizedBlogPosts into a real array and sort
    for (var key in unsortedAnnualizedBlogPosts) {
      annualizedBlogPosts.push([key, unsortedAnnualizedBlogPosts[key]]);
    }
    annualizedBlogPosts.sort(function(a, b) {
      a = a[0];
      b = b[0];
      return a > b ? -1 : (a < b ? 1 : 0);
    });

    // create the latest blog posts array
    latestBlogPosts = allSortedBlogPosts.slice(0, options.latest_quantity);

    // Add to metalsmith.metadata for global access
    var metadata = metalsmith.metadata();
    metadata['latestBlogPosts'] = latestBlogPosts;
    metadata['featuredBlogPosts'] = featuredBlogPosts;
    metadata['allSortedBlogPosts'] = allSortedBlogPosts;
    metadata['annualizedBlogPosts'] = annualizedBlogPosts;

    // update metadata
    metalsmith.metadata(metadata);
    }
}

module.exports = initBlogLists
