-- Add enhanced invoice system fields to existing tables
-- This migration extends the existing invoice system with import/export capabilities

-- Add import/export fields to existing invoice-related tables
-- Note: Since we're using a dynamic table system, we'll add these fields through the application
-- This migration creates supporting tables for the enhanced invoice system

-- Create InvoiceSeries table for atomic numbering
CREATE TABLE IF NOT EXISTS "InvoiceSeries" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "series" VARCHAR(50) NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "prefix" VARCHAR(20),
    "suffix" VARCHAR(20),
    "separator" VARCHAR(5) DEFAULT '-',
    "includeYear" BOOLEAN DEFAULT false,
    "includeMonth" BOOLEAN DEFAULT false,
    "resetYearly" BOOLEAN DEFAULT false,
    "resetMonthly" BOOLEAN DEFAULT false,
    "startNumber" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tenantId", "databaseId", "series")
);

-- Create InvoiceImport table for tracking imports
CREATE TABLE IF NOT EXISTS "InvoiceImport" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL, -- 'oblio', 'smartbill', 'fgo', 'csv', 'json'
    "externalId" VARCHAR(255),
    "invoiceNumber" VARCHAR(100),
    "invoiceDate" TIMESTAMP(3),
    "customerVatId" VARCHAR(50),
    "customerName" VARCHAR(255),
    "rawSnapshot" JSONB,
    "importedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "importedBy" INTEGER,
    "status" VARCHAR(20) DEFAULT 'imported', -- 'imported', 'duplicate', 'error'
    "errorMessage" TEXT,
    UNIQUE("tenantId", "provider", "externalId")
);

-- Create InvoiceAuditLog table for tracking all invoice actions
CREATE TABLE IF NOT EXISTS "InvoiceAuditLog" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'sent', 'paid', 'cancelled'
    "userId" INTEGER,
    "userEmail" VARCHAR(255),
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create InvoiceEmailLog table for tracking email sending
CREATE TABLE IF NOT EXISTS "InvoiceEmailLog" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "recipientEmail" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'failed', 'bounced'
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Create InvoiceTemplate table for customizable PDF templates
CREATE TABLE IF NOT EXISTS "InvoiceTemplate" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "templateType" VARCHAR(20) DEFAULT 'invoice', -- 'invoice', 'credit_note', 'proforma'
    "isDefault" BOOLEAN DEFAULT false,
    "templateData" JSONB NOT NULL, -- PDF template configuration
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tenantId", "name")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "InvoiceSeries_tenantId_databaseId_idx" ON "InvoiceSeries"("tenantId", "databaseId");
CREATE INDEX IF NOT EXISTS "InvoiceImport_tenantId_provider_idx" ON "InvoiceImport"("tenantId", "provider");
CREATE INDEX IF NOT EXISTS "InvoiceImport_externalId_idx" ON "InvoiceImport"("externalId");
CREATE INDEX IF NOT EXISTS "InvoiceAuditLog_tenantId_invoiceId_idx" ON "InvoiceAuditLog"("tenantId", "invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceAuditLog_createdAt_idx" ON "InvoiceAuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "InvoiceEmailLog_tenantId_invoiceId_idx" ON "InvoiceEmailLog"("tenantId", "invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceEmailLog_status_idx" ON "InvoiceEmailLog"("status");
CREATE INDEX IF NOT EXISTS "InvoiceTemplate_tenantId_idx" ON "InvoiceTemplate"("tenantId");

-- Add foreign key constraints
ALTER TABLE "InvoiceSeries" ADD CONSTRAINT "InvoiceSeries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "InvoiceImport" ADD CONSTRAINT "InvoiceImport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "InvoiceImport" ADD CONSTRAINT "InvoiceImport_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "InvoiceAuditLog" ADD CONSTRAINT "InvoiceAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "InvoiceAuditLog" ADD CONSTRAINT "InvoiceAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "InvoiceEmailLog" ADD CONSTRAINT "InvoiceEmailLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "InvoiceTemplate" ADD CONSTRAINT "InvoiceTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
