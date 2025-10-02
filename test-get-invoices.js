const fetch = require('node-fetch');

async function testGetInvoices() {
    try {
        console.log('🔍 Testing GET /api/tenants/2/invoices...');
        
        // First, let's try to get a session token by logging in
        const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'ricardo@bondor.com',
                password: 'password123'
            })
        });
        
        console.log('🔐 Login response status:', loginResponse.status);
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('🔐 Login response:', loginData);
        } else {
            console.log('❌ Login failed, trying without auth...');
        }
        
        // Try the GET request
        const response = await fetch('http://localhost:3000/api/tenants/2/invoices', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add any auth headers if needed
            }
        });
        
        console.log('📄 GET response status:', response.status);
        console.log('📄 GET response headers:', response.headers.raw());
        
        const data = await response.text();
        console.log('📄 GET response body:', data);
        
        try {
            const jsonData = JSON.parse(data);
            console.log('📄 GET response JSON:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('📄 Response is not JSON');
        }
        
    } catch (error) {
        console.error('❌ Error testing GET invoices:', error.message);
    }
}

testGetInvoices();
