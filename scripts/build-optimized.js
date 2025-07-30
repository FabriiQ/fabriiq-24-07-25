#!/usr/bin/env node

/**
 * Optimized Build Script
 * 
 * This script runs the build process with memory optimizations and proper error handling.
 */

const { spawn } = require('child_process');
const fs = require('fs');

class OptimizedBuild {
  constructor() {
    this.startTime = Date.now();
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

  async checkMemory() {
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    this.log(`Current memory usage: ${memUsageMB}MB`);
    
    if (memUsageMB > 1500) {
      this.log('High memory usage detected before build', 'warn');
      if (global.gc) {
        global.gc();
        this.log('Forced garbage collection');
      }
    }
  }

  async optimizeEnvironment() {
    this.log('Setting up optimized build environment...');
    
    // Set Node.js memory options
    process.env.NODE_OPTIONS = '--max-old-space-size=4096 --max-semi-space-size=256';
    
    // Disable unnecessary features during build
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    process.env.DISABLE_VIEW_TRANSITIONS = 'true';
    process.env.NODE_ENV = 'production';
    
    this.log('Environment optimized for build');
  }

  async runTypeCheck() {
    this.log('Running TypeScript type check...');

    return new Promise((resolve, reject) => {
      // Use cross-platform command for Windows compatibility
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'npx.cmd' : 'npx';

      const tsc = spawn(command, ['tsc', '--noEmit'], {
        stdio: 'inherit',
        env: process.env,
        shell: isWindows // Use shell on Windows for better compatibility
      });

      tsc.on('exit', (code) => {
        if (code === 0) {
          this.log('TypeScript check passed', 'success');
          resolve();
        } else {
          this.log('TypeScript check failed', 'error');
          reject(new Error(`TypeScript check failed with code ${code}`));
        }
      });

      tsc.on('error', (error) => {
        this.log(`TypeScript check process error: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  async runBuild() {
    this.log('Starting optimized Next.js build...');

    return new Promise((resolve, reject) => {
      // Use cross-platform command for Windows compatibility
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'npx.cmd' : 'npx';

      const build = spawn(command, ['next', 'build'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=4096 --max-semi-space-size=256',
        },
        shell: isWindows // Use shell on Windows for better compatibility
      });

      let buildTimeout;

      // Set a timeout for the build process
      buildTimeout = setTimeout(() => {
        this.log('Build taking too long, this might indicate memory issues', 'warn');
      }, 300000); // 5 minutes

      build.on('exit', (code) => {
        clearTimeout(buildTimeout);

        if (code === 0) {
          this.log('Build completed successfully', 'success');
          resolve();
        } else {
          this.log(`Build failed with code ${code}`, 'error');
          reject(new Error(`Build failed with code ${code}`));
        }
      });

      build.on('error', (error) => {
        clearTimeout(buildTimeout);
        this.log(`Build process error: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUILD REPORT');
    console.log('='.repeat(60));
    console.log(`Total build time: ${minutes}m ${seconds}s`);
    
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    console.log(`Final memory usage: ${memUsageMB}MB`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (duration > 300000) { // 5 minutes
      console.log('   • Build took longer than 5 minutes');
      console.log('   • Consider increasing Node.js memory limit');
      console.log('   • Check for memory leaks in components');
    }
    
    if (memUsageMB > 2000) {
      console.log('   • High memory usage detected');
      console.log('   • Consider code splitting or lazy loading');
    }
    
    if (duration < 180000 && memUsageMB < 1500) { // 3 minutes, 1.5GB
      console.log('   ✅ Build performance is optimal!');
    }
    
    console.log('='.repeat(60));
  }

  async run() {
    try {
      console.log('🚀 FabriQ Optimized Build Process');
      console.log('===================================\n');

      await this.checkMemory();
      await this.optimizeEnvironment();
      
      // Run type check first (faster to fail early if there are type errors)
      await this.runTypeCheck();
      
      // Run the actual build
      await this.runBuild();
      
      this.generateReport();
      
      this.log('Build process completed successfully!', 'success');
      process.exit(0);

    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      
      // Provide helpful error messages
      if (error.message.includes('heap out of memory')) {
        console.log('\n💡 MEMORY ERROR SOLUTIONS:');
        console.log('   • Increase Node.js memory: NODE_OPTIONS="--max-old-space-size=8192"');
        console.log('   • Close other applications to free up RAM');
        console.log('   • Try building with fewer parallel processes');
      }
      
      this.generateReport();
      process.exit(1);
    }
  }
}

// Run the optimized build
const build = new OptimizedBuild();
build.run();
