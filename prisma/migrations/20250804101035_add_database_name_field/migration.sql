/*
  Warnings:

  - Added the required column `updatedAt` to the `Database` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Database_tenantId_key";

-- AlterTable
ALTER TABLE "public"."Database" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Main Database',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have proper updatedAt values
UPDATE "public"."Database" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- AlterTable
ALTER TABLE "public"."Tenant" ALTER COLUMN "updatedAt" DROP DEFAULT;
