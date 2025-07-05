-- CreateTable
CREATE TABLE "Database" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,

    CONSTRAINT "Database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "databaseId" INTEGER NOT NULL,
    "tableSchemaId" INTEGER NOT NULL,
    "rows" JSONB NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableSchema" (
    "id" SERIAL NOT NULL,
    "columns" JSONB NOT NULL,

    CONSTRAINT "TableSchema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Database_tenantId_key" ON "Database"("tenantId");

-- AddForeignKey
ALTER TABLE "Database" ADD CONSTRAINT "Database_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "Database"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_tableSchemaId_fkey" FOREIGN KEY ("tableSchemaId") REFERENCES "TableSchema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
