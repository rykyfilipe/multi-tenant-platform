/*
  Warnings:

  - Made the column `description` on table `Table` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "referenceTableId" INTEGER;

-- AlterTable
ALTER TABLE "Table" ALTER COLUMN "description" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_referenceTableId_fkey" FOREIGN KEY ("referenceTableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;
