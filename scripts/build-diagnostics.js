#!/usr/bin/env node

/**
 * Build Diagnostics Script
 * 
 * This script performs comprehensive analysis of potential build issues
 * including missing dependencies, import errors, and configuration problems.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildDiagnostics {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'warn': '⚠️ ',
      'error': '❌',
      'success': '✅'
    }[type] || '📋';
    
    console.log(`${prefix} ${message}`);
  }

  addIssue(issue) {
    this.issues.push(issue);
    this.log(issue, 'error');
  }

  addWarning(warning) {
    this.warnings.push(warning);
    this.log(warning, 'warn');
  }

  // Check for missing dependencies based on import statements
  checkMissingDependencies() {
    this.log('Checking for missing dependencies...');
    
    const commonMissingDeps = [
      { import: 'papaparse', package: 'papaparse' },
      { import: '@types/papaparse', package: '@types/papaparse' },
      { import: 'uuid', package: 'uuid' },
      { import: '@types/uuid', package: '@types/uuid' },
      { import: 'lodash', package: 'lodash' },
      { import: '@types/lodash', package: '@types/lodash' }
    ];

    const allDeps = { ...this.packageJson.dependencies, ...this.packageJson.devDependencies };
    
    commonMissingDeps.forEach(({ import: importName, package: packageName }) => {
      if (!allDeps[packageName]) {
        // Check if it's actually used in the codebase
        try {
          const grepResult = execSync(`grep -r "from '${importName}'" src/ 2>/dev/null || true`).toString();
          if (grepResult.trim()) {
            this.addIssue(`Missing dependency: ${packageName} (used in imports)`);
          }
        } catch (error) {
          // Ignore grep errors
        }
      }
    });
  }

  // Check for @ts-ignore comments that might hide real issues
  checkTsIgnoreComments() {
    this.log('Checking for @ts-ignore comments...');
    
    try {
      const tsIgnoreFiles = execSync(`grep -r "@ts-ignore" src/ 2>/dev/null || true`).toString();
      if (tsIgnoreFiles.trim()) {
        const lines = tsIgnoreFiles.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const [file] = line.split(':');
          this.addWarning(`@ts-ignore found in: ${file}`);
        });
      }
    } catch (error) {
      // Ignore grep errors
    }
  }

  // Check for import path issues
  checkImportPaths() {
    this.log('Checking for problematic import paths...');
    
    const problematicPatterns = [
      { pattern: 'from.*@/components/ui/core/', message: 'Incorrect UI component path' },
      { pattern: 'from.*@/lib/logger', message: 'Missing logger module' },
      { pattern: 'from.*@/utils/.*', message: 'Check utils import path' }
    ];

    problematicPatterns.forEach(({ pattern, message }) => {
      try {
        const result = execSync(`grep -r "${pattern}" src/ 2>/dev/null || true`).toString();
        if (result.trim()) {
          const lines = result.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            const [file] = line.split(':');
            this.addWarning(`${message} in: ${file}`);
          });
        }
      } catch (error) {
        // Ignore grep errors
      }
    });
  }

  // Check TypeScript configuration
  checkTypeScriptConfig() {
    this.log('Checking TypeScript configuration...');
    
    if (!fs.existsSync('tsconfig.json')) {
      this.addIssue('Missing tsconfig.json file');
      return;
    }

    try {
      const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      
      // Check for common issues
      if (!tsConfig.compilerOptions) {
        this.addIssue('Missing compilerOptions in tsconfig.json');
      }
      
      if (!tsConfig.compilerOptions?.paths) {
        this.addWarning('No path mapping configured in tsconfig.json');
      }
      
      if (tsConfig.compilerOptions?.strict === false) {
        this.addWarning('TypeScript strict mode is disabled');
      }
      
    } catch (error) {
      this.addIssue(`Invalid tsconfig.json: ${error.message}`);
    }
  }

  // Check Next.js configuration
  checkNextConfig() {
    this.log('Checking Next.js configuration...');
    
    const nextConfigFiles = ['next.config.js', 'next.config.mjs'];
    const configExists = nextConfigFiles.some(file => fs.existsSync(file));
    
    if (!configExists) {
      this.addWarning('No Next.js configuration file found');
    }
  }

  // Check for circular dependencies
  checkCircularDependencies() {
    this.log('Checking for potential circular dependencies...');
    
    // This is a simplified check - in a real scenario you'd use a proper tool
    try {
      const indexFiles = execSync(`find src/ -name "index.ts" -o -name "index.tsx" 2>/dev/null || true`).toString();
      if (indexFiles.trim()) {
        const files = indexFiles.split('\n').filter(line => line.trim());
        if (files.length > 20) {
          this.addWarning(`Many index files found (${files.length}) - potential for circular dependencies`);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // Run a quick TypeScript check
  async runTypeScriptCheck() {
    this.log('Running TypeScript compilation check...');
    
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.log('TypeScript compilation: PASSED', 'success');
    } catch (error) {
      this.addIssue('TypeScript compilation failed - check console for details');
      console.log('\nTypeScript errors:');
      console.log(error.stdout?.toString() || error.message);
    }
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUILD DIAGNOSTICS REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🔍 Issues Found: ${this.issues.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ No critical issues found!');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (this.issues.length > 0) {
      console.log('   • Fix critical issues before attempting build');
      console.log('   • Run: npm install for missing dependencies');
      console.log('   • Check import paths and fix typos');
    }
    
    console.log('   • Run: npm run build to test full build');
    console.log('   • Run: npx tsc --noEmit for TypeScript check');
    console.log('   • Use: npm run lint (after fixing ESLint config)');
    
    console.log('\n' + '='.repeat(60));
  }

  async run() {
    console.log('🔍 FabriQ Build Diagnostics');
    console.log('============================\n');

    this.checkMissingDependencies();
    this.checkTsIgnoreComments();
    this.checkImportPaths();
    this.checkTypeScriptConfig();
    this.checkNextConfig();
    this.checkCircularDependencies();
    await this.runTypeScriptCheck();
    
    this.generateReport();
  }
}

// Run diagnostics
const diagnostics = new BuildDiagnostics();
diagnostics.run().catch(console.error);
