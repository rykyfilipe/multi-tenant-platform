-- Custom Roles Migration
-- Allows tenants to create their own custom roles

CREATE TABLE "CustomRole" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT DEFAULT '👤',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to prevent duplicate role names per tenant
CREATE UNIQUE INDEX "CustomRole_tenantId_name_key" ON "CustomRole"("tenantId", "name");

-- Create indexes for faster queries
CREATE INDEX "CustomRole_tenantId_idx" ON "CustomRole"("tenantId");
CREATE INDEX "CustomRole_isSystemRole_idx" ON "CustomRole"("isSystemRole");
CREATE INDEX "CustomRole_createdBy_idx" ON "CustomRole"("createdBy");

-- Add foreign keys
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create UserCustomRole junction table (users can have multiple custom roles)
CREATE TABLE "UserCustomRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "customRoleId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "assignedBy" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCustomRole_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "UserCustomRole_userId_customRoleId_key" ON "UserCustomRole"("userId", "customRoleId");

-- Create indexes
CREATE INDEX "UserCustomRole_userId_idx" ON "UserCustomRole"("userId");
CREATE INDEX "UserCustomRole_customRoleId_idx" ON "UserCustomRole"("customRoleId");
CREATE INDEX "UserCustomRole_tenantId_idx" ON "UserCustomRole"("tenantId");

-- Add foreign keys
ALTER TABLE "UserCustomRole" ADD CONSTRAINT "UserCustomRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCustomRole" ADD CONSTRAINT "UserCustomRole_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCustomRole" ADD CONSTRAINT "UserCustomRole_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCustomRole" ADD CONSTRAINT "UserCustomRole_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

