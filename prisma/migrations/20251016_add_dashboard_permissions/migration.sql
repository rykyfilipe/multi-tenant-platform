-- Create DashboardPermission table
CREATE TABLE "DashboardPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardPermission_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to prevent duplicate permissions
CREATE UNIQUE INDEX "DashboardPermission_userId_dashboardId_key" ON "DashboardPermission"("userId", "dashboardId");

-- Create indexes for faster queries
CREATE INDEX "DashboardPermission_tenantId_idx" ON "DashboardPermission"("tenantId");
CREATE INDEX "DashboardPermission_dashboardId_idx" ON "DashboardPermission"("dashboardId");
CREATE INDEX "DashboardPermission_userId_idx" ON "DashboardPermission"("userId");

-- Add foreign keys
ALTER TABLE "DashboardPermission" ADD CONSTRAINT "DashboardPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DashboardPermission" ADD CONSTRAINT "DashboardPermission_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DashboardPermission" ADD CONSTRAINT "DashboardPermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

