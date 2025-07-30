/**
 * Health Check API Route
 * 
 * This endpoint provides basic health status and can help diagnose server issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { logger } from '@/server/api/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connection
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1 as test`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'healthy';
    } catch (dbError) {
      dbStatus = 'error';
      logger.error('Database health check failed', { error: String(dbError) });
    }

    // Test cache system
    let cacheStatus = 'unknown';
    try {
      const { AdvancedProcedureCache } = await import('@/server/api/cache/advanced-procedure-cache');
      const stats = AdvancedProcedureCache.getStats();
      cacheStatus = 'healthy';
    } catch (cacheError) {
      cacheStatus = 'error';
      logger.error('Cache system health check failed', { error: String(cacheError) });
    }

    // Test background jobs
    let jobsStatus = 'unknown';
    let jobsInfo = {};
    try {
      if (global.backgroundJobSystem?.getJobStats) {
        jobsInfo = global.backgroundJobSystem.getJobStats();
        jobsStatus = 'healthy';
      } else {
        jobsStatus = 'not_initialized';
      }
    } catch (jobsError) {
      jobsStatus = 'error';
      logger.error('Background jobs health check failed', { error: String(jobsError) });
    }

    const totalResponseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: totalResponseTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        cache: {
          status: cacheStatus
        },
        backgroundJobs: {
          status: jobsStatus,
          ...jobsInfo
        }
      },
      
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      }
    };

    // Determine overall status
    const hasErrors = [dbStatus, cacheStatus, jobsStatus].some(status => status === 'error');
    if (hasErrors) {
      healthData.status = 'degraded';
    }

    const statusCode = hasErrors ? 503 : 200;

    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    logger.error('Health check endpoint failed', { error: String(error) });
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
