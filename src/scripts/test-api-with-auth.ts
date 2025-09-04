/** @format */

import prisma from "@/lib/prisma";
import { sign } from "jsonwebtoken";

async function testAPIWithAuth() {
	try {
		console.log("🔍 Testing API with authentication...");
		
		// Get a user and tenant for testing
		const user = await prisma.user.findFirst({
			where: {
				role: "ADMIN"
			},
			select: {
				id: true,
				email: true,
				role: true
			}
		});

		if (!user) {
			console.log("❌ No admin user found");
			return;
		}

		console.log(`👤 Using user: ${user.email} (ID: ${user.id})`);

		// Get tenant
		const tenant = await prisma.tenant.findFirst({
			select: {
				id: true,
				name: true
			}
		});

		if (!tenant) {
			console.log("❌ No tenant found");
			return;
		}

		console.log(`🏢 Using tenant: ${tenant.name} (ID: ${tenant.id})`);

		// Get database
		const database = await prisma.database.findFirst({
			where: {
				tenantId: tenant.id
			},
			select: {
				id: true,
				name: true
			}
		});

		if (!database) {
			console.log("❌ No database found");
			return;
		}

		console.log(`🗄️ Using database: ${database.name} (ID: ${database.id})`);

		// Get table with most rows
		const table = await prisma.table.findFirst({
			where: {
				databaseId: database.id
			},
			select: {
				id: true,
				name: true
			}
		});

		if (!table) {
			console.log("❌ No table found");
			return;
		}

		console.log(`📋 Using table: ${table.name} (ID: ${table.id})`);

		// Create JWT token
		const token = sign(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
				tenantId: tenant.id
			},
			process.env.JWT_SECRET || "fallback-secret",
			{ expiresIn: "1h" }
		);

		console.log(`🔑 Generated token: ${token.substring(0, 20)}...`);

		// Test API endpoint
		const apiUrl = `http://localhost:3000/api/tenants/${tenant.id}/databases/${database.id}/tables/${table.id}/rows/filtered?page=1&pageSize=25&includeCells=true`;
		
		console.log(`🌐 Testing API: ${apiUrl}`);

		const response = await fetch(apiUrl, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			}
		});

		console.log(`📊 Response status: ${response.status}`);
		console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));

		if (response.ok) {
			const data = await response.json();
			console.log("✅ API Response:");
			console.log(`  - Data length: ${data.data?.length || 0}`);
			console.log(`  - Total rows: ${data.pagination?.totalRows || 0}`);
			console.log(`  - Total pages: ${data.pagination?.totalPages || 0}`);
			console.log(`  - Current page: ${data.pagination?.page || 0}`);
			
			if (data.data && data.data.length > 0) {
				console.log("🔍 Sample row:");
				const sampleRow = data.data[0];
				console.log(`  - Row ID: ${sampleRow.id}`);
				console.log(`  - Cells: ${sampleRow.cells?.length || 0}`);
			}
		} else {
			const errorText = await response.text();
			console.log("❌ API Error:");
			console.log(errorText);
		}

	} catch (error) {
		console.error("❌ Error testing API:", error);
	}
}

// If running directly
if (require.main === module) {
	testAPIWithAuth()
		.then(() => {
			console.log("\n✅ Test completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Test failed:", error);
			process.exit(1);
		});
}

export { testAPIWithAuth };
