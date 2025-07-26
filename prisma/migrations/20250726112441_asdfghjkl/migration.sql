/*
  Warnings:

  - Added the required column `tableId` to the `ColumnPermission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ColumnPermission" ADD COLUMN     "tableId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ColumnPermission" ADD CONSTRAINT "ColumnPermission_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
