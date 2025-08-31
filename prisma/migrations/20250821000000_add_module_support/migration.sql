-- Add module support to Tenant and Table models

-- Add enabledModules array to Tenant
ALTER TABLE "Tenant" ADD COLUMN "enabledModules" TEXT[] DEFAULT '{}';

-- Add moduleType and isModuleTable to Table
ALTER TABLE "Table" ADD COLUMN "moduleType" TEXT;
ALTER TABLE "Table" ADD COLUMN "isModuleTable" BOOLEAN DEFAULT false;

-- Create index for better performance on module queries
CREATE INDEX "Table_moduleType_idx" ON "Table"("moduleType");
CREATE INDEX "Table_isModuleTable_idx" ON "Table"("isModuleTable");
