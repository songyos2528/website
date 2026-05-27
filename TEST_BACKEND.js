#!/usr/bin/env node

/**
 * Backend Test Script
 * Starts the backend server locally and runs a series of tests
 * Use this to verify everything works before deploying to production
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`);
}

function success(msg) { log(colors.green, '✓', msg); }
function error(msg) { log(colors.red, '✗', msg); }
function info(msg) { log(colors.blue, 'ℹ', msg); }
function warn(msg) { log(colors.yellow, '⚠', msg); }
function test(msg) { log(colors.cyan, '→', msg); }

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  log(colors.cyan, '\n═══════════════════════════════════════════');
  log(colors.cyan, '  Website Backend Test Suite');
  log(colors.cyan, '═══════════════════════════════════════════\n');

  // Start the server
  info('Starting backend server...');
  const server = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'api'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  let testsPassed = 0;
  let testsFailed = 0;

  const tests = [
    {
      name: 'GET /api/projects',
      path: '/api/projects',
      check: (data) => {
        const projects = JSON.parse(data);
        return Array.isArray(projects) && projects.length > 0;
      }
    },
    {
      name: 'GET /api/projects/1',
      path: '/api/projects/1',
      check: (data) => {
        const project = JSON.parse(data);
        return project.id && project.title;
      }
    },
    {
      name: 'GET /api/reviews',
      path: '/api/reviews',
      check: (data) => {
        const reviews = JSON.parse(data);
        return Array.isArray(reviews);
      }
    },
    {
      name: 'GET /api/services',
      path: '/api/services',
      check: (data) => {
        const services = JSON.parse(data);
        return Array.isArray(services) && services.length > 0;
      }
    },
    {
      name: 'GET /api/calculator/types',
      path: '/api/calculator/types',
      check: (data) => {
        const types = JSON.parse(data);
        return Array.isArray(types) && types.length > 0;
      }
    },
    {
      name: 'GET /api/admin/check (not authenticated)',
      path: '/api/admin/check',
      check: (data) => {
        return data.includes('error') || data.includes('Unauthorized');
      }
    }
  ];

  log(colors.blue, '\nRunning API Tests:\n');

  for (const testCase of tests) {
    test(`Testing ${testCase.name}...`);
    try {
      const { status, data } = await makeRequest(testCase.path);

      if (status === 200 || status === 401) {
        if (testCase.check(data)) {
          success(`${testCase.name} - Response valid`);
          testsPassed++;
        } else {
          error(`${testCase.name} - Response format invalid`);
          testsFailed++;
        }
      } else {
        error(`${testCase.name} - HTTP ${status}`);
        testsFailed++;
      }
    } catch (err) {
      error(`${testCase.name} - ${err.message}`);
      testsFailed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Stop the server
  server.kill('SIGTERM');

  // Print results
  log(colors.cyan, '\n═══════════════════════════════════════════');
  log(colors.cyan, '  Test Results');
  log(colors.cyan, '═══════════════════════════════════════════\n');

  success(`${testsPassed} tests passed`);
  if (testsFailed > 0) {
    error(`${testsFailed} tests failed`);
  }

  log(colors.blue, '\n📊 Summary:\n');

  if (testsFailed === 0) {
    success('All tests passed! Backend is ready for deployment.');
    log(colors.green, '\n✓ Backend is working correctly');
    log(colors.green, '✓ All API endpoints are responding');
    log(colors.green, '✓ Data is properly formatted');
    log(colors.green, '\nYou can now deploy using one of these options:');
    log(colors.green, '  1. Glitch: https://glitch.com/import/github/songyos2528/website');
    log(colors.green, '  2. Vercel: https://vercel.com/import/project?repo=https://github.com/songyos2528/website');
    log(colors.green, '  3. Railway: https://railway.app/');
    process.exit(0);
  } else {
    error(`Backend has issues. Check the errors above.`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(err => {
  error(`Test suite failed: ${err.message}`);
  process.exit(1);
});
