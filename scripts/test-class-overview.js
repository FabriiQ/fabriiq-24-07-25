#!/usr/bin/env node

/**
 * Comprehensive test runner for Teacher Class Overview functionality
 * This script runs all tests related to the class overview feature
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test configuration
const testConfig = {
  unit: {
    name: 'Unit Tests',
    command: 'npm run test -- src/components/teacher/classes/__tests__/ClassOverview.test.tsx',
    description: 'Component unit tests with mocked dependencies',
  },
  integration: {
    name: 'Integration Tests',
    command: 'npm run test -- src/server/api/routers/__tests__/teacher-class-overview.test.ts',
    description: 'API endpoint integration tests',
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npx playwright test src/__tests__/e2e/teacher-class-overview.spec.ts',
    description: 'Full user workflow tests',
  },
  performance: {
    name: 'Performance Tests',
    command: 'npm run test -- src/__tests__/performance/class-overview-performance.test.ts',
    description: 'Performance and load testing',
  },
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  return fs.existsSync(fullPath);
}

function runCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    log(`Command: ${command}`, 'magenta');
    
    const output = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 300000, // 5 minutes timeout
    });
    
    logSuccess(`${description} completed successfully`);
    return { success: true, output };
  } catch (error) {
    logError(`${description} failed`);
    log(`Error: ${error.message}`, 'red');
    if (error.stdout) {
      log('STDOUT:', 'yellow');
      log(error.stdout, 'reset');
    }
    if (error.stderr) {
      log('STDERR:', 'yellow');
      log(error.stderr, 'reset');
    }
    return { success: false, error: error.message };
  }
}

function validateTestFiles() {
  logHeader('Validating Test Files');
  
  const testFiles = [
    'src/components/teacher/classes/__tests__/ClassOverview.test.tsx',
    'src/server/api/routers/__tests__/teacher-class-overview.test.ts',
    'src/__tests__/e2e/teacher-class-overview.spec.ts',
    'src/__tests__/performance/class-overview-performance.test.ts',
  ];
  
  let allFilesExist = true;
  
  testFiles.forEach(file => {
    if (checkFileExists(file)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function runTestSuite(testType, config) {
  logHeader(`${config.name} - ${config.description}`);
  
  const result = runCommand(config.command, config.name);
  
  if (result.success) {
    logSuccess(`${config.name} passed`);
    
    // Parse test results if available
    if (result.output.includes('Tests:') || result.output.includes('test')) {
      const lines = result.output.split('\n');
      const summaryLine = lines.find(line => 
        line.includes('passed') || line.includes('failed') || line.includes('Tests:')
      );
      if (summaryLine) {
        logInfo(`Summary: ${summaryLine.trim()}`);
      }
    }
  } else {
    logError(`${config.name} failed`);
  }
  
  return result.success;
}

function generateTestReport(results) {
  logHeader('Test Report Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Test Suites: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    logSuccess('All tests passed! 🎉');
    log('\nThe Teacher Class Overview feature is ready for production.', 'green');
  } else {
    logError('Some tests failed. Please review the errors above.');
    log('\nPlease fix the failing tests before deploying to production.', 'red');
  }
  
  // Detailed breakdown
  log('\nDetailed Results:', 'bright');
  Object.entries(results).forEach(([testType, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${testConfig[testType].name}: ${status}`, color);
  });
}

function checkPrerequisites() {
  logHeader('Checking Prerequisites');
  
  // Check if npm is available
  try {
    execSync('npm --version', { stdio: 'pipe' });
    logSuccess('npm is available');
  } catch (error) {
    logError('npm is not available');
    return false;
  }
  
  // Check if playwright is installed (for e2e tests)
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    logSuccess('Playwright is available');
  } catch (error) {
    logWarning('Playwright is not available - E2E tests will be skipped');
  }
  
  // Check if test dependencies are installed
  const packageJsonPath = path.resolve('package.json');
  if (checkFileExists(packageJsonPath)) {
    logSuccess('package.json found');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasJest = packageJson.devDependencies?.jest || packageJson.dependencies?.jest;
      const hasTestingLibrary = packageJson.devDependencies?.['@testing-library/react'];
      
      if (hasJest) logSuccess('Jest is configured');
      else logWarning('Jest not found in dependencies');
      
      if (hasTestingLibrary) logSuccess('Testing Library is configured');
      else logWarning('Testing Library not found in dependencies');
      
    } catch (error) {
      logWarning('Could not parse package.json');
    }
  } else {
    logError('package.json not found');
    return false;
  }
  
  return true;
}

async function main() {
  logHeader('Teacher Class Overview - Comprehensive Test Suite');
  log('This script will run all tests for the Teacher Class Overview feature', 'blue');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    logError('Prerequisites check failed. Please install required dependencies.');
    process.exit(1);
  }
  
  // Validate test files exist
  if (!validateTestFiles()) {
    logError('Some test files are missing. Please ensure all test files are created.');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const testTypes = args.length > 0 ? args : Object.keys(testConfig);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('\nUsage: node scripts/test-class-overview.js [test-types...]', 'bright');
    log('\nAvailable test types:', 'bright');
    Object.entries(testConfig).forEach(([key, config]) => {
      log(`  ${key}: ${config.description}`, 'cyan');
    });
    log('\nExamples:', 'bright');
    log('  node scripts/test-class-overview.js unit', 'cyan');
    log('  node scripts/test-class-overview.js unit integration', 'cyan');
    log('  node scripts/test-class-overview.js (runs all tests)', 'cyan');
    process.exit(0);
  }
  
  // Run tests
  const results = {};
  
  for (const testType of testTypes) {
    if (!testConfig[testType]) {
      logWarning(`Unknown test type: ${testType}. Skipping.`);
      continue;
    }
    
    results[testType] = runTestSuite(testType, testConfig[testType]);
    
    // Add a small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate report
  generateTestReport(results);
  
  // Exit with appropriate code
  const allPassed = Object.values(results).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});
