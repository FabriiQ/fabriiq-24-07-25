/**
 * Background Jobs Management Script
 * 
 * This script helps manage background jobs and prevent scheduling conflicts.
 * 
 * Usage:
 * - node scripts/manage-background-jobs.js status
 * - node scripts/manage-background-jobs.js stop-all
 * - node scripts/manage-background-jobs.js restart
 * - node scripts/manage-background-jobs.js clear-locks
 */

const { PrismaClient } = require('@prisma/client');

class BackgroundJobManager {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getJobStatus() {
    try {
      console.log('📊 Background Jobs Status:');
      console.log('='.repeat(50));

      // Check if job system is running
      const runningJobs = global.backgroundJobSystem?.getRunningJobs?.() || [];
      
      if (runningJobs.length === 0) {
        console.log('✅ No jobs currently running');
      } else {
        console.log(`⚠️  ${runningJobs.length} jobs currently running:`);
        runningJobs.forEach(job => {
          console.log(`   - ${job.id}: ${job.name}`);
        });
      }

      // Check for stuck jobs (running for more than expected time)
      const stuckJobs = runningJobs.filter(job => {
        const runTime = Date.now() - job.startTime;
        return runTime > (job.timeout || 30 * 60 * 1000); // Default 30 minutes
      });

      if (stuckJobs.length > 0) {
        console.log(`🚨 ${stuckJobs.length} potentially stuck jobs:`);
        stuckJobs.forEach(job => {
          const runTime = Math.floor((Date.now() - job.startTime) / 1000 / 60);
          console.log(`   - ${job.id}: running for ${runTime} minutes`);
        });
      }

      console.log('');
      console.log('📈 Job Statistics:');
      if (global.backgroundJobSystem?.getJobStats) {
        const stats = global.backgroundJobSystem.getJobStats();
        console.log(`   Total Jobs: ${stats.totalJobs}`);
        console.log(`   Running: ${stats.runningJobs}`);
        console.log(`   Completed: ${stats.completedJobs}`);
        console.log(`   Failed: ${stats.failedJobs}`);
      } else {
        console.log('   Job system not initialized');
      }

    } catch (error) {
      console.error('Error getting job status:', error);
    }
  }

  async stopAllJobs() {
    try {
      console.log('🛑 Stopping all background jobs...');

      if (global.backgroundJobSystem?.shutdown) {
        await global.backgroundJobSystem.shutdown();
        console.log('✅ Background job system shut down successfully');
      } else {
        console.log('⚠️  Background job system not found or already stopped');
      }

      // Clear any remaining timers
      if (global.backgroundJobTimers) {
        Object.values(global.backgroundJobTimers).forEach(timer => {
          clearInterval(timer);
        });
        global.backgroundJobTimers = {};
        console.log('✅ Cleared all job timers');
      }

    } catch (error) {
      console.error('Error stopping jobs:', error);
    }
  }

  async restartJobs() {
    try {
      console.log('🔄 Restarting background jobs...');

      // Stop existing jobs
      await this.stopAllJobs();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reinitialize job system
      const { initializeBackgroundJobs } = require('../src/server/jobs');
      const { jobSystem } = initializeBackgroundJobs(this.prisma);

      console.log('✅ Background jobs restarted successfully');

    } catch (error) {
      console.error('Error restarting jobs:', error);
    }
  }

  async clearLocks() {
    try {
      console.log('🔓 Clearing job locks...');

      // Clear in-memory locks
      if (global.backgroundJobSystem?.clearRunningJobs) {
        global.backgroundJobSystem.clearRunningJobs();
        console.log('✅ Cleared in-memory job locks');
      }

      // Clear any database locks if they exist
      try {
        await this.prisma.$executeRaw`
          UPDATE background_jobs 
          SET status = 'FAILED', 
              error = 'Cleared by management script',
              updated_at = CURRENT_TIMESTAMP
          WHERE status = 'PROCESSING' 
          AND started_at < NOW() - INTERVAL '1 hour'
        `;
        console.log('✅ Cleared stuck database job records');
      } catch (dbError) {
        console.log('ℹ️  No database job table found (using in-memory system)');
      }

    } catch (error) {
      console.error('Error clearing locks:', error);
    }
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const command = process.argv[2] || 'status';
  const manager = new BackgroundJobManager();

  try {
    switch (command) {
      case 'status':
        await manager.getJobStatus();
        break;
      
      case 'stop-all':
        await manager.stopAllJobs();
        break;
      
      case 'restart':
        await manager.restartJobs();
        break;
      
      case 'clear-locks':
        await manager.clearLocks();
        break;
      
      default:
        console.log('Usage: node scripts/manage-background-jobs.js [command]');
        console.log('Commands:');
        console.log('  status      - Show current job status');
        console.log('  stop-all    - Stop all running jobs');
        console.log('  restart     - Restart the job system');
        console.log('  clear-locks - Clear stuck job locks');
        break;
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  } finally {
    await manager.cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Script interrupted, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Script terminated, cleaning up...');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = BackgroundJobManager;
