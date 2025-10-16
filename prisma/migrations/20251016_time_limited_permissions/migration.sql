-- Time-Limited Permissions Migration
-- Add expiry dates to all permission types

-- Add expiresAt to TablePermission
ALTER TABLE "TablePermission" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "TablePermission" ADD COLUMN "notifyBeforeExpiry" INTEGER DEFAULT 3; -- Days before to notify

-- Add expiresAt to ColumnPermission
ALTER TABLE "ColumnPermission" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "ColumnPermission" ADD COLUMN "notifyBeforeExpiry" INTEGER DEFAULT 3;

-- Add expiresAt to DashboardPermission
ALTER TABLE "DashboardPermission" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "DashboardPermission" ADD COLUMN "notifyBeforeExpiry" INTEGER DEFAULT 3;

-- Create indexes for expiry queries
CREATE INDEX "TablePermission_expiresAt_idx" ON "TablePermission"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX "ColumnPermission_expiresAt_idx" ON "ColumnPermission"("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX "DashboardPermission_expiresAt_idx" ON "DashboardPermission"("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- Create composite indexes for efficient expiry checks
CREATE INDEX "TablePermission_tenantId_expiresAt_idx" ON "TablePermission"("tenantId", "expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX "ColumnPermission_tenantId_expiresAt_idx" ON "ColumnPermission"("tenantId", "expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX "DashboardPermission_tenantId_expiresAt_idx" ON "DashboardPermission"("tenantId", "expiresAt") WHERE "expiresAt" IS NOT NULL;

