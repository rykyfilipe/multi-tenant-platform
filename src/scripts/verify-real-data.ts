/** @format */

import prisma from "@/lib/prisma";
import { activityTracker } from "@/lib/activity-tracker";
import { systemMonitor } from "@/lib/system-monitor";

interface VerificationResult {
	table: string;
	hasData: boolean;
	count: number;
	lastEntry?: Date;
	status: "success" | "warning" | "error";
	message: string;
}

class RealDataVerifier {
	private results: VerificationResult[] = [];

	async verifyAllTables(): Promise<VerificationResult[]> {
		console.log("🔍 Starting verification of real data...");

		// Verify analytics tables
		await this.verifyUserActivity();
		await this.verifyDatabaseActivity();
		await this.verifySystemMetrics();
		await this.verifyTenantUsage();
		await this.verifyApiUsage();
		await this.verifyErrorLogs();
		await this.verifyPerformanceAlerts();

		// Verify system monitoring
		await this.verifySystemMonitoring();

		// Generate summary
		this.generateSummary();

		return this.results;
	}

	private async verifyUserActivity() {
		try {
			const count = await prisma.userActivity.count();
			const lastEntry = await prisma.userActivity.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} user activity records`
				: "No user activity data found";

			this.results.push({
				table: "UserActivity",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "UserActivity",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying UserActivity: ${error}`,
			});
		}
	}

	private async verifyDatabaseActivity() {
		try {
			const count = await prisma.databaseActivity.count();
			const lastEntry = await prisma.databaseActivity.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} database activity records`
				: "No database activity data found";

			this.results.push({
				table: "DatabaseActivity",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "DatabaseActivity",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying DatabaseActivity: ${error}`,
			});
		}
	}

	private async verifySystemMetrics() {
		try {
			const count = await prisma.systemMetrics.count();
			const lastEntry = await prisma.systemMetrics.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} system metrics records`
				: "No system metrics data found";

			this.results.push({
				table: "SystemMetrics",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "SystemMetrics",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying SystemMetrics: ${error}`,
			});
		}
	}

	private async verifyTenantUsage() {
		try {
			const count = await prisma.tenantUsage.count();
			const lastEntry = await prisma.tenantUsage.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} tenant usage records`
				: "No tenant usage data found";

			this.results.push({
				table: "TenantUsage",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "TenantUsage",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying TenantUsage: ${error}`,
			});
		}
	}

	private async verifyApiUsage() {
		try {
			const count = await prisma.apiUsage.count();
			const lastEntry = await prisma.apiUsage.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} API usage records`
				: "No API usage data found";

			this.results.push({
				table: "ApiUsage",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "ApiUsage",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying ApiUsage: ${error}`,
			});
		}
	}

	private async verifyErrorLogs() {
		try {
			const count = await prisma.errorLog.count();
			const lastEntry = await prisma.errorLog.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} error log records`
				: "No error log data found";

			this.results.push({
				table: "ErrorLog",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "ErrorLog",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying ErrorLog: ${error}`,
			});
		}
	}

	private async verifyPerformanceAlerts() {
		try {
			const count = await prisma.performanceAlert.count();
			const lastEntry = await prisma.performanceAlert.findFirst({
				orderBy: { createdAt: "desc" },
				select: { createdAt: true },
			});

			const hasData = count > 0;
			const status = hasData ? "success" : "warning";
			const message = hasData
				? `Found ${count} performance alert records`
				: "No performance alert data found";

			this.results.push({
				table: "PerformanceAlert",
				hasData,
				count,
				lastEntry: lastEntry?.createdAt,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "PerformanceAlert",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying PerformanceAlert: ${error}`,
			});
		}
	}

	private async verifySystemMonitoring() {
		try {
			const isRunning = systemMonitor.isRunning();
			const metricsHistory = systemMonitor.getMetricsHistory();
			const tenantMetrics = systemMonitor.getAllTenantMetrics();

			const hasData = metricsHistory.length > 0 || tenantMetrics.size > 0;
			const status = isRunning && hasData ? "success" : "warning";
			const message = isRunning
				? `System monitoring is running with ${metricsHistory.length} metrics and ${tenantMetrics.size} tenant metrics`
				: "System monitoring is not running";

			this.results.push({
				table: "SystemMonitoring",
				hasData,
				count: metricsHistory.length + tenantMetrics.size,
				status,
				message,
			});
		} catch (error) {
			this.results.push({
				table: "SystemMonitoring",
				hasData: false,
				count: 0,
				status: "error",
				message: `Error verifying SystemMonitoring: ${error}`,
			});
		}
	}

	private generateSummary() {
		const totalTables = this.results.length;
		const successCount = this.results.filter(
			(r) => r.status === "success",
		).length;
		const warningCount = this.results.filter(
			(r) => r.status === "warning",
		).length;
		const errorCount = this.results.filter((r) => r.status === "error").length;

		console.log("\n📊 VERIFICATION SUMMARY");
		console.log("========================");
		console.log(`Total tables checked: ${totalTables}`);
		console.log(`✅ Success: ${successCount}`);
		console.log(`⚠️  Warnings: ${warningCount}`);
		console.log(`❌ Errors: ${errorCount}`);

		if (errorCount > 0) {
			console.log("\n❌ ERRORS FOUND:");
			this.results
				.filter((r) => r.status === "error")
				.forEach((result) => {
					console.log(`  - ${result.table}: ${result.message}`);
				});
		}

		if (warningCount > 0) {
			console.log("\n⚠️  WARNINGS:");
			this.results
				.filter((r) => r.status === "warning")
				.forEach((result) => {
					console.log(`  - ${result.table}: ${result.message}`);
				});
		}

		if (successCount === totalTables) {
			console.log("\n🎉 ALL DATA IS REAL AND TRACKING IS WORKING!");
		} else if (successCount > 0) {
			console.log("\n✅ SOME DATA IS REAL, BUT SOME TABLES NEED ATTENTION");
		} else {
			console.log("\n⚠️  NO REAL DATA FOUND - MIGRATION MAY NOT BE APPLIED");
		}
	}
}

// Export for use in other files
export { RealDataVerifier };

// If running directly
if (require.main === module) {
	const verifier = new RealDataVerifier();
	verifier
		.verifyAllTables()
		.then(() => {
			console.log("\n✅ Verification completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Verification failed:", error);
			process.exit(1);
		});
}
