#!/usr/bin/env node

/**
 * Fast Development Startup Script
 * 
 * This script optimizes the development environment for faster server startup
 * by creating optimized environment variables and monitoring performance.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class FastStartup {
  constructor() {
    this.startTime = Date.now();
    this.milestones = [];
  }

  logMilestone(name) {
    const elapsed = Date.now() - this.startTime;
    this.milestones.push({ name, elapsed });
    console.log(`⏱️  ${name}: ${elapsed}ms`);
  }

  async optimizeEnvironment() {
    console.log('🚀 Optimizing development environment...');
    
    // Create optimized .env.local for development
    const envContent = `# Auto-generated development optimizations
NODE_ENV=development
ENABLE_BACKGROUND_JOBS=false
ENABLE_MEMORY_MONITORING=false
ENABLE_PERFORMANCE_MONITORING=false
DEBUG_ENABLED=false
ENABLE_QUERY_LOGGING=false
NEXT_TELEMETRY_DISABLED=1
DATABASE_CONNECTION_LIMIT=3
FAST_REFRESH=true
DISABLE_VIEW_TRANSITIONS=true
NAVIGATION_TIMEOUT=3000
CACHE_TTL_USER_DATA=30000
CACHE_TTL_ANALYTICS=60000
`;

    try {
      fs.writeFileSync('.env.local', envContent);
      console.log('✅ Created optimized .env.local');
      this.logMilestone('Environment optimization');
    } catch (error) {
      console.warn('⚠️  Could not create .env.local:', error.message);
    }
  }

  async checkDependencies() {
    console.log('📦 Checking critical dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const criticalDeps = ['next', 'react', 'prisma', '@trpc/server', 'papaparse'];
    
    const missing = criticalDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missing.length > 0) {
      console.warn('⚠️  Missing dependencies:', missing.join(', '));
      return false;
    }
    
    console.log('✅ All critical dependencies found');
    this.logMilestone('Dependency check');
    return true;
  }

  async startServer() {
    console.log('🔥 Starting optimized development server...');
    
    const serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ENABLE_BACKGROUND_JOBS: 'false',
        ENABLE_MEMORY_MONITORING: 'false',
        FAST_STARTUP: 'true'
      }
    });

    // Monitor for server ready
    let serverReady = false;
    const readyTimeout = setTimeout(() => {
      if (!serverReady) {
        console.log('⚠️  Server taking longer than expected to start');
        console.log('💡 This is normal for the first startup or after dependency changes');
      }
    }, 12000); // Increased to 12 seconds for more realistic expectations

    serverProcess.on('exit', (code) => {
      clearTimeout(readyTimeout);
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    this.logMilestone('Server startup initiated');
  }

  generateReport() {
    console.log('\n📊 STARTUP PERFORMANCE REPORT');
    console.log('='.repeat(50));
    
    this.milestones.forEach((milestone, index) => {
      const prevTime = index > 0 ? this.milestones[index - 1].elapsed : 0;
      const duration = milestone.elapsed - prevTime;
      console.log(`${milestone.name}: ${milestone.elapsed}ms (+${duration}ms)`);
    });

    const totalTime = Date.now() - this.startTime;
    console.log(`\nTotal preparation time: ${totalTime}ms`);

    // Recommendations
    console.log('\n💡 OPTIMIZATION TIPS:');
    
    if (totalTime > 5000) {
      console.log('   • Consider using npm cache clean --force if startup is slow');
      console.log('   • Check for slow network connections affecting dependencies');
    }
    
    if (totalTime < 2000) {
      console.log('   ✅ Startup preparation is optimal!');
    }

    console.log('\n🎯 EXPECTED PERFORMANCE:');
    console.log('   • Server Ready: < 12 seconds (first startup)');
    console.log('   • Server Ready: < 6 seconds (subsequent startups)');
    console.log('   • Socket.IO Ready: < 15 seconds');
    console.log('   • Background Init: Disabled (development)');
  }

  async run() {
    try {
      console.log('🚀 FabriQ Fast Development Startup');
      console.log('=====================================\n');

      await this.optimizeEnvironment();
      
      const depsOk = await this.checkDependencies();
      if (!depsOk) {
        console.log('\n❌ Please install missing dependencies first:');
        console.log('   npm install');
        process.exit(1);
      }

      this.generateReport();
      
      console.log('\n🔥 Starting server with optimizations...\n');
      await this.startServer();

    } catch (error) {
      console.error('❌ Startup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the fast startup
const fastStartup = new FastStartup();
fastStartup.run();
