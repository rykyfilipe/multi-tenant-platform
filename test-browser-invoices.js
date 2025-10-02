const puppeteer = require('puppeteer');

async function testBrowserInvoices() {
    console.log('🌐 Starting browser test for invoice page...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Listen to console logs
        page.on('console', msg => {
            if (msg.type() === 'log' && msg.text().includes('GET invoices')) {
                console.log('🔍 Browser console:', msg.text());
            }
        });
        
        // Listen to network requests
        page.on('response', response => {
            if (response.url().includes('/api/tenants/2/invoices')) {
                console.log('📡 API Response:', response.status(), response.url());
                response.text().then(text => {
                    console.log('📄 Response body:', text);
                });
            }
        });
        
        console.log('🔐 Navigating to login page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Wait for login modal or form
        await page.waitForSelector('input[type="email"], [data-testid="email-input"], .auth-modal', { timeout: 10000 });
        
        console.log('📝 Filling login form...');
        
        // Try to find and fill email field
        const emailInput = await page.$('input[type="email"]') || await page.$('[data-testid="email-input"]') || await page.$('input[placeholder*="email" i]');
        if (emailInput) {
            await emailInput.type('ricardo@bondor.com');
        }
        
        // Try to find and fill password field
        const passwordInput = await page.$('input[type="password"]') || await page.$('[data-testid="password-input"]') || await page.$('input[placeholder*="password" i]');
        if (passwordInput) {
            await passwordInput.type('password123');
        }
        
        // Try to find and click login button
        const loginButton = await page.$('button[type="submit"]') || await page.$('[data-testid="login-button"]') || await page.$('button:contains("Login")') || await page.$('button:contains("Sign in")');
        if (loginButton) {
            console.log('🔑 Clicking login button...');
            await loginButton.click();
        }
        
        // Wait for navigation to home page
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        
        console.log('🏠 Navigating to invoices page...');
        await page.goto('http://localhost:3000/home/invoices', { waitUntil: 'networkidle0' });
        
        // Wait a bit for the page to load and make API calls
        await page.waitForTimeout(3000);
        
        console.log('✅ Test completed. Check the logs above for API responses.');
        
        // Keep browser open for inspection
        console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Error during browser test:', error.message);
    } finally {
        await browser.close();
    }
}

testBrowserInvoices();
