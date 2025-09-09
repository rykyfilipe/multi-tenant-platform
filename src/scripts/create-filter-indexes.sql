-- SQL script to create indexes for optimized filtering performance
-- Run this script on your PostgreSQL database to improve filter query performance

-- Indexes for Row table
CREATE INDEX IF NOT EXISTS idx_rows_table_id ON "Row"("tableId");
CREATE INDEX IF NOT EXISTS idx_rows_created_at ON "Row"("createdAt");
CREATE INDEX IF NOT EXISTS idx_rows_updated_at ON "Row"("updatedAt");

-- Indexes for Cell table (most important for filtering)
CREATE INDEX IF NOT EXISTS idx_cells_row_id ON "Cell"("rowId");
CREATE INDEX IF NOT EXISTS idx_cells_column_id ON "Cell"("columnId");
CREATE INDEX IF NOT EXISTS idx_cells_row_column ON "Cell"("rowId", "columnId");

-- JSONB indexes for value filtering (PostgreSQL specific)
-- These indexes will significantly improve performance for text searches and value comparisons
CREATE INDEX IF NOT EXISTS idx_cells_value_text ON "Cell" USING GIN (("value"->>'$'));
CREATE INDEX IF NOT EXISTS idx_cells_value_string_contains ON "Cell" USING GIN (("value"->>'$') gin_trgm_ops);

-- Indexes for specific column types
-- Text columns
CREATE INDEX IF NOT EXISTS idx_cells_value_text_lower ON "Cell" (LOWER(("value"->>'$'))) WHERE "value"->>'$' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cells_value_text_pattern ON "Cell" (("value"->>'$') text_pattern_ops) WHERE "value"->>'$' IS NOT NULL;

-- Numeric columns
CREATE INDEX IF NOT EXISTS idx_cells_value_numeric ON "Cell" (("value"->>'$')::numeric) WHERE ("value"->>'$') ~ '^[0-9]+\.?[0-9]*$';

-- Date columns
CREATE INDEX IF NOT EXISTS idx_cells_value_date ON "Cell" (("value"->>'$')::timestamp) WHERE ("value"->>'$') ~ '^\d{4}-\d{2}-\d{2}';

-- Boolean columns
CREATE INDEX IF NOT EXISTS idx_cells_value_boolean ON "Cell" (("value"->>'$')::boolean) WHERE ("value"->>'$') IN ('true', 'false');

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_cells_column_value ON "Cell"("columnId", ("value"->>'$'));
CREATE INDEX IF NOT EXISTS idx_cells_row_column_value ON "Cell"("rowId", "columnId", ("value"->>'$'));

-- Indexes for empty value checks
CREATE INDEX IF NOT EXISTS idx_cells_empty_values ON "Cell"("columnId") WHERE "value" IS NULL OR "value" = 'null'::jsonb OR ("value"->>'$') = '';

-- Indexes for reference columns (foreign keys)
CREATE INDEX IF NOT EXISTS idx_cells_reference_values ON "Cell"("columnId", ("value"->>'$')::integer) WHERE ("value"->>'$') ~ '^\d+$';

-- Statistics update to help query planner
ANALYZE "Row";
ANALYZE "Cell";

-- Optional: Create partial indexes for frequently filtered columns
-- Uncomment and modify based on your most common filter patterns

-- Example: Index for a specific column that's frequently filtered
-- CREATE INDEX IF NOT EXISTS idx_cells_name_column ON "Cell"("columnId", ("value"->>'$')) WHERE "columnId" = 1;

-- Example: Index for date range queries
-- CREATE INDEX IF NOT EXISTS idx_cells_date_range ON "Cell"("columnId", ("value"->>'$')::timestamp) WHERE "columnId" = 2;

-- Performance monitoring queries (run these to check index usage)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('Row', 'Cell')
-- ORDER BY idx_scan DESC;

-- Query to check index sizes
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('Row', 'Cell')
-- ORDER BY pg_relation_size(indexrelid) DESC;
