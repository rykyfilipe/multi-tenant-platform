/** @format */

import { NextRequest, NextResponse } from "next/server";
import { revokeExpiredPermissions } from "@/lib/permission-expiry";

/**
 * Cron job endpoint to revoke expired permissions
 * Should be called periodically (e.g., every hour)
 * 
 * Setup in Vercel:
 * - Add to vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/revoke-expired-permissions",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 * 
 * Or use external cron service (cron-job.org, EasyCron, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 Running expired permissions revocation job...");

    const result = await revokeExpiredPermissions();

    if (result.success) {
      console.log("✅ Expired permissions revoked:", result.revoked);
      return NextResponse.json({
        success: true,
        message: "Expired permissions revoked successfully",
        revoked: result.revoked,
      });
    } else {
      console.error("❌ Failed to revoke expired permissions:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}

