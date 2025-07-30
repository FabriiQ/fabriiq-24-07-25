/**
 * Load Testing Script for FabriQ Platform
 * 
 * This script simulates thousands of concurrent users to validate performance optimizations.
 * Run with: node scripts/load-test.js
 * 
 * Requirements: npm install autocannon clinic
 */

const autocannon = require('autocannon');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  duration: process.env.TEST_DURATION || 60, // seconds
  connections: process.env.TEST_CONNECTIONS || 100, // concurrent connections
  pipelining: process.env.TEST_PIPELINING || 10, // requests per connection
  
  // Authentication credentials for testing
  testUser: {
    username: process.env.TEST_USERNAME || 'test_teacher',
    password: process.env.TEST_PASSWORD || 'test_password'
  }
};

// Test scenarios
const TEST_SCENARIOS = [
  {
    name: 'Authentication Flow',
    path: '/api/auth/session',
    method: 'GET',
    weight: 20 // percentage of total requests
  },
  {
    name: 'Teacher Dashboard',
    path: '/teacher/dashboard',
    method: 'GET',
    weight: 25
  },
  {
    name: 'Teacher Classes',
    path: '/api/trpc/teacher.getTeacherClasses',
    method: 'GET',
    weight: 15
  },
  {
    name: 'Teacher Analytics',
    path: '/api/trpc/teacherAnalytics.getTeacherMetrics',
    method: 'GET',
    weight: 10
  },
  {
    name: 'Notifications',
    path: '/api/trpc/notification.getUserNotifications',
    method: 'GET',
    weight: 15
  },
  {
    name: 'Class Details',
    path: '/teacher/classes/test-class-id',
    method: 'GET',
    weight: 10
  },
  {
    name: 'System Config',
    path: '/api/trpc/systemConfig.getBranding',
    method: 'GET',
    weight: 5
  }
];

class LoadTester {
  constructor() {
    this.results = [];
    this.startTime = null;
  }

  async runTests() {
    console.log('🚀 Starting FabriQ Platform Load Tests');
    console.log(`📊 Configuration:`);
    console.log(`   Base URL: ${TEST_CONFIG.baseUrl}`);
    console.log(`   Duration: ${TEST_CONFIG.duration}s`);
    console.log(`   Connections: ${TEST_CONFIG.connections}`);
    console.log(`   Pipelining: ${TEST_CONFIG.pipelining}`);
    console.log('');

    this.startTime = performance.now();

    // Run tests for each scenario
    for (const scenario of TEST_SCENARIOS) {
      await this.runScenarioTest(scenario);
    }

    // Run comprehensive mixed load test
    await this.runMixedLoadTest();

    // Generate final report
    this.generateReport();
  }

  async runScenarioTest(scenario) {
    console.log(`🧪 Testing: ${scenario.name}`);
    
    const connections = Math.floor(TEST_CONFIG.connections * (scenario.weight / 100));
    const duration = Math.floor(TEST_CONFIG.duration * 0.3); // 30% of total duration per scenario

    const result = await autocannon({
      url: `${TEST_CONFIG.baseUrl}${scenario.path}`,
      connections: Math.max(connections, 1),
      pipelining: TEST_CONFIG.pipelining,
      duration,
      method: scenario.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FabriQ-LoadTest/1.0'
      },
      setupClient: this.setupAuthenticatedClient.bind(this)
    });

    this.results.push({
      scenario: scenario.name,
      ...this.processResults(result)
    });

