-- CreateTable
CREATE TABLE "TableFilter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tableId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "filters" JSONB NOT NULL,
    "globalSearch" TEXT,
    "sortBy" TEXT DEFAULT 'id',
    "sortOrder" TEXT DEFAULT 'asc',
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableFilter_userId_idx" ON "TableFilter"("userId");
CREATE INDEX "TableFilter_tableId_idx" ON "TableFilter"("tableId");
CREATE INDEX "TableFilter_tenantId_idx" ON "TableFilter"("tenantId");
CREATE UNIQUE INDEX "TableFilter_userId_tableId_name_key" ON "TableFilter"("userId", "tableId", "name");

-- AddForeignKey
ALTER TABLE "TableFilter" ADD CONSTRAINT "TableFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableFilter" ADD CONSTRAINT "TableFilter_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TableFilter" ADD CONSTRAINT "TableFilter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
