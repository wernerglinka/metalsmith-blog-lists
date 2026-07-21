# Theory of Operation

This document explains how `metalsmith-blog-lists` works and why it is built
the way it is. The README covers usage; this covers design.

## Problem

Blog widgets — "latest posts", "featured posts", a full archive, a
year-by-year list — all need the same underlying data: the set of blog posts
with a small, normalized shape (title, date, path, author, excerpt, image,
featured flag/order). Computing those lists inside templates is repetitive and
fragile, and pagination makes it worse: a paginated page only holds a slice of
posts, so a template on that page cannot see the whole set. This plugin builds
the lists once, from the complete files object, and puts them in global
metadata where any template can read them.

## Approach

The plugin runs as a metadata producer, not a file transformer: it reads post
frontmatter and writes four arrays into `metalsmith.metadata()`, leaving file
contents untouched. During a single pass over `files` it collects every file
that lives in the configured blog directory, builds a normalized post object
for each, and separately tracks the ones flagged featured. After the pass it
derives the four published collections:

- `allSortedBlogPosts` — every post, sorted by date (oldest first).
- `latestBlogPosts` — newest first, truncated to `latestQuantity`.
- `featuredBlogPosts` — featured posts ordered by their `featuredBlogpostOrder`,
  applying `featuredPostOrder` (asc/desc), truncated to `featuredQuantity`.
- `annualizedBlogPosts` — posts grouped by year, newest year first.

The work is split into single-purpose helpers under `src/utils/`: `config`
(option normalization), `blogProperty` (reading a property with optional
nested-object fallback, and path derivation), `sorting` (by date, order,
year), and `collections` (post-object construction, year extraction,
annualization, blog-directory test). This keeps each concern independently
testable and keeps `index.js` a readable pipeline.

## Key decisions

- **Global metadata, not file metadata.** Because the lists must be visible
  from any page — including paginated pages that hold only a slice of posts —
  they go into `metalsmith.metadata()`, read once and set back after
  mutation.
- **`blogObject` fallback.** Sites organize frontmatter differently. When
  `blogObject` names a nested object (e.g. `blog`), the plugin reads a property
  from there first and falls back to the top-level property, so both flat and
  nested frontmatter work without a separate code path.
- **`usePermalinks` path shaping.** Paths are derived to match the site's URL
  strategy: extension stripped for permalink-style URLs, `.md`→`.html` and
  `/index` collapsed otherwise, so `post.path` is directly usable in `href`.

## Invariants and failure modes

- **Reads frontmatter, not contents.** The plugin never touches
  `file.contents`, so it is safe to run before or after content transforms as
  long as frontmatter is present.
- **Options are copied, not mutated.** Defaults are merged into a fresh object
  via `normalizeOptions`; the caller's options object is never mutated.
- **Metadata is read-modify-write.** The four arrays are assigned onto the
  object returned by `metalsmith.metadata()` and written back, so the plugin
  composes with other metadata producers rather than clobbering them.
- **Ordering is explicit.** Sorting is done by dedicated comparators; a missing
  `featuredBlogpostOrder` sorts as if zero rather than throwing.