    console.log(`   ✅ Completed: ${result.requests.total} requests, ${result.requests.average}req/s avg`);
    console.log(`   📈 Latency: ${result.latency.average}ms avg, ${result.latency.p99}ms p99`);
    console.log(`   ❌ Errors: ${result.errors}/${result.requests.total} (${((result.errors/result.requests.total)*100).toFixed(2)}%)`);
    console.log('');
  }

  async runMixedLoadTest() {
    console.log('🔥 Running Mixed Load Test (All Scenarios)');
    
    // Create weighted request distribution
    const requests = this.createWeightedRequests();

    const result = await autocannon({
      url: TEST_CONFIG.baseUrl,
      connections: TEST_CONFIG.connections,
      pipelining: TEST_CONFIG.pipelining,
      duration: TEST_CONFIG.duration,
      requests: requests,
      setupClient: this.setupAuthenticatedClient.bind(this)
    });

    this.results.push({
      scenario: 'Mixed Load Test',
      ...this.processResults(result)
    });

    console.log(`   ✅ Completed: ${result.requests.total} requests, ${result.requests.average}req/s avg`);
    console.log(`   📈 Latency: ${result.latency.average}ms avg, ${result.latency.p99}ms p99`);
    console.log(`   ❌ Errors: ${result.errors}/${result.requests.total} (${((result.errors/result.requests.total)*100).toFixed(2)}%)`);
    console.log('');
  }

  setupAuthenticatedClient(client) {
    // Set up authentication headers or cookies
    // This would typically involve getting a session token
    client.setHeaders({
      'Cookie': 'next-auth.session-token=test-session-token'
    });
  }

  createWeightedRequests() {
    const requests = [];
    
    TEST_SCENARIOS.forEach(scenario => {
      const count = Math.floor((scenario.weight / 100) * 100); // 100 total requests
      
      for (let i = 0; i < count; i++) {
        requests.push({
          method: scenario.method,
          path: scenario.path,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    });

    return requests;
  }

  processResults(result) {
    return {
      totalRequests: result.requests.total,
      requestsPerSecond: result.requests.average,
      latencyAvg: result.latency.average,
      latencyP50: result.latency.p50,
      latencyP95: result.latency.p95,
      latencyP99: result.latency.p99,
      errors: result.errors,
      errorRate: (result.errors / result.requests.total) * 100,
      throughput: result.throughput.average,
      duration: result.duration
    };
  }

  generateReport() {
    const totalTime = (performance.now() - this.startTime) / 1000;
    
    console.log('📋 LOAD TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Total Test Duration: ${totalTime.toFixed(2)}s`);
    console.log('');

    // Performance summary
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const avgLatency = this.results.reduce((sum, r) => sum + r.latencyAvg, 0) / this.results.length;
    const maxP99Latency = Math.max(...this.results.map(r => r.latencyP99));
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors, 0);
    const avgErrorRate = (totalErrors / totalRequests) * 100;

    console.log('📊 PERFORMANCE SUMMARY:');
    console.log(`   Total Requests: ${totalRequests.toLocaleString()}`);
    console.log(`   Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`   P99 Latency (Max): ${maxP99Latency.toFixed(2)}ms`);
    console.log(`   Error Rate: ${avgErrorRate.toFixed(2)}%`);
    console.log('');

    // Detailed results
    console.log('📈 DETAILED RESULTS:');
    this.results.forEach(result => {
      console.log(`\n${result.scenario}:`);
      console.log(`   Requests: ${result.totalRequests.toLocaleString()} (${result.requestsPerSecond.toFixed(2)}/s)`);
      console.log(`   Latency: ${result.latencyAvg.toFixed(2)}ms avg, ${result.latencyP99.toFixed(2)}ms p99`);
      console.log(`   Errors: ${result.errors} (${result.errorRate.toFixed(2)}%)`);
      console.log(`   Throughput: ${(result.throughput / 1024 / 1024).toFixed(2)} MB/s`);
    });

    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    this.assessPerformance(avgLatency, maxP99Latency, avgErrorRate);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    this.generateRecommendations(avgLatency, maxP99Latency, avgErrorRate);
  }

  assessPerformance(avgLatency, maxP99Latency, errorRate) {
    const assessments = [];

    // Latency assessment
    if (avgLatency < 200) {
      assessments.push('✅ Excellent average response time');
    } else if (avgLatency < 500) {
      assessments.push('⚠️  Good average response time');
    } else {
      assessments.push('❌ Poor average response time');
    }

    // P99 latency assessment
    if (maxP99Latency < 1000) {
      assessments.push('✅ Excellent P99 latency');
    } else if (maxP99Latency < 2000) {
      assessments.push('⚠️  Acceptable P99 latency');
    } else {
      assessments.push('❌ Poor P99 latency');
    }

    // Error rate assessment
    if (errorRate < 1) {
      assessments.push('✅ Excellent error rate');
    } else if (errorRate < 5) {
      assessments.push('⚠️  Acceptable error rate');
    } else {
      assessments.push('❌ High error rate');
    }

    assessments.forEach(assessment => console.log(`   ${assessment}`));
  }

  generateRecommendations(avgLatency, maxP99Latency, errorRate) {
    const recommendations = [];

    if (avgLatency > 500) {
      recommendations.push('• Consider increasing cache TTL values');
      recommendations.push('• Review database query optimization');
      recommendations.push('• Enable more aggressive caching');
    }

    if (maxP99Latency > 2000) {
      recommendations.push('• Implement background job processing for heavy operations');
      recommendations.push('• Add request deduplication');
      recommendations.push('• Consider database connection pooling optimization');
    }

    if (errorRate > 5) {
      recommendations.push('• Review error handling and retry logic');
      recommendations.push('• Check database connection stability');
      recommendations.push('• Implement circuit breaker pattern');
    }

    if (recommendations.length === 0) {
      recommendations.push('• Performance looks good! Consider stress testing with higher loads');
      recommendations.push('• Monitor production metrics to maintain performance');
    }

    recommendations.forEach(rec => console.log(`   ${rec}`));
  }
}

// Run the load test
if (require.main === module) {
  const tester = new LoadTester();
  tester.runTests().catch(console.error);
}

module.exports = LoadTester;
