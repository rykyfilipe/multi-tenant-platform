/*
  Warnings:

  - You are about to drop the `FilterPreset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."FilterPreset" DROP CONSTRAINT "FilterPreset_tableId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FilterPreset" DROP CONSTRAINT "FilterPreset_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FilterPreset" DROP CONSTRAINT "FilterPreset_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Column" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Tenant" ALTER COLUMN "memoryLimitGB" SET DEFAULT 0.1;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "profileImage" TEXT;

-- DropTable
DROP TABLE "public"."FilterPreset";
