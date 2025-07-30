#!/usr/bin/env node

/**
 * Cross-platform Memory-Optimized Build Script
 * 
 * This script runs the Next.js build with increased memory allocation
 * and works on both Windows and Unix-like systems.
 */

const { spawn } = require('child_process');

class MemoryOptimizedBuild {
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

  async runBuild() {
    this.log('Starting memory-optimized Next.js build...');
    
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
      }, 600000); // 10 minutes for memory builds

      build.on('exit', (code) => {
        clearTimeout(buildTimeout);
        
        if (code === 0) {
          this.log('Memory-optimized build completed successfully', 'success');
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
    console.log('📊 MEMORY BUILD REPORT');
    console.log('='.repeat(60));
    console.log(`Total build time: ${minutes}m ${seconds}s`);
    
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    console.log(`Final memory usage: ${memUsageMB}MB`);
    
    console.log('\n💡 MEMORY OPTIMIZATION TIPS:');
    if (duration > 600000) { // 10 minutes
      console.log('   • Build took longer than 10 minutes');
      console.log('   • Consider increasing Node.js memory limit further');
      console.log('   • Check for memory leaks in components');
    }
    
    if (memUsageMB > 3000) {
      console.log('   • Very high memory usage detected');
      console.log('   • Consider code splitting or lazy loading');
      console.log('   • Review large dependencies');
    }
    
    if (duration < 300000 && memUsageMB < 2000) { // 5 minutes, 2GB
      console.log('   ✅ Memory-optimized build performance is good!');
    }
    
    console.log('='.repeat(60));
  }

  async run() {
    try {
      console.log('🧠 FabriQ Memory-Optimized Build Process');
      console.log('==========================================\n');

      await this.checkMemory();
      
      // Run the memory-optimized build
      await this.runBuild();
      
      this.generateReport();
      
      this.log('Memory-optimized build process completed successfully!', 'success');
      process.exit(0);

    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'error');
      
      // Provide helpful error messages
      if (error.message.includes('heap out of memory')) {
        console.log('\n💡 MEMORY ERROR SOLUTIONS:');
        console.log('   • Increase Node.js memory: NODE_OPTIONS="--max-old-space-size=8192"');
        console.log('   • Close other applications to free up RAM');
        console.log('   • Try building with fewer parallel processes');
        console.log('   • Consider using a machine with more RAM');
      }
      
      this.generateReport();
      process.exit(1);
    }
  }
}

// Run the memory-optimized build
const build = new MemoryOptimizedBuild();
build.run();
