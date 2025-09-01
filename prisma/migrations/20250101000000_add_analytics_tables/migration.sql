-- CreateTable
CREATE TABLE "UserActivity" (
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
CREATE TABLE "DatabaseActivity" (
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
CREATE TABLE "SystemMetrics" (
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
CREATE TABLE "TenantUsage" (
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
CREATE TABLE "ApiUsage" (
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
CREATE TABLE "ErrorLog" (
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
CREATE TABLE "PerformanceAlert" (
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

-- CreateIndex
CREATE INDEX "UserActivity_tenantId_createdAt_idx" ON "UserActivity"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_action_createdAt_idx" ON "UserActivity"("action", "createdAt");

-- CreateIndex
CREATE INDEX "DatabaseActivity_tenantId_createdAt_idx" ON "DatabaseActivity"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DatabaseActivity_databaseId_createdAt_idx" ON "DatabaseActivity"("databaseId", "createdAt");

-- CreateIndex
CREATE INDEX "SystemMetrics_tenantId_createdAt_idx" ON "SystemMetrics"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TenantUsage_tenantId_createdAt_idx" ON "TenantUsage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_tenantId_createdAt_idx" ON "ApiUsage"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_endpoint_createdAt_idx" ON "ApiUsage"("endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_tenantId_createdAt_idx" ON "ErrorLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorLog_errorType_createdAt_idx" ON "ErrorLog"("errorType", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceAlert_tenantId_createdAt_idx" ON "PerformanceAlert"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceAlert_alertType_createdAt_idx" ON "PerformanceAlert"("alertType", "createdAt");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseActivity" ADD CONSTRAINT "DatabaseActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseActivity" ADD CONSTRAINT "DatabaseActivity_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMetrics" ADD CONSTRAINT "SystemMetrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUsage" ADD CONSTRAINT "TenantUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsage" ADD CONSTRAINT "ApiUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsage" ADD CONSTRAINT "ApiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceAlert" ADD CONSTRAINT "PerformanceAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
