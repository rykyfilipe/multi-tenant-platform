-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_tenant" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_database_tenant" ON "Database"("tenantId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_table_database" ON "Table"("databaseId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_table_public" ON "Table"("isPublic") WHERE "isPublic" = true;

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_column_table_order" ON "Column"("tableId", "order");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_row_table_created" ON "Row"("tableId", "createdAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_row" ON "Cell"("rowId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_cell_column" ON "Cell"("columnId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_table_permission_user_table" ON "TablePermission"("userId", "tableId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_column_permission_user_column" ON "ColumnPermission"("userId", "columnId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_api_token_user" ON "ApiToken"("userId") WHERE "revoked" = false;

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invitation_tenant" ON "Invitation"("tenantId");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_filter_preset_user" ON "FilterPreset"("userId");

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_table_database_public" ON "Table"("databaseId", "isPublic");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_row_table_id_created" ON "Row"("tableId", "id", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_permission_tenant_user" ON "TablePermission"("tenantId", "userId");
