# Metalsmith Blog Lists (WIP - NO TESTS YET)

A metalsmith plugin to provide various blog lists

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]

**This plugin requires all blogposts to be located in** `/blog` **of the content directory.**

## Features
The plugin adds the following lists to the metadata so enable various blog widgets on any page.
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
The plugin provides the array `allSortedBlogPosts` sorted by date. It can be used when the whole list of blog posts is not available like when using pagination, NOT all blog posts will be available on a paginated page.

### Latest Blogs
The plugin provides the array `latestBlogPosts`. The number of blog posts listed is determined by option `latestQuantity`.

### Featured Blogs
The plugin provides the array `featuredBlogPosts`. Blog posts can specify in their Frontmatter if the post should be listed and what position it should have in the list.

### Annualized Blogs List
The plugin provides the associative array `annualizedBlogPosts*`. All blog posts are listed by their creation year.

## Installation

NPM:

```
npm install metalsmith-blog-lists
```

Yarn:

```
yarn add metalsmith-blog-lists
```

## Usage
For blogs intended to be featured, add the following fields to their frontmatter:
```yaml
---
featuredPost: true
featuredPostOrder: <integer>
___
```

Pass `metalsmith-blog-lists` to `metalsmith.use` :

```js
const blogLists = require('metalsmith-blog-lists')

metalsmith.use(blogLists({  
  latestQuantity: 4,
  featuredQuantity: 2,
  featuredPostOrder: "desc",
  fileExtension: ".md.njk"
}))
```

### Options

You can pass options to metalsmith-blog-lists with the Javascript API or CLI. The options are:
- latestQuantity: optional. The number of blogposts to display. The default is 3.
- featuredQuantity: optional. The number of featured blogposts to display. The default is 3.
- featuredPostOrder: optional. The order in which featured blogposts are displayed. The default is "desc".

### Debug

To enable debug logs, set the `DEBUG` environment variable to `metalsmith-blog-lists`:

```
DEBUG=metalsmith-blog-lists
```

### CLI usage

To use this plugin with the Metalsmith CLI, add `metalsmith-blog-lists` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "@metalsmith/metalsmith-blog-lists": {
        "latestQuantity": 4,
        "featuredQuantity": 2,
        "featuredPostOrder": "desc"
      }
    }
  ]
}
```

## Author

[werner@glinka.co](https://github.com/wernerglinka)

## License

[ISC](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/wernerglinka/metalsmith-blog-lists.svg
[npm-url]: https://www.npmjs.com/package/wernerglinka/metalsmith-blog-lists
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-blog-lists
[license-url]: LICENSE
