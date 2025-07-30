/**
 * Fast Development Server Startup Script
 * 
 * This script helps identify and optimize slow startup processes.
 * Run with: node scripts/fast-dev-start.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FastDevStarter {
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
DATABASE_CONNECTION_LIMIT=5
FAST_REFRESH=true
`;

    try {
      fs.writeFileSync('.env.local', envContent);
      console.log('✅ Created optimized .env.local');
    } catch (error) {
      console.warn('⚠️  Could not create .env.local:', error.message);
    }
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['next', 'react', 'prisma', '@trpc/server'];
    
    const missing = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missing.length > 0) {
      console.warn('⚠️  Missing dependencies:', missing.join(', '));
      return false;
    }
    
    console.log('✅ All required dependencies found');
    return true;
  }

  async startServer() {
    console.log('🔥 Starting development server with optimizations...');
    
    const serverProcess = spawn('node', ['server.js'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        ENABLE_BACKGROUND_JOBS: 'false',
        ENABLE_MEMORY_MONITORING: 'false',
        DEBUG_ENABLED: 'false',
        NEXT_TELEMETRY_DISABLED: '1'
      }
    });

    let serverReady = false;
    let initializationComplete = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output.trim());

      // Track startup milestones
      if (output.includes('Ready on http://')) {
        this.logMilestone('Server Ready');
        serverReady = true;
      }
      
      if (output.includes('Socket.IO server running')) {
        this.logMilestone('Socket.IO Ready');
      }
      
      if (output.includes('Starting server initialization')) {
        this.logMilestone('Server Initialization Started');
      }
      
      if (output.includes('Background server initialization completed')) {
        this.logMilestone('Background Initialization Complete');
        initializationComplete = true;
      }
      
      if (output.includes('Memory usage (MB)')) {
        this.logMilestone('Memory Monitoring Complete');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('ExperimentalWarning')) {
        console.error('❌ Server Error:', error.trim());
      }
    });

    serverProcess.on('close', (code) => {
      console.log(`\n📊 Server process exited with code ${code}`);
      this.generateReport();
    });

    // Monitor startup time
    setTimeout(() => {
      if (!serverReady) {
        console.warn('⚠️  Server taking longer than expected to start...');
        this.generateReport();
      }
    }, 15000); // 15 seconds

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      serverProcess.kill('SIGINT');
    });

    return serverProcess;
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
    console.log(`\nTotal startup time: ${totalTime}ms`);

    // Recommendations
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
    
    if (totalTime > 10000) {
      console.log('   • Server is taking longer than 10 seconds to start');
      console.log('   • Consider disabling background jobs in development');
      console.log('   • Check for slow database connections');
    }
    
    const slowMilestones = this.milestones.filter(m => {
      const index = this.milestones.indexOf(m);
      const prevTime = index > 0 ? this.milestones[index - 1].elapsed : 0;
      return (m.elapsed - prevTime) > 3000;
    });
    
    if (slowMilestones.length > 0) {
      console.log('   • Slow initialization steps detected:');
      slowMilestones.forEach(m => {
        console.log(`     - ${m.name}`);
      });
    }

    if (totalTime < 5000) {
      console.log('   ✅ Startup time is optimal!');
    }
  }

  async run() {
    console.log('🚀 Fast Development Server Starter');
    console.log('='.repeat(50));
    
    this.logMilestone('Script Started');
    
    // Optimize environment
    await this.optimizeEnvironment();
    this.logMilestone('Environment Optimized');
    
    // Check dependencies
    const depsOk = await this.checkDependencies();
    this.logMilestone('Dependencies Checked');
    
    if (!depsOk) {
      console.error('❌ Cannot start server due to missing dependencies');
      return;
    }
    
    // Start server
    await this.startServer();
  }
}

// Run the fast dev starter
if (require.main === module) {
  const starter = new FastDevStarter();
  starter.run().catch(console.error);
}

module.exports = FastDevStarter;
