-- Add indexes for improved filtering performance
-- These indexes are designed to optimize the filtering system

-- GIN index on cell values for JSON operations and text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_value_gin" ON "Cell" USING GIN ("value");

-- Composite index for efficient table and column lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_table_column" ON "Cell" ("tableId", "columnId");

-- Text index for string operations on cell values
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_value_text" ON "Cell" (("value"::text));

-- Index for numeric operations on cell values
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_value_numeric" ON "Cell" (("value"::text)::numeric) WHERE "value"::text ~ '^-?[0-9]+\.?[0-9]*$';

-- Index for boolean operations on cell values
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_value_boolean" ON "Cell" (("value"::boolean)) WHERE "value"::text IN ('true', 'false');

-- Index for date operations on cell values
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_value_date" ON "Cell" (("value"::text)) WHERE "value"::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}';

-- Index for row lookups by table
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_row_table_created" ON "Row" ("tableId", "createdAt");

-- Index for efficient row ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_row_id_table" ON "Row" ("id", "tableId");
