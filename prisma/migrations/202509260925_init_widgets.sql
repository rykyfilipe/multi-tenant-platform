-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."WidgetKind" AS ENUM ('CHART', 'TABLE', 'TASKS', 'CLOCK', 'WEATHER', 'KPI', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."WidgetDraftStatus" AS ENUM ('PENDING', 'READY', 'APPLIED', 'DISCARDED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "public"."WidgetAuditOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPLY_PENDING', 'RESOLVE_CONFLICT');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "address" TEXT,
    "companyEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "language" TEXT,
    "logoUrl" TEXT,
    "phone" TEXT,
    "theme" TEXT,
    "timezone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "website" TEXT,
    "lastMemoryUpdate" TIMESTAMP(3),
    "memoryLimitGB" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "memoryUsedGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultCurrency" TEXT DEFAULT 'USD',
    "companyBank" TEXT,
    "companyCity" TEXT,
    "companyCountry" TEXT,
    "companyIban" TEXT,
    "companyPostalCode" TEXT,
    "companyStreet" TEXT,
    "companyStreetNumber" TEXT,
    "companyTaxId" TEXT,
    "registrationNumber" TEXT,
    "invoiceStartNumber" INTEGER DEFAULT 1,
    "invoiceSeriesPrefix" TEXT DEFAULT 'INV',
    "invoiceIncludeYear" BOOLEAN DEFAULT true,
    "enabledModules" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."Role" NOT NULL,
    "tenantId" INTEGER,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
    "subscriptionPlan" TEXT,
    "subscriptionStatus" TEXT,
    "profileImage" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Database" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL DEFAULT 'Main Database',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Table" (
    "id" SERIAL NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "protectedType" TEXT,
    "moduleType" TEXT,
    "isModuleTable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Column" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "tableId" INTEGER NOT NULL,
    "referenceTableId" INTEGER,
    "customOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultValue" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isModuleColumn" BOOLEAN NOT NULL DEFAULT false,
    "semanticType" TEXT,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Row" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cell" (
    "id" SERIAL NOT NULL,
    "rowId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "stringValue" TEXT,
    "numberValue" DECIMAL(65,30),
    "dateValue" TIMESTAMP(3),
    "booleanValue" BOOLEAN,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TablePermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TablePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ColumnPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tableId" INTEGER NOT NULL,

    CONSTRAINT "ColumnPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserActivity" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" INTEGER,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DatabaseActivity" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "tableName" TEXT,
    "query" TEXT,
    "responseTime" INTEGER,
    "rowsAffected" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemMetrics" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "cpuUsage" DECIMAL(5,2) NOT NULL,
    "memoryUsage" DECIMAL(5,2) NOT NULL,
    "diskUsage" DECIMAL(5,2) NOT NULL,
    "networkLatency" INTEGER,
    "errorRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activeConnections" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantUsage" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "cpuUsage" DECIMAL(5,2) NOT NULL,
    "memoryUsage" DECIMAL(5,2) NOT NULL,
    "storageUsage" DECIMAL(10,2) NOT NULL,
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "databaseQueries" INTEGER NOT NULL DEFAULT 0,
    "overageAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiUsage" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ErrorLog" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "endpoint" TEXT,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerformanceAlert" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "alertType" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "threshold" DECIMAL(10,2) NOT NULL,
    "currentValue" DECIMAL(10,2) NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceSeries" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "series" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "suffix" TEXT NOT NULL DEFAULT '',
    "separator" TEXT NOT NULL DEFAULT '-',
    "includeYear" BOOLEAN NOT NULL DEFAULT false,
    "includeMonth" BOOLEAN NOT NULL DEFAULT false,
    "resetYearly" BOOLEAN NOT NULL DEFAULT false,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvoiceAuditLog" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "tourDashboardDone" BOOLEAN NOT NULL DEFAULT false,
    "tourInvoiceDone" BOOLEAN NOT NULL DEFAULT false,
    "tourDatabaseDone" BOOLEAN NOT NULL DEFAULT false,
    "tourUsersDone" BOOLEAN NOT NULL DEFAULT false,
    "tourSettingsDone" BOOLEAN NOT NULL DEFAULT false,
    "tourAnalyticsDone" BOOLEAN NOT NULL DEFAULT false,
    "autoStartTours" BOOLEAN NOT NULL DEFAULT true,
    "showTourHints" BOOLEAN NOT NULL DEFAULT true,
    "tourSpeed" TEXT NOT NULL DEFAULT 'normal',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PDFAnalytics" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "generationTime" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "features" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,

    CONSTRAINT "PDFAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PDFTemplateConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "customization" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PDFTemplateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ANAFCredentials" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ANAFCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ANAFSubmissionLog" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "submissionId" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "error" TEXT,
    "xmlContent" TEXT,
    "responseXml" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "submissionType" TEXT NOT NULL,

    CONSTRAINT "ANAFSubmissionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dashboard" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'view',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Widget" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "kind" "public"."WidgetKind" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "position" JSONB NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "Widget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WidgetDraft" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "widgetId" INTEGER,
    "kind" "public"."WidgetKind" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "position" JSONB,
    "config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."WidgetDraftStatus" NOT NULL DEFAULT 'PENDING',
    "operations" JSONB,
    "conflictMeta" JSONB,
    "note" TEXT,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "WidgetDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WidgetAudit" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "dashboardId" INTEGER NOT NULL,
    "widgetId" INTEGER,
    "draftId" INTEGER,
    "actorId" INTEGER,
    "operation" "public"."WidgetAuditOperation" NOT NULL,
    "diff" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WidgetAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "public"."Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_adminId_key" ON "public"."Tenant"("adminId");

-- CreateIndex
CREATE INDEX "Tenant_adminId_idx" ON "public"."Tenant"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "public"."User"("tenantId");

-- CreateIndex
CREATE INDEX "Database_tenantId_idx" ON "public"."Database"("tenantId");

-- CreateIndex
CREATE INDEX "Table_databaseId_idx" ON "public"."Table"("databaseId");

-- CreateIndex
CREATE INDEX "Table_databaseId_name_idx" ON "public"."Table"("databaseId", "name");

-- CreateIndex
CREATE INDEX "Table_isPublic_isProtected_idx" ON "public"."Table"("isPublic", "isProtected");

-- CreateIndex
CREATE UNIQUE INDEX "Table_databaseId_name_key" ON "public"."Table"("databaseId", "name");

-- CreateIndex
CREATE INDEX "Column_tableId_idx" ON "public"."Column"("tableId");

-- CreateIndex
CREATE INDEX "Column_tableId_name_idx" ON "public"."Column"("tableId", "name");

-- CreateIndex
CREATE INDEX "Column_referenceTableId_idx" ON "public"."Column"("referenceTableId");

-- CreateIndex
CREATE UNIQUE INDEX "Column_tableId_name_key" ON "public"."Column"("tableId", "name");

-- CreateIndex
CREATE INDEX "Row_tableId_idx" ON "public"."Row"("tableId");

-- CreateIndex
CREATE INDEX "Cell_rowId_idx" ON "public"."Cell"("rowId");

-- CreateIndex
CREATE INDEX "Cell_columnId_idx" ON "public"."Cell"("columnId");

-- CreateIndex
CREATE INDEX "Cell_stringValue_idx" ON "public"."Cell"("stringValue");

-- CreateIndex
CREATE INDEX "Cell_numberValue_idx" ON "public"."Cell"("numberValue");

-- CreateIndex
CREATE INDEX "Cell_dateValue_idx" ON "public"."Cell"("dateValue");

-- CreateIndex
CREATE INDEX "Cell_booleanValue_idx" ON "public"."Cell"("booleanValue");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_rowId_columnId_key" ON "public"."Cell"("rowId", "columnId");

-- CreateIndex
CREATE INDEX "TablePermission_tenantId_idx" ON "public"."TablePermission"("tenantId");

-- CreateIndex
CREATE INDEX "TablePermission_tableId_idx" ON "public"."TablePermission"("tableId");

-- CreateIndex
CREATE INDEX "TablePermission_userId_idx" ON "public"."TablePermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TablePermission_userId_tableId_key" ON "public"."TablePermission"("userId", "tableId");

-- CreateIndex
CREATE INDEX "ColumnPermission_tenantId_idx" ON "public"."ColumnPermission"("tenantId");

-- CreateIndex
CREATE INDEX "ColumnPermission_columnId_idx" ON "public"."ColumnPermission"("columnId");

-- CreateIndex
CREATE INDEX "ColumnPermission_userId_idx" ON "public"."ColumnPermission"("userId");

-- CreateIndex
CREATE INDEX "ColumnPermission_tableId_idx" ON "public"."ColumnPermission"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnPermission_userId_columnId_key" ON "public"."ColumnPermission"("userId", "columnId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "public"."Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "public"."Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "public"."Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_tenantId_idx" ON "public"."Invitation"("tenantId");

-- CreateIndex
CREATE INDEX "UserActivity_tenantId_createdAt_idx" ON "public"."UserActivity"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "public"."UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_action_createdAt_idx" ON "public"."UserActivity"("action", "createdAt");

-- CreateIndex
CREATE INDEX "DatabaseActivity_tenantId_createdAt_idx" ON "public"."DatabaseActivity"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DatabaseActivity_databaseId_createdAt_idx" ON "public"."DatabaseActivity"("databaseId", "createdAt");

-- CreateIndex
CREATE INDEX "SystemMetrics_tenantId_createdAt_idx" ON "public"."SystemMetrics"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantUsage_tenantId_createdAt_idx" ON "public"."TenantUsage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_tenantId_createdAt_idx" ON "public"."ApiUsage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_endpoint_createdAt_idx" ON "public"."ApiUsage"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_userId_idx" ON "public"."ApiUsage"("userId");

-- CreateIndex
CREATE INDEX "ErrorLog_tenantId_createdAt_idx" ON "public"."ErrorLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_createdAt_idx" ON "public"."ErrorLog"("errorType", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_userId_idx" ON "public"."ErrorLog"("userId");

-- CreateIndex
CREATE INDEX "PerformanceAlert_tenantId_createdAt_idx" ON "public"."PerformanceAlert"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceAlert_alertType_createdAt_idx" ON "public"."PerformanceAlert"("alertType", "createdAt");

-- CreateIndex
CREATE INDEX "InvoiceSeries_tenantId_idx" ON "public"."InvoiceSeries"("tenantId");

-- CreateIndex
CREATE INDEX "InvoiceSeries_databaseId_idx" ON "public"."InvoiceSeries"("databaseId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSeries_tenantId_databaseId_series_key" ON "public"."InvoiceSeries"("tenantId", "databaseId", "series");

-- CreateIndex
CREATE INDEX "InvoiceAuditLog_tenantId_idx" ON "public"."InvoiceAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "InvoiceAuditLog_databaseId_idx" ON "public"."InvoiceAuditLog"("databaseId");

-- CreateIndex
CREATE INDEX "InvoiceAuditLog_invoiceId_idx" ON "public"."InvoiceAuditLog"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceAuditLog_action_createdAt_idx" ON "public"."InvoiceAuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_tenantId_idx" ON "public"."UserPreferences"("tenantId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "PDFAnalytics_tenantId_idx" ON "public"."PDFAnalytics"("tenantId");

-- CreateIndex
CREATE INDEX "PDFAnalytics_templateId_idx" ON "public"."PDFAnalytics"("templateId");

-- CreateIndex
CREATE INDEX "PDFAnalytics_generatedAt_idx" ON "public"."PDFAnalytics"("generatedAt");

-- CreateIndex
CREATE INDEX "PDFTemplateConfig_tenantId_idx" ON "public"."PDFTemplateConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PDFTemplateConfig_tenantId_templateId_key" ON "public"."PDFTemplateConfig"("tenantId", "templateId");

-- CreateIndex
CREATE INDEX "ANAFCredentials_tenantId_idx" ON "public"."ANAFCredentials"("tenantId");

-- CreateIndex
CREATE INDEX "ANAFCredentials_userId_idx" ON "public"."ANAFCredentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ANAFCredentials_userId_tenantId_key" ON "public"."ANAFCredentials"("userId", "tenantId");

-- CreateIndex
CREATE INDEX "ANAFSubmissionLog_tenantId_idx" ON "public"."ANAFSubmissionLog"("tenantId");

-- CreateIndex
CREATE INDEX "ANAFSubmissionLog_invoiceId_idx" ON "public"."ANAFSubmissionLog"("invoiceId");

-- CreateIndex
CREATE INDEX "ANAFSubmissionLog_submissionId_idx" ON "public"."ANAFSubmissionLog"("submissionId");

-- CreateIndex
CREATE INDEX "ANAFSubmissionLog_status_idx" ON "public"."ANAFSubmissionLog"("status");

-- CreateIndex
CREATE INDEX "ANAFSubmissionLog_submittedAt_idx" ON "public"."ANAFSubmissionLog"("submittedAt");

-- CreateIndex
CREATE INDEX "Dashboard_tenantId_idx" ON "public"."Dashboard"("tenantId");

-- CreateIndex
CREATE INDEX "Dashboard_tenantId_isDefault_idx" ON "public"."Dashboard"("tenantId", "isDefault");

-- CreateIndex
CREATE INDEX "Dashboard_createdBy_idx" ON "public"."Dashboard"("createdBy");

-- CreateIndex
CREATE INDEX "Dashboard_updatedBy_idx" ON "public"."Dashboard"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Dashboard_tenantId_name_key" ON "public"."Dashboard"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Widget_tenantId_idx" ON "public"."Widget"("tenantId");

-- CreateIndex
CREATE INDEX "Widget_dashboardId_idx" ON "public"."Widget"("dashboardId");

-- CreateIndex
CREATE INDEX "Widget_tenantId_dashboardId_idx" ON "public"."Widget"("tenantId", "dashboardId");

-- CreateIndex
CREATE INDEX "Widget_kind_idx" ON "public"."Widget"("kind");

-- CreateIndex
CREATE INDEX "Widget_tenantId_kind_idx" ON "public"."Widget"("tenantId", "kind");

-- CreateIndex
CREATE INDEX "Widget_sortOrder_idx" ON "public"."Widget"("sortOrder");

-- CreateIndex
CREATE INDEX "Widget_createdBy_idx" ON "public"."Widget"("createdBy");

-- CreateIndex
CREATE INDEX "Widget_updatedBy_idx" ON "public"."Widget"("updatedBy");

-- CreateIndex
CREATE INDEX "Widget_config_idx" ON "public"."Widget" USING GIN ("config");

-- CreateIndex
CREATE INDEX "WidgetDraft_tenantId_idx" ON "public"."WidgetDraft"("tenantId");

-- CreateIndex
CREATE INDEX "WidgetDraft_dashboardId_idx" ON "public"."WidgetDraft"("dashboardId");

-- CreateIndex
CREATE INDEX "WidgetDraft_widgetId_idx" ON "public"."WidgetDraft"("widgetId");

-- CreateIndex
CREATE INDEX "WidgetDraft_status_idx" ON "public"."WidgetDraft"("status");

-- CreateIndex
CREATE INDEX "WidgetDraft_createdBy_idx" ON "public"."WidgetDraft"("createdBy");

-- CreateIndex
CREATE INDEX "WidgetDraft_updatedBy_idx" ON "public"."WidgetDraft"("updatedBy");

-- CreateIndex
CREATE INDEX "WidgetDraft_createdAt_idx" ON "public"."WidgetDraft"("createdAt");

-- CreateIndex
CREATE INDEX "WidgetAudit_tenantId_idx" ON "public"."WidgetAudit"("tenantId");

-- CreateIndex
CREATE INDEX "WidgetAudit_dashboardId_idx" ON "public"."WidgetAudit"("dashboardId");

-- CreateIndex
CREATE INDEX "WidgetAudit_widgetId_idx" ON "public"."WidgetAudit"("widgetId");

-- CreateIndex
CREATE INDEX "WidgetAudit_draftId_idx" ON "public"."WidgetAudit"("draftId");

-- CreateIndex
CREATE INDEX "WidgetAudit_actorId_idx" ON "public"."WidgetAudit"("actorId");

-- CreateIndex
CREATE INDEX "WidgetAudit_operation_idx" ON "public"."WidgetAudit"("operation");

-- CreateIndex
CREATE INDEX "WidgetAudit_createdAt_idx" ON "public"."WidgetAudit"("createdAt");

