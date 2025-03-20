#!/usr/bin/env node

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function main() {
  try {
    console.log('Updating coverage badge in README.md...');
    
    // Run tests to generate coverage data and capture the output
    console.log('Running tests to generate coverage data...');
    const testOutput = execSync('npm test', { encoding: 'utf-8' });
    
    // Look specifically for the standalone src directory line (not node_modules/debug/src)
    const srcLineRegex = /\s+src\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|/;
    const srcCoverageMatch = testOutput.match(srcLineRegex);
    
    if (!srcCoverageMatch) {
      console.error('Could not find src coverage data in test output');
      console.log('Test output:', testOutput);
      process.exit(1);
    }
    
    const srcCoverage = {
      statements: parseFloat(srcCoverageMatch[1]),
      branches: parseFloat(srcCoverageMatch[2]),
      functions: parseFloat(srcCoverageMatch[3]),
      lines: parseFloat(srcCoverageMatch[4])
    };
    
    // Determine overall coverage percentage (using line coverage)
    const coveragePercentage = Math.round(srcCoverage.lines);
    console.log(`Source code coverage: ${coveragePercentage}%`);
    
    // Determine badge color based on coverage percentage
    let badgeColor = 'red';
    if (coveragePercentage >= 90) {
      badgeColor = 'brightgreen';
    } else if (coveragePercentage >= 80) {
      badgeColor = 'green';
    } else if (coveragePercentage >= 70) {
      badgeColor = 'yellowgreen';
    } else if (coveragePercentage >= 60) {
      badgeColor = 'yellow';
    } else if (coveragePercentage >= 50) {
      badgeColor = 'orange';
    }
    
    // Read README.md
    const readmePath = path.join(rootDir, 'README.md');
    const readme = await fs.readFile(readmePath, 'utf-8');
    
    // Update coverage badge
    const badgePattern = /\[coverage-badge\]: https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-[a-z]+/;
    const newBadge = `[coverage-badge]: https://img.shields.io/badge/coverage-${coveragePercentage}%25-${badgeColor}`;
    
    let updatedReadme = readme;
    if (badgePattern.test(readme)) {
      updatedReadme = readme.replace(badgePattern, newBadge);
    } else {
      console.error('Could not find coverage badge in README.md');
      process.exit(1);
    }
    
    // Update coverage report table
    const reportPattern = /```\nFile\s+\|\s+% Stmts\s+\|\s+% Branch\s+\|\s+% Funcs\s+\|\s+% Lines\n[-|]+\s+\nsrc\s+\|\s+\d+(?:\.\d+)?\s+\|\s+\d+(?:\.\d+)?\s+\|\s+\d+(?:\.\d+)?\s+\|\s+\d+(?:\.\d+)?\n```/;
    const newReport = `\`\`\`\nFile      | % Stmts | % Branch | % Funcs | % Lines\n----------|---------|----------|---------|--------\nsrc       | ${srcCoverage.statements} | ${srcCoverage.branches} | ${srcCoverage.functions} | ${srcCoverage.lines}\n\`\`\``;
    
    if (reportPattern.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(reportPattern, newReport);
    } else {
      // Try an alternative pattern that might match
      const altReportPattern = /```[\s\S]*?File[\s\S]*?src[\s\S]*?```/;
      if (altReportPattern.test(updatedReadme)) {
        updatedReadme = updatedReadme.replace(altReportPattern, newReport);
        console.log('Updated coverage report table using alternative pattern');
      } else {
        console.warn('Could not find coverage report table in README.md, skipping update');
      }
    }
    
    // Write updated README.md
    await fs.writeFile(readmePath, updatedReadme, 'utf-8');
    console.log('Updated README.md with current coverage information');
    
  } catch (error) {
    console.error('Error updating coverage badge:', error);
    process.exit(1);
  }
}

main();