-- CreateTable
CREATE TABLE "public"."FilterPreset" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tableId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "filters" JSONB NOT NULL,
    "globalSearch" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FilterPreset_userId_idx" ON "public"."FilterPreset"("userId");

-- CreateIndex
CREATE INDEX "FilterPreset_tableId_idx" ON "public"."FilterPreset"("tableId");

-- CreateIndex
CREATE INDEX "FilterPreset_tenantId_idx" ON "public"."FilterPreset"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "FilterPreset_userId_tableId_name_key" ON "public"."FilterPreset"("userId", "tableId", "name");

-- AddForeignKey
ALTER TABLE "public"."FilterPreset" ADD CONSTRAINT "FilterPreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FilterPreset" ADD CONSTRAINT "FilterPreset_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FilterPreset" ADD CONSTRAINT "FilterPreset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
