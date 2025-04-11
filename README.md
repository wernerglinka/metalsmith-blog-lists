# Metalsmith Blog Lists

A metalsmith plugin to provide various blog lists

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]


## Features
The plugin adds the following lists to the metadata to enable various blog widgets on any page.
- All Blogs
- Recent Blogs
- Featured Blogs
- Annualized Blogs List

The following properties must be defined in the frontmatter:
```yaml
  post:
    title
    excerpt
    date
    author
    image
```
`post` is the default name of the blog properties object. It may be changed by setting the `blogObject` option.

The lists may be used to show all blog posts by a particular author.

### All Blog Posts
The plugin provides array `allSortedBlogPosts`, sorted by date. It can be used when the whole list of blog posts is not available, for example, when using pagination, NOT all blog posts are available on a paginated page.

### Latest Blogs
The plugin provides array `latestBlogPosts`. The number of blog posts listed is determined by option `latestQuantity`.

### Featured Blogs
The plugin provides array `featuredBlogPosts`. Blog posts can specify, in their Frontmatter, that the post be listed and in what position of the list.

### Annualized Blogs List
The plugin provides an associative array `annualizedBlogPosts`. All blog posts are listed by their creation year.

### Nested Blog Properties
The plugin also supports getting blog properties from a nested object in your frontmatter. This is useful when you want to organize your blog-related properties under a single object. For example:

```yaml
---
title: "Page Title"  # Regular page title
blog:
  title: "Blog Post Title"  # Blog-specific title
  excerpt: "This is the blog excerpt"
  date: "2023-01-15"
  featuredBlogpost: true
  featuredBlogpostOrder: 1
---
```

To use this structure, set the `blogObject` option to the name of the nested object (e.g., `"blog"`). The plugin will first look for properties inside that object and fall back to direct properties if not found.

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
featuredBlogpost: true
featuredBlogpostOrder: <integer>
---
```

Pass `metalsmith-blog-lists` to `metalsmith.use` :

### ESM (ES Modules)

```js
import blogLists from 'metalsmith-blog-lists';

metalsmith.use(blogLists({  
  latestQuantity: 4,
  featuredQuantity: 2,
  featuredPostOrder: "desc",
  fileExtension: ".md",
  blogDirectory: "./blog",
  blogObject: ""  // For nested blog properties (e.g., thisFile.blog.title), use "blog"
}))
```

### CommonJS

```js
const blogLists = require('metalsmith-blog-lists');

metalsmith.use(blogLists({  
  latestQuantity: 4,
  featuredQuantity: 2,
  featuredPostOrder: "desc",
  fileExtension: ".md",
  blogDirectory: "./blog",
  blogObject: ""  // For nested blog properties (e.g., thisFile.blog.title), use "blog"
}))
```

## Options

| Option             | Type                  | Default       | Description                                                                                              |
|--------------------|----------------------|---------------|----------------------------------------------------------------------------------------------------------|
| latestQuantity     | Number               | 3             | The number of latest blog posts to display                                                               |
| featuredQuantity      | Number               | 3             | The number of featured blog posts to display                                                             |
| featuredPostOrder           | String               | 'desc'        | The order in which featured blog posts are displayed: "asc" or "desc"                                 |
| fileExtension      | String               | '.md'         | The file extension of blog posts                                                                         |
| blogDirectory             | String               | ./blog          | The path relative to the Metalsmith source directory containing the blog posts                               |
| blogObject             | String               | 'post'          | The name of the blog object in frontmatter for nested properties (e.g., "post" for thisFile.post.title) |
| usePermalinks      | Boolean              | true          | When true, file paths will have extensions removed (e.g., '/blog/post'). When false, .md extensions will be replaced with .html (e.g., '/blog/post.html') |

## Examples 
_Using a Nunjucks template_ 
### Display an annualized blog archive
```js
{% for theYear in annualizedBlogPosts %}
  {{theYear.year}}
  <ul>
  {% for post in theYear.posts %}
    <li>
      <a href="/{{post.path}}">{{post.title}}</a>
      <p>{{post.date}}</p>
      <p>{{post.author}}</p>
    </li>
  {% endfor %}
  </ul>
{% endfor %}
```
### Display a featured blog list
```js
<ul>
  {% for post in featuredBlogPosts %}
  <li>
    <a href="/{{post.path}}">{{post.title}}</a>
    <p>{{post.date | blogDate}}
    <p>{{post.author}}</p>
  </li>
  {% endfor%}
</ul>
```


### Options

You can pass options to metalsmith-blog-lists with the Javascript API or CLI:

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| **latestQuantity** | The number of blogposts to display in the latest posts list | `3` | No |
| **featuredQuantity** | The number of featured blogposts to display | `3` | No |
| **featuredPostOrder** | The order in which featured blogposts are displayed: `"asc"` or `"desc"` | `"desc"` | No |
| **fileExtension** | The blogpost file extension | `".md"` | No |
| **blogDirectory** | The path relative to the Metalsmith source directory containing the blog posts (e.g., `"./blog"`, `"./content/blog"`) | `"./blog"` | No |
| **blogObject** | The name of the blog object in frontmatter for nested properties (e.g., `"blog"` for `thisFile.blog.title`) | `""` | No |
| **debugEnabled** | Enable detailed debug logging | `false` | No |

> **Note:** The `blogDirectory` option now supports both root-level blogs (`"./blog"`) and subdirectory blogs (`"./content/blog"`). You should always include the relative path prefix `./`.

> **Note:** The `blogObject` option lets you work with nested blog properties in your frontmatter. When set to a non-empty string (e.g., `"blog"`), the plugin will look for properties inside that object (e.g., `thisFile.blog.title`). If not found or if `blogObject` is empty, it falls back to direct properties (e.g., `thisFile.title`).

## Debug

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
        "featuredPostOrder": "desc",
        "fileExtension": ".md",
        "blogDirectory": "./blog",
        "blogObject": ""
      }
    }
  ]
}
```

## Test Coverage

This project maintains high statement and line coverage for the source code. Coverage is verified during the release process using the c8 coverage tool.

## Author

[werner@glinka.co](https://github.com/wernerglinka)

## License

[ISC](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/metalsmith-blog-lists.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-blog-lists
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-blog-lists
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/test%20coverage-99%25-brightgreen
[coverage-url]: #test-coverage
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue
