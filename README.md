# Metalsmith Blog Lists

A metalsmith plugin to provide various blog lists

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]


## Features
The plugin adds the following lists to the metadata to enable various blog widgets on any page.
- All Blogs
- Recent Blogs
- Featured Blogs
- Annualized Blogs List

The following data is available for each blogpost:
- Title
- Date
- Author
- Path
- Image

The lists may be used to show all blog posts by a particular author.

### All Blog Posts
The plugin provides array `allSortedBlogPosts`, sorted by date. It can be used when the whole list of blog posts is not available, for example, when using pagination, NOT all blog posts are available on a paginated page.

### Latest Blogs
The plugin provides array `latestBlogPosts`. The number of blog posts listed is determined by option `latestQuantity`.

### Featured Blogs
The plugin provides array `featuredBlogPosts`. Blog posts can specify, in their Frontmatter, that the post be listed and in what position of the list.

### Annualized Blogs List
The plugin provides an associative array `annualizedBlogPosts`. All blog posts are listed by their creation year.

## Installation

NPM:

```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
src       | 61.64 | 65.62 | 44.82 | 61.64
```

## License

[ISC](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/metalsmith-blog-lists.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-blog-lists
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-blog-lists
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/coverage-62%25-yellow
[coverage-url]: #test-coverage
