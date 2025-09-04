/** @format */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { ApiSuccess, ApiErrors, handleApiError } from "@/lib/api-error-handler";
import { RealDataVerifier } from "@/scripts/verify-real-data";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string }> },
) {
	const { tenantId } = await params;
	const startTime = Date.now();

	try {
		// Verify user authentication and permissions
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);
		const role = user.role;

		// Check if user has access to this tenant
		        const isMember = requireTenantAccess(sessionResult, tenantId);
		if (!isMember) {
			return ApiErrors.forbidden("Access denied to this tenant").toResponse();
		}

		// Run verification
		const verifier = new RealDataVerifier();
		const results = await verifier.verifyAllTables();

		// Calculate summary
		const totalTables = results.length;
		const successCount = results.filter((r) => r.status === "success").length;
		const warningCount = results.filter((r) => r.status === "warning").length;
		const errorCount = results.filter((r) => r.status === "error").length;

		const summary = {
			totalTables,
			successCount,
			warningCount,
			errorCount,
			overallStatus:
				errorCount > 0 ? "error" : warningCount > 0 ? "warning" : "success",
			verificationTime: Date.now() - startTime,
			verifiedAt: new Date().toISOString(),
		};

		return ApiSuccess.ok(
			{
				summary,
				results,
				recommendations: generateRecommendations(results),
			},
			"Real data verification completed successfully",
		).toResponse();
	} catch (error) {
		const path = `/api/tenants/${tenantId}/analytics/verify-real`;
		return handleApiError(error, path);
	}
}

function generateRecommendations(results: any[]): string[] {
	const recommendations: string[] = [];

	const errorCount = results.filter((r) => r.status === "error").length;
	const warningCount = results.filter((r) => r.status === "warning").length;

	if (errorCount > 0) {
		recommendations.push(
			"❌ Database migration may not be applied. Run: npx prisma migrate dev",
		);
		recommendations.push(
			"❌ Check database connection and Prisma configuration",
		);
	}

	if (warningCount > 0) {
		recommendations.push(
			"⚠️ Some tables have no data. Consider running the populate-real endpoint",
		);
		recommendations.push(
			"⚠️ Start system monitoring to collect real-time metrics",
		);
	}

	const systemMonitoring = results.find((r) => r.table === "SystemMonitoring");
	if (systemMonitoring && !systemMonitoring.hasData) {
		recommendations.push(
			"⚠️ System monitoring is not running. Start it to collect real metrics",
		);
	}

	if (errorCount === 0 && warningCount === 0) {
		recommendations.push(
			"✅ All data is real and tracking is working correctly!",
		);
		recommendations.push(
			"✅ Consider setting up automated monitoring and alerting",
		);
	}

	return recommendations;
}
