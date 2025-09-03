#!/usr/bin/env node

/**
 * OAuth Testing and Validation Script
 * Tests OAuth configuration across different environments and devices
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// Configuration
const config = {
	development: {
		url: 'http://localhost:3000',
		expectedCallbacks: [
			'http://localhost:3000/api/auth/callback/google'
		]
	},
	production: {
		url: 'https://ydv.digital',
		expectedCallbacks: [
			'https://ydv.digital/api/auth/callback/google'
		]
	},
	ngrok: {
		url: process.env.NGROK_URL || 'https://your-ngrok-url.ngrok.io',
		expectedCallbacks: [
			`${process.env.NGROK_URL || 'https://your-ngrok-url.ngrok.io'}/api/auth/callback/google`
		]
	}
};

// Test scenarios
const testScenarios = [
	{
		name: 'Environment Variables Check',
		test: checkEnvironmentVariables
	},
	{
		name: 'OAuth Debug Endpoint',
		test: testOAuthDebugEndpoint
	},
	{
		name: 'Mobile OAuth Debug Endpoint',
		test: testMobileOAuthDebugEndpoint
	},
	{
		name: 'Cookie Configuration',
		test: testCookieConfiguration
	},
	{
		name: 'HTTPS Redirect',
		test: testHTTPSRedirect
	},
	{
		name: 'CORS Headers',
		test: testCORSHeaders
	}
];

// User agents for testing
const userAgents = {
	desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
	mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
	android: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
	webview: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.120 Mobile Safari/537.36 wv'
};

async function main() {
	console.log('🔍 OAuth Testing and Validation Script');
	console.log('=====================================\n');

	const environment = process.argv[2] || 'development';
	
	if (!config[environment]) {
		console.error(`❌ Unknown environment: ${environment}`);
		console.log('Available environments: development, production, ngrok');
		process.exit(1);
	}

	console.log(`Testing environment: ${environment}`);
	console.log(`Base URL: ${config[environment].url}\n`);

	let allTestsPassed = true;

	for (const scenario of testScenarios) {
		console.log(`🧪 Testing: ${scenario.name}`);
		try {
			const result = await scenario.test(config[environment]);
			if (result.success) {
				console.log(`✅ ${scenario.name}: PASSED`);
				if (result.details) {
					console.log(`   ${result.details}`);
				}
			} else {
				console.log(`❌ ${scenario.name}: FAILED`);
				console.log(`   ${result.error}`);
				allTestsPassed = false;
			}
		} catch (error) {
			console.log(`❌ ${scenario.name}: ERROR`);
			console.log(`   ${error.message}`);
			allTestsPassed = false;
		}
		console.log('');
	}

	// Test with different user agents
	console.log('📱 Testing with different user agents:');
	for (const [device, userAgent] of Object.entries(userAgents)) {
		try {
			const result = await testWithUserAgent(config[environment], device, userAgent);
			if (result.success) {
				console.log(`✅ ${device}: PASSED`);
			} else {
				console.log(`❌ ${device}: FAILED - ${result.error}`);
				allTestsPassed = false;
			}
		} catch (error) {
			console.log(`❌ ${device}: ERROR - ${error.message}`);
			allTestsPassed = false;
		}
	}

	console.log('\n' + '='.repeat(50));
	if (allTestsPassed) {
		console.log('🎉 All tests passed! OAuth configuration looks good.');
	} else {
		console.log('⚠️  Some tests failed. Please check the configuration.');
		process.exit(1);
	}
}

async function checkEnvironmentVariables(env) {
	const requiredVars = [
		'NEXTAUTH_URL',
		'NEXTAUTH_SECRET',
		'GOOGLE_CLIENT_ID',
		'GOOGLE_CLIENT_SECRET'
	];

	const missing = requiredVars.filter(varName => !process.env[varName]);
	
	if (missing.length > 0) {
		return {
			success: false,
			error: `Missing environment variables: ${missing.join(', ')}`
		};
	}

	return {
		success: true,
		details: 'All required environment variables are set'
	};
}

async function testOAuthDebugEndpoint(env) {
	try {
		const response = await makeRequest(`${env.url}/api/auth/debug`);
		const data = JSON.parse(response);
		
		if (data.authWorking) {
			return {
				success: true,
				details: 'OAuth debug endpoint is working'
			};
		} else {
			return {
				success: false,
				error: 'OAuth debug endpoint reports auth not working'
			};
		}
	} catch (error) {
		return {
			success: false,
			error: `Failed to reach OAuth debug endpoint: ${error.message}`
		};
	}
}

async function testMobileOAuthDebugEndpoint(env) {
	try {
		const response = await makeRequest(`${env.url}/api/auth/mobile-debug`, {
			headers: {
				'User-Agent': userAgents.mobile
			}
		});
		const data = JSON.parse(response);
		
		if (data.device && data.device.isMobile) {
			return {
				success: true,
				details: 'Mobile OAuth debug endpoint correctly detects mobile device'
			};
		} else {
			return {
				success: false,
				error: 'Mobile OAuth debug endpoint not working correctly'
			};
		}
	} catch (error) {
		return {
			success: false,
			error: `Failed to reach mobile OAuth debug endpoint: ${error.message}`
		};
	}
}

async function testCookieConfiguration(env) {
	try {
		const response = await makeRequest(`${env.url}/api/auth/debug`);
		const data = JSON.parse(response);
		
		// Check if cookies are being set
		if (data.cookies && data.cookies.nextAuthCookies && data.cookies.nextAuthCookies.length > 0) {
			return {
				success: true,
				details: 'NextAuth cookies are being set correctly'
			};
		} else {
			return {
				success: false,
				error: 'No NextAuth cookies found'
			};
		}
	} catch (error) {
		return {
			success: false,
			error: `Failed to test cookie configuration: ${error.message}`
		};
	}
}

async function testHTTPSRedirect(env) {
	if (env.url.startsWith('http://')) {
		return {
			success: true,
			details: 'Skipping HTTPS redirect test for HTTP environment'
		};
	}

	try {
		// Test HTTP to HTTPS redirect
		const httpUrl = env.url.replace('https://', 'http://');
		const response = await makeRequest(httpUrl, { followRedirects: false });
		
		if (response.includes('301') || response.includes('302')) {
			return {
				success: true,
				details: 'HTTPS redirect is working'
			};
		} else {
			return {
				success: false,
				error: 'HTTPS redirect not working'
			};
		}
	} catch (error) {
		return {
			success: false,
			error: `Failed to test HTTPS redirect: ${error.message}`
		};
	}
}

async function testCORSHeaders(env) {
	try {
		const response = await makeRequest(`${env.url}/api/auth/debug`, {
			headers: {
				'Origin': 'https://example.com'
			}
		});
		
		// Check if CORS headers are present
		if (response.includes('Access-Control-Allow-Origin')) {
			return {
				success: true,
				details: 'CORS headers are configured'
			};
		} else {
			return {
				success: false,
				error: 'CORS headers not found'
			};
		}
	} catch (error) {
		return {
			success: false,
			error: `Failed to test CORS headers: ${error.message}`
		};
	}
}

async function testWithUserAgent(env, device, userAgent) {
	try {
		const response = await makeRequest(`${env.url}/api/auth/mobile-debug`, {
			headers: {
				'User-Agent': userAgent
			}
		});
		const data = JSON.parse(response);
		
		// Verify device detection
		const expectedMobile = device !== 'desktop';
		if (data.device.isMobile === expectedMobile) {
			return {
				success: true,
				details: `Device detection working for ${device}`
			};
		} else {
			return {
				success: false,
				error: `Device detection failed for ${device}`
			};
		}
	} catch (error) {
		return {
			success: false,
			error: `Failed to test ${device}: ${error.message}`
		};
	}
}

function makeRequest(url, options = {}) {
	return new Promise((resolve, reject) => {
		const isHttps = url.startsWith('https://');
		const client = isHttps ? https : http;
		
		const requestOptions = {
			method: 'GET',
			headers: {
				'User-Agent': 'OAuth-Test-Script/1.0',
				...options.headers
			},
			...options
		};

		const req = client.request(url, requestOptions, (res) => {
			let data = '';
			
			res.on('data', (chunk) => {
				data += chunk;
			});
			
			res.on('end', () => {
				if (options.followRedirects !== false && (res.statusCode === 301 || res.statusCode === 302)) {
					const location = res.headers.location;
					if (location) {
						makeRequest(location, options).then(resolve).catch(reject);
						return;
					}
				}
				resolve(data);
			});
		});

		req.on('error', reject);
		req.end();
	});
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	config,
	testScenarios,
	userAgents
};
