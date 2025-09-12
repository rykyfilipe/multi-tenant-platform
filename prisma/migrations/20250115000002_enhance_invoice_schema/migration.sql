-- Enhanced Invoice Schema Migration
-- Adds missing fields for international compliance

-- Add missing columns to invoices table
ALTER TABLE "Column" ADD COLUMN IF NOT EXISTS "show_in_invoice" BOOLEAN DEFAULT false;

-- Note: The actual column additions will be handled by the InvoiceSystemService.updateInvoiceTablesSchema method
-- This migration file is created for reference and future manual schema updates if needed

-- Add indexes for better performance on invoice queries
CREATE INDEX IF NOT EXISTS "idx_invoice_number_lookup" ON "Cell"("value") WHERE "columnId" IN (
  SELECT "id" FROM "Column" WHERE "name" = 'invoice_number' AND "tableId" IN (
    SELECT "id" FROM "Table" WHERE "protectedType" = 'invoices'
  )
);

CREATE INDEX IF NOT EXISTS "idx_invoice_customer_lookup" ON "Cell"("value") WHERE "columnId" IN (
  SELECT "id" FROM "Column" WHERE "name" = 'customer_id' AND "tableId" IN (
    SELECT "id" FROM "Table" WHERE "protectedType" = 'invoices'
  )
);

CREATE INDEX IF NOT EXISTS "idx_invoice_date_lookup" ON "Cell"("value") WHERE "columnId" IN (
  SELECT "id" FROM "Column" WHERE "name" = 'date' AND "tableId" IN (
    SELECT "id" FROM "Table" WHERE "protectedType" = 'invoices'
  )
);

-- Add indexes for invoice_items table
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "Cell"("value") WHERE "columnId" IN (
  SELECT "id" FROM "Column" WHERE "name" = 'invoice_id' AND "tableId" IN (
    SELECT "id" FROM "Table" WHERE "protectedType" = 'invoice_items'
  )
);

CREATE INDEX IF NOT EXISTS "idx_invoice_items_product_ref" ON "Cell"("value") WHERE "columnId" IN (
  SELECT "id" FROM "Column" WHERE "name" = 'product_ref_id' AND "tableId" IN (
    SELECT "id" FROM "Table" WHERE "protectedType" = 'invoice_items'
  )
);
