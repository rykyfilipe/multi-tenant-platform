-- CreateTable
CREATE TABLE "TablePermission" (
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
CREATE TABLE "ColumnPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "columnId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColumnPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TablePermission_tenantId_idx" ON "TablePermission"("tenantId");

-- CreateIndex
CREATE INDEX "TablePermission_tableId_idx" ON "TablePermission"("tableId");

-- CreateIndex
CREATE INDEX "TablePermission_userId_idx" ON "TablePermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TablePermission_userId_tableId_key" ON "TablePermission"("userId", "tableId");

-- CreateIndex
CREATE INDEX "ColumnPermission_tenantId_idx" ON "ColumnPermission"("tenantId");

-- CreateIndex
CREATE INDEX "ColumnPermission_columnId_idx" ON "ColumnPermission"("columnId");

-- CreateIndex
CREATE INDEX "ColumnPermission_userId_idx" ON "ColumnPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ColumnPermission_userId_columnId_key" ON "ColumnPermission"("userId", "columnId");

-- AddForeignKey
ALTER TABLE "TablePermission" ADD CONSTRAINT "TablePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TablePermission" ADD CONSTRAINT "TablePermission_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TablePermission" ADD CONSTRAINT "TablePermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnPermission" ADD CONSTRAINT "ColumnPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnPermission" ADD CONSTRAINT "ColumnPermission_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColumnPermission" ADD CONSTRAINT "ColumnPermission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
