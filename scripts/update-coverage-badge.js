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
    
    // Extract all src file coverage lines
    // First look for the src directory summary line
    const srcSummaryRegex = /\s+src\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|/;
    const srcSummaryMatch = testOutput.match(srcSummaryRegex);
    
    let srcCoverage;
    
    // If summary line exists, use it
    if (srcSummaryMatch) {
      console.log('Found src directory summary line');
      srcCoverage = {
        statements: parseFloat(srcSummaryMatch[1]),
        branches: parseFloat(srcSummaryMatch[2]),
        functions: parseFloat(srcSummaryMatch[3]),
        lines: parseFloat(srcSummaryMatch[4])
      };
    } else {
      // If no summary line, find all individual src files and calculate average
      console.log('No src directory summary line found, calculating from individual files');
      const srcFileRegex = /\s+src\/[\w\/.-]+\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|/g;
      let match;
      const srcFiles = [];
      
      while ((match = srcFileRegex.exec(testOutput)) !== null) {
        srcFiles.push({
          statements: parseFloat(match[1]),
          branches: parseFloat(match[2]),
          functions: parseFloat(match[3]),
          lines: parseFloat(match[4])
        });
      }
      
      if (srcFiles.length === 0) {
        console.error('Could not find src coverage data in test output');
        console.log('Test output:', testOutput);
        process.exit(1);
      }
      
      console.log(`Found ${srcFiles.length} source files`);
      
      // Calculate average coverage across all src files
      srcCoverage = srcFiles.reduce((acc, file) => {
        return {
          statements: acc.statements + file.statements,
          branches: acc.branches + file.branches,
          functions: acc.functions + file.functions,
          lines: acc.lines + file.lines
        };
      }, { statements: 0, branches: 0, functions: 0, lines: 0 });
      
      srcCoverage.statements = parseFloat((srcCoverage.statements / srcFiles.length).toFixed(2));
      srcCoverage.branches = parseFloat((srcCoverage.branches / srcFiles.length).toFixed(2));
      srcCoverage.functions = parseFloat((srcCoverage.functions / srcFiles.length).toFixed(2));
      srcCoverage.lines = parseFloat((srcCoverage.lines / srcFiles.length).toFixed(2));
    }
    
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
    
    // Collect information about all individual src files if they exist
    const srcFileRegex = /\s+src\/[\w\/.-]+\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|/g;
    
    // Build an array of all src file coverage data from test output
    const srcFilesData = [];
    let fileMatch;
    let srcFileLines = '';
    
    // Reset regex last index
    srcFileRegex.lastIndex = 0;
    
    while ((fileMatch = srcFileRegex.exec(testOutput)) !== null) {
      // Get the file path - extract it from the whole match
      const fileLine = fileMatch[0];
      const filePathMatch = fileLine.match(/\s+(src\/[\w\/.-]+)\s+\|/);
      const filePath = filePathMatch ? filePathMatch[1] : 'unknown';
      
      srcFilesData.push({
        path: filePath,
        statements: fileMatch[1],
        branches: fileMatch[2],
        functions: fileMatch[3],
        lines: fileMatch[4]
      });
      
      // Add file to report lines
      srcFileLines += `${filePath.padEnd(10)} | ${fileMatch[1].padEnd(8)} | ${fileMatch[2].padEnd(9)} | ${fileMatch[3].padEnd(8)} | ${fileMatch[4]}\n`;
    }
    
    // Update coverage report table
    const reportPattern = /File\s+\|\s+% Stmts\s+\|\s+% Branch\s+\|\s+% Funcs\s+\|\s+% Lines\n[-|]+\s+\nsrc(?:\/\*\*)?\s+\|\s+\d+(?:\.\d+)?\s+\|\s+\d+(?:\.\d+)?\s+\|\s+\d+(?:\.\d+)?\s+\|\s+\d+(?:\.\d+)?/;
    
    // Create the report content
    let newReport = `File      | % Stmts | % Branch | % Funcs | % Lines\n----------|---------|----------|---------|--------\nsrc/**    | ${srcCoverage.statements} | ${srcCoverage.branches} | ${srcCoverage.functions} | ${srcCoverage.lines}`;
    
    // Add individual file details if we have them and there's more than one
    if (srcFilesData.length > 1) {
      newReport += srcFileLines;
    }
    
    if (reportPattern.test(updatedReadme)) {
      updatedReadme = updatedReadme.replace(reportPattern, newReport);
    } else {
      // Try an alternative pattern that might match
      const altReportPattern = /(?:```)?[\s\S]*?File[\s\S]*?[-|]+[\s\S]*?src[\s\S]*?(?:```)?/;
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