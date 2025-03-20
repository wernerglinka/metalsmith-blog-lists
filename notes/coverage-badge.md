# Automating Code Coverage Badges

This document describes the implementation of an automated code coverage badge solution for Metalsmith plugins.

## Overview

We created a system to automatically update the code coverage badge in the README.md file during the release process. This ensures the badge always reflects the current test coverage of the codebase without requiring third-party services like Codecov or Coveralls.

## Implementation Details

### 1. The Coverage Badge Script

We created a script (`scripts/update-coverage-badge.js`) that:

- Runs the test suite to generate coverage data
- Extracts coverage metrics for source code files
- Updates the badge in the README.md with the current coverage percentage
- Updates the coverage table in the README.md with detailed metrics
- Integrates with the release process via a prerelease hook

### 2. Features

- **Standalone solution**: Works without any external services or GitHub organization access
- **Handles multiple source files**: Can aggregate coverage across multiple files or use summary metrics
- **Visual badge**: Uses shields.io to generate a color-coded badge based on coverage level
- **Detailed reporting**: Includes a coverage table showing statement/branch/function/line coverage
- **ESLint compliant**: Follows project code style and passes all linting rules
- **Automated**: Runs automatically before each release to ensure badge accuracy

### 3. Script Design

The script is organized into several focused functions:

- `extractCoverageFromSummary()`: Parses coverage data from the summary line
- `calculateAverageCoverage()`: Calculates average coverage across multiple files
- `determineBadgeColor()`: Selects the appropriate badge color based on coverage level
- `extractSrcFiles()`: Extracts coverage data for individual source files
- `getSrcFileLines()`: Generates the formatted table lines for detailed reporting
- `main()`: Orchestrates the overall process

### 4. Integration with Release Process

The script is integrated into the release process via package.json scripts:

```json
"update-coverage": "node scripts/update-coverage-badge.js",
"prerelease": "npm run update-coverage && git add README.md && git commit -m \"Update coverage badge in README\" || true",
```

This ensures the badge is always updated before creating a new release. The prerelease script:
1. Runs the update-coverage script
2. Automatically adds the README.md to Git staging
3. Commits the changes with a descriptive message
4. Uses `|| true` to ensure the process continues even if there's nothing to commit

This approach solves the "Working dir must be clean" error that would otherwise occur when the README is modified right before the release process checks for a clean working directory.

## Badge Format

The badge appears in the README.md as:

```markdown
[![coverage][coverage-badge]][coverage-url]
```

With the definitions:

```markdown
[coverage-badge]: https://img.shields.io/badge/coverage-100%25-brightgreen
[coverage-url]: #test-coverage
```

## Coverage Table Format

The coverage table is displayed in the README.md without code block markers for better alignment:

```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
src/**    | 100     | 96.66    | 100     | 100
```

For projects with multiple source files, individual file metrics are included below the summary line.

## Using in Other Plugins

To add this functionality to other Metalsmith plugins:

1. Copy the `scripts/update-coverage-badge.js` file
2. Add the scripts to package.json
3. Add the badge and Test Coverage section to the README.md

## Benefits

- No third-party service dependencies
- Privacy-respecting (no organization access required)
- Always accurate and up-to-date
- Fully automated as part of the release process
- Visually indicates code quality to users
- Self-contained within the repository