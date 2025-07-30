/**
 * tRPC Endpoints Testing Script
 *
 * This script tests tRPC endpoints to diagnose JSON parsing errors.
 * Run with: node scripts/test-trpc-endpoints.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test endpoints that are failing
const TEST_ENDPOINTS = [
  'systemConfig.getBranding',
  'notification.getUserNotifications',
  'analytics.getTeacherStats',
  'teacherLeaderboard.getTeacherLeaderboard',
  'teacherAnalytics.getTeacherMetrics',
  'teacher.getTeacherClasses'
];

class TRPCTester {
  constructor() {
    this.sessionCookie = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Attempting to authenticate...');
      
      // First, get the login page to see if it's accessible
      const loginResponse = await fetch(`${BASE_URL}/login`);
      console.log(`Login page status: ${loginResponse.status}`);
      
      if (loginResponse.status !== 200) {
        console.error('❌ Cannot access login page');
        return false;
      }

      // Try to get session info
      const sessionResponse = await fetch(`${BASE_URL}/api/auth/session`);
      console.log(`Session endpoint status: ${sessionResponse.status}`);
      
      const sessionText = await sessionResponse.text();
      console.log(`Session response preview: ${sessionText.substring(0, 200)}...`);
      
      if (sessionResponse.headers.get('content-type')?.includes('application/json')) {
        const sessionData = JSON.parse(sessionText);
        if (sessionData.user) {
          console.log('✅ Already authenticated');
          return true;
        }
      }

      console.log('⚠️  No active session found');
      return false;
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      return false;
    }
  }

  async testEndpoint(endpoint) {
    try {
      console.log(`\n🧪 Testing: ${endpoint}`);
      
      // Create tRPC URL
      const tRPCUrl = `${BASE_URL}/api/trpc/${endpoint}?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D`;
      
      console.log(`URL: ${tRPCUrl}`);
      
      const response = await fetch(tRPCUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        }
      });

      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      const responseText = await response.text();
      console.log(`Response length: ${responseText.length} characters`);
      console.log(`Response preview: ${responseText.substring(0, 300)}...`);

      // Check if response is HTML (indicating an error page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.log('❌ Received HTML instead of JSON - likely a server error or routing issue');
        
        // Try to extract error information from HTML
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          console.log(`HTML Title: ${titleMatch[1]}`);
        }
        
        return {
          success: false,
          error: 'HTML_RESPONSE',
          details: 'Received HTML instead of JSON'
        };
      }

      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✅ Valid JSON response');
        
        if (jsonData.error) {
          console.log(`❌ tRPC Error: ${jsonData.error.message || 'Unknown error'}`);
          return {
            success: false,
            error: 'TRPC_ERROR',
            details: jsonData.error
          };
        }
        
        return {
          success: true,
          data: jsonData
        };
      } catch (parseError) {
        console.log('❌ JSON parsing failed:', parseError.message);
        return {
          success: false,
          error: 'JSON_PARSE_ERROR',
          details: parseError.message
        };
      }

    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error.message);
      return {
        success: false,
        error: 'REQUEST_FAILED',
        details: error.message
      };
    }
  }

  async testAllEndpoints() {
    console.log('🚀 Starting tRPC Endpoints Test');
    console.log('='.repeat(50));

    // Test authentication first
    const isAuthenticated = await this.authenticate();
    
    const results = [];

    for (const endpoint of TEST_ENDPOINTS) {
      const result = await this.testEndpoint(endpoint);
      results.push({
        endpoint,
        ...result
      });
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate report
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);

    if (failed.length > 0) {
      console.log('\n❌ FAILED ENDPOINTS:');
      failed.forEach(result => {
        console.log(`   - ${result.endpoint}: ${result.error} - ${result.details}`);
      });
    }

    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL ENDPOINTS:');
      successful.forEach(result => {
        console.log(`   - ${result.endpoint}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    const htmlResponses = failed.filter(r => r.error === 'HTML_RESPONSE');
    if (htmlResponses.length > 0) {
      console.log('   • HTML responses indicate server errors or routing issues');
      console.log('   • Check server logs for detailed error information');
      console.log('   • Verify tRPC router configuration and imports');
    }

    const authErrors = failed.filter(r => r.details?.includes?.('UNAUTHORIZED'));
    if (authErrors.length > 0) {
      console.log('   • Authentication errors detected');
      console.log('   • Ensure user is logged in and session is valid');
    }

    if (!isAuthenticated) {
      console.log('   • No active session - many endpoints will fail');
      console.log('   • Try logging in through the web interface first');
    }

    return results;
  }
}

// Run the test
if (require.main === module) {
  const tester = new TRPCTester();
  tester.testAllEndpoints().catch(console.error);
}

module.exports = TRPCTester;
