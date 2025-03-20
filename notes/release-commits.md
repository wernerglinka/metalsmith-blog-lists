# Managing Release Commits

This document outlines the strategy for managing which commits appear in release notes.

## Overview

Release notes should focus on meaningful changes that users should know about. Maintenance, documentation, and other routine commits should be excluded to keep release notes clean and relevant.

## Configuration

In `.release-it.json`, we use the `ignore-commit-pattern` parameter to specify which commits should be excluded from release notes. The pattern is applied in two places:

```json
"after:bump": "auto-changelog -p --commit-limit false --ignore-commit-pattern '^((dev|chore|ci|docs|build|test):|Release|Update coverage|Fix.*badge|Remove dotenv)'",

"changelog": "auto-changelog -u --commit-limit false --ignore-commit-pattern '^((dev|chore|ci|docs|build|test):|Release|Update coverage|Fix.*badge|Remove dotenv)' --stdout -t https://raw.githubusercontent.com/release-it/release-it/master/templates/changelog-compact.hbs"
```

## Excluded Commit Types

The following types of commits are excluded from release notes:

### Conventional Commit Prefixes
- `dev:` - Development-related changes
- `chore:` - Maintenance tasks, dependency updates, etc.
- `ci:` - Continuous integration changes
- `docs:` - Documentation-only changes
- `build:` - Build system changes
- `test:` - Test-related changes

### Specific Patterns
- `Release` - Release commits themselves
- `Update coverage` - Commits related to coverage badge updates
- `Fix.*badge` - Fixes to badge display in README
- `Remove dotenv` - Dependency cleanup

## Best Practices

1. **Use conventional commit prefixes** for routine maintenance:
   ```
   chore: update dependencies
   docs: improve API documentation
   test: add more test cases
   build: fix build process
   ```

2. **Reserve unprefixed commits for user-facing changes**:
   ```
   Add support for new output format
   Fix bug in date parsing
   Improve performance of sorting algorithm
   ```

3. **Update the ignore pattern** if new categories of maintenance commits emerge over time.

## Example

Given these commits:
```
feat: add new date formatting option
chore: update dependencies
docs: add examples to README
fix: resolve issue with null values
test: increase test coverage
```

Only these would appear in release notes:
```
feat: add new date formatting option
fix: resolve issue with null values
```

## Conclusion

By using conventional commit messages and proper ignore patterns, we maintain clean, focused release notes that highlight the changes users care about while excluding routine maintenance commits.