-- Multi-Tenant Support Migration
-- Allows users to belong to multiple tenants with different roles

-- Create UserTenant junction table
CREATE TABLE "UserTenant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "invitedBy" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "UserTenant_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to prevent duplicate user-tenant pairs
CREATE UNIQUE INDEX "UserTenant_userId_tenantId_key" ON "UserTenant"("userId", "tenantId");

-- Create indexes for faster queries
CREATE INDEX "UserTenant_userId_idx" ON "UserTenant"("userId");
CREATE INDEX "UserTenant_tenantId_idx" ON "UserTenant"("tenantId");
CREATE INDEX "UserTenant_isActive_idx" ON "UserTenant"("isActive");
CREATE INDEX "UserTenant_userId_isActive_idx" ON "UserTenant"("userId", "isActive");

-- Add foreign keys
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add activeTenantId to User table for current tenant selection
ALTER TABLE "User" ADD COLUMN "activeTenantId" INTEGER;

-- Migrate existing data: Create UserTenant entries for all existing users
-- This ensures backward compatibility
INSERT INTO "UserTenant" ("userId", "tenantId", "role", "isActive", "joinedAt")
SELECT 
    u.id,
    u."tenantId",
    u.role,
    u."isActive",
    u."createdAt"
FROM "User" u
WHERE u."tenantId" IS NOT NULL;

-- Set activeTenantId to current tenantId for existing users
UPDATE "User" 
SET "activeTenantId" = "tenantId"
WHERE "tenantId" IS NOT NULL;

-- Note: We keep the old tenantId column for now (for backward compatibility)
-- It can be removed in a future migration after full migration

