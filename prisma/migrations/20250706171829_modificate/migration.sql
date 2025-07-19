/*
  Warnings:

  - You are about to drop the column `tableSchemaId` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the `TableSchema` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `columns` to the `Table` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_tableSchemaId_fkey";

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "tableSchemaId",
ADD COLUMN     "columns" JSONB NOT NULL;

-- DropTable
DROP TABLE "TableSchema";
