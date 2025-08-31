-- Add showInInvoice column to Column table
ALTER TABLE "Column" ADD COLUMN "showInInvoice" BOOLEAN NOT NULL DEFAULT false;
