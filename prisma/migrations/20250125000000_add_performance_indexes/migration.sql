-- CreateIndex
CREATE INDEX IF NOT EXISTS "Database_tenantId_idx" ON "Database"("tenantId");

-- CreateIndex  
CREATE INDEX IF NOT EXISTS "Table_databaseId_idx" ON "Table"("databaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Table_tenantId_idx" ON "Table"("databaseId", "tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Column_tableId_idx" ON "Column"("tableId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Column_order_idx" ON "Column"("tableId", "order");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Row_tableId_idx" ON "Row"("tableId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Row_createdAt_idx" ON "Row"("tableId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cell_rowId_idx" ON "Cell"("rowId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cell_columnId_idx" ON "Cell"("columnId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Cell_rowId_columnId_idx" ON "Cell"("rowId", "columnId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "APIToken_userId_idx" ON "APIToken"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "APIToken_tokenHash_idx" ON "APIToken"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TablePermission_userId_idx" ON "TablePermission"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TablePermission_tableId_idx" ON "TablePermission"("tableId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TablePermission_tenantId_idx" ON "TablePermission"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TablePermission_userId_tableId_idx" ON "TablePermission"("userId", "tableId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ColumnPermission_userId_idx" ON "ColumnPermission"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ColumnPermission_columnId_idx" ON "ColumnPermission"("columnId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ColumnPermission_tenantId_idx" ON "ColumnPermission"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ColumnPermission_userId_columnId_idx" ON "ColumnPermission"("userId", "columnId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invitation_tenantId_idx" ON "Invitation"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FilterPreset_userId_idx" ON "FilterPreset"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FilterPreset_tableId_idx" ON "FilterPreset"("tableId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FilterPreset_userId_tableId_idx" ON "FilterPreset"("userId", "tableId");

-- Performance optimization: Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "performance_table_lookup_idx" ON "Table"("databaseId", "id", "isPublic");
CREATE INDEX IF NOT EXISTS "performance_row_pagination_idx" ON "Row"("tableId", "createdAt", "id");
CREATE INDEX IF NOT EXISTS "performance_cell_lookup_idx" ON "Cell"("rowId", "columnId", "id");
CREATE INDEX IF NOT EXISTS "performance_permission_check_idx" ON "TablePermission"("userId", "tableId", "canRead", "canEdit", "canDelete");
CREATE INDEX IF NOT EXISTS "performance_user_tenant_idx" ON "User"("tenantId", "role", "id");
CREATE INDEX IF NOT EXISTS "performance_database_tenant_idx" ON "Database"("tenantId", "createdAt", "id");
