/*
  Warnings:

  - You are about to drop the column `autoIncrement` on the `Column` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Column" DROP COLUMN "autoIncrement",
ADD COLUMN     "customOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Tenant" ALTER COLUMN "memoryLimitGB" SET DEFAULT 0.098;
