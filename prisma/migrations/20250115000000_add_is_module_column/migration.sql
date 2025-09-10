-- Add isModuleColumn to Column table
ALTER TABLE "Column" ADD COLUMN "isModuleColumn" BOOLEAN NOT NULL DEFAULT false;

-- Update existing columns to mark them as module columns if they belong to module tables
UPDATE "Column" 
SET "isModuleColumn" = true 
WHERE "tableId" IN (
  SELECT id FROM "Table" 
  WHERE "isModuleTable" = true
);
