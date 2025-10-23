# Database Schema Builder

The database schema builder provides a visual interface for creating and managing database structures, enabling users to design custom databases without writing SQL code.

## Overview

The schema builder enables users to:

- **Create Custom Tables**: Visual table creation with drag-and-drop interface
- **Define Column Types**: Support for various data types with validation
- **Establish Relationships**: Create foreign key relationships between tables
- **Manage Indexes**: Add performance indexes for better query performance
- **Validate Schemas**: Automatic schema validation and constraint checking
- **Generate Migrations**: Automatic migration generation for schema changes

## Architecture Components

### 1. Table Management

#### Table Structure
```typescript
// Table entity with comprehensive metadata
model Table {
  id              Int      @id @default(autoincrement())
  databaseId      Int
  name            String
  description     String?
  displayName     String?
  icon            String?
  color           String?
  isSystem        Boolean  @default(false)
  isReadOnly      Boolean  @default(false)
  rowCount        Int      @default(0)
  lastModified    DateTime @updatedAt
  createdAt       DateTime @default(now())
  
  // Relationships
  database        Database @relation(fields: [databaseId], references: [id])
  columns         Column[]
  rows            Row[]
  indexes         Index[]
  relationships   Relationship[]
  
  @@unique([databaseId, name])
}

// Column definition with semantic types
model Column {
  id              Int      @id @default(autoincrement())
  tableId         Int
  name            String
  displayName     String?
  description     String?
  dataType        DataType
  semanticType    String?   // Semantic type for business logic
  isRequired      Boolean  @default(false)
  isUnique        Boolean  @default(false)
  defaultValue    String?
  maxLength       Int?
  precision       Int?
  scale           Int?
  referenceTableId Int?    // For foreign key relationships
  referenceColumnId Int?   // Referenced column
  validationRules Json?    // Custom validation rules
  displayOrder    Int      @default(0)
  isSystem        Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  table           Table    @relation(fields: [tableId], references: [id])
  referenceTable  Table?   @relation("ColumnReference", fields: [referenceTableId], references: [id])
  cells           Cell[]
  indexes         IndexColumn[]
  
  @@unique([tableId, name])
}
```

### 2. Data Types

#### Supported Data Types
```typescript
// Simple data types used in the platform
const DataTypes = {
  STRING: "string",         // Text data
  NUMBER: "number",         // Numeric data
  BOOLEAN: "boolean",       // True/false values
  DATE: "date",            // Date values
  DATETIME: "datetime",    // Date and time values
  JSON: "json"             // JSON objects
} as const;

// Semantic types for business logic
enum SemanticColumnType {
  // Identity fields
  PRIMARY_KEY = "primary_key",
  FOREIGN_KEY = "foreign_key",
  
  // Contact information
  EMAIL = "email",
  PHONE = "phone",
  ADDRESS = "address",
  
  // Financial fields
  CURRENCY = "currency",
  AMOUNT = "amount",
  PERCENTAGE = "percentage",
  
  // Invoice specific
  INVOICE_NUMBER = "invoice_number",
  INVOICE_DATE = "invoice_date",
  INVOICE_TOTAL = "invoice_total",
  INVOICE_STATUS = "invoice_status",
  
  // Customer specific
  CUSTOMER_NAME = "customer_name",
  CUSTOMER_TAX_ID = "customer_tax_id",
  
  // Product specific
  PRODUCT_NAME = "product_name",
  PRODUCT_PRICE = "product_price",
  PRODUCT_VAT = "product_vat"
}
```

### 3. Relationship Management

#### Table Relationships
```typescript
// Relationship model for foreign keys
model Relationship {
  id                Int      @id @default(autoincrement())
  tableId           Int
  name              String
  type              RelationshipType
  sourceColumnId    Int
  targetTableId     Int
  targetColumnId    Int
  onDelete          CascadeAction @default(RESTRICT)
  onUpdate          CascadeAction @default(RESTRICT)
  isRequired        Boolean  @default(false)
  createdAt         DateTime @default(now())
  
  table             Table    @relation(fields: [tableId], references: [id])
  sourceColumn      Column   @relation("SourceColumn", fields: [sourceColumnId], references: [id])
  targetTable       Table    @relation("TargetTable", fields: [targetTableId], references: [id])
  targetColumn      Column   @relation("TargetColumn", fields: [targetColumnId], references: [id])
}

enum RelationshipType {
  ONE_TO_ONE = "ONE_TO_ONE",
  ONE_TO_MANY = "ONE_TO_MANY",
  MANY_TO_MANY = "MANY_TO_MANY"
}

enum CascadeAction {
  RESTRICT = "RESTRICT",
  CASCADE = "CASCADE",
  SET_NULL = "SET_NULL",
  SET_DEFAULT = "SET_DEFAULT"
}
```

## Implementation Details

### 1. Table Creation

#### Table Creation Service
```typescript
// Table creation service
export class TableCreationService {
  static async createTable(
    databaseId: number,
    tableData: CreateTableRequest
  ): Promise<Table> {
    return await prisma.$transaction(async (tx) => {
      // Create table
      const table = await tx.table.create({
        data: {
          databaseId,
          name: tableData.name,
          description: tableData.description,
          displayName: tableData.displayName,
          icon: tableData.icon,
          color: tableData.color
        }
      });
      
      // Create columns
      const columns = await Promise.all(
        tableData.columns.map((columnData, index) =>
          tx.column.create({
            data: {
              tableId: table.id,
              name: columnData.name,
              displayName: columnData.displayName,
              description: columnData.description,
              dataType: columnData.dataType,
              semanticType: columnData.semanticType,
              isRequired: columnData.isRequired,
              isUnique: columnData.isUnique,
              defaultValue: columnData.defaultValue,
              maxLength: columnData.maxLength,
              precision: columnData.precision,
              scale: columnData.scale,
              displayOrder: index
            }
          })
        )
      );
      
      // Create relationships
      if (tableData.relationships) {
        await Promise.all(
          tableData.relationships.map(relData =>
            tx.relationship.create({
              data: {
                tableId: table.id,
                name: relData.name,
                type: relData.type,
                sourceColumnId: relData.sourceColumnId,
                targetTableId: relData.targetTableId,
                targetColumnId: relData.targetColumnId,
                onDelete: relData.onDelete,
                onUpdate: relData.onUpdate,
                isRequired: relData.isRequired
              }
            })
          )
        );
      }
      
      // Create indexes
      if (tableData.indexes) {
        await Promise.all(
          tableData.indexes.map(indexData =>
            tx.index.create({
              data: {
                tableId: table.id,
                name: indexData.name,
                type: indexData.type,
                isUnique: indexData.isUnique,
                columns: {
                  create: indexData.columns.map(colId => ({
                    columnId: colId
                  }))
                }
              }
            })
          )
        );
      }
      
      return { ...table, columns };
    });
  }
}
```

### 2. Schema Validation

#### Schema Validation Service
```typescript
// Schema validation service
export class SchemaValidationService {
  static async validateTableSchema(
    tableData: CreateTableRequest
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // Validate table name
    if (!this.isValidTableName(tableData.name)) {
      errors.push({
        field: 'name',
        message: 'Table name must contain only letters, numbers, and underscores'
      });
    }
    
    // Validate columns
    for (const column of tableData.columns) {
      const columnErrors = await this.validateColumn(column);
      errors.push(...columnErrors);
    }
    
    // Validate relationships
    if (tableData.relationships) {
      for (const relationship of tableData.relationships) {
        const relErrors = await this.validateRelationship(relationship);
        errors.push(...relErrors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private static isValidTableName(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  }
  
  private static async validateColumn(
    column: CreateColumnRequest
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Validate column name
    if (!this.isValidColumnName(column.name)) {
      errors.push({
        field: 'columns.name',
        message: 'Column name must contain only letters, numbers, and underscores'
      });
    }
    
    // Validate data type constraints
    if (column.dataType === DataType.VARCHAR && !column.maxLength) {
      errors.push({
        field: 'columns.maxLength',
        message: 'VARCHAR columns must specify maxLength'
      });
    }
    
    if (column.dataType === DataType.DECIMAL && (!column.precision || !column.scale)) {
      errors.push({
        field: 'columns.precision',
        message: 'DECIMAL columns must specify precision and scale'
      });
    }
    
    // Validate semantic type
    if (column.semanticType && !this.isValidSemanticType(column.semanticType)) {
      errors.push({
        field: 'columns.semanticType',
        message: 'Invalid semantic type'
      });
    }
    
    return errors;
  }
  
  private static async validateRelationship(
    relationship: CreateRelationshipRequest
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Validate relationship type compatibility
    if (relationship.type === RelationshipType.ONE_TO_ONE) {
      // Check if target column is unique
      const targetColumn = await prisma.column.findUnique({
        where: { id: relationship.targetColumnId }
      });
      
      if (!targetColumn?.isUnique) {
        errors.push({
          field: 'relationships.targetColumn',
          message: 'ONE_TO_ONE relationships require unique target columns'
        });
      }
    }
    
    return errors;
  }
}
```

### 3. Migration Generation

#### Migration Service
```typescript
// Migration generation service
export class MigrationService {
  static async generateMigration(
    databaseId: number,
    changes: SchemaChanges
  ): Promise<Migration> {
    const migration = await prisma.migration.create({
      data: {
        databaseId,
        name: `migration_${Date.now()}`,
        status: 'PENDING',
        changes: JSON.stringify(changes)
      }
    });
    
    // Generate SQL statements
    const sqlStatements = await this.generateSQLStatements(changes);
    
    // Update migration with SQL
    await prisma.migration.update({
      where: { id: migration.id },
      data: { sqlStatements }
    });
    
    return migration;
  }
  
  private static async generateSQLStatements(
    changes: SchemaChanges
  ): Promise<string[]> {
    const statements: string[] = [];
    
    // Generate CREATE TABLE statements
    for (const table of changes.tables.create) {
      statements.push(this.generateCreateTableSQL(table));
    }
    
    // Generate ALTER TABLE statements
    for (const alter of changes.tables.alter) {
      statements.push(...this.generateAlterTableSQL(alter));
    }
    
    // Generate DROP TABLE statements
    for (const table of changes.tables.drop) {
      statements.push(`DROP TABLE IF EXISTS ${table.name};`);
    }
    
    return statements;
  }
  
  private static generateCreateTableSQL(table: CreateTableRequest): string {
    const columns = table.columns.map(column => {
      let sql = `${column.name} ${this.getSQLDataType(column.dataType)}`;
      
      if (column.isRequired) sql += ' NOT NULL';
      if (column.isUnique) sql += ' UNIQUE';
      if (column.defaultValue) sql += ` DEFAULT ${column.defaultValue}`;
      
      return sql;
    });
    
    return `CREATE TABLE ${table.name} (\n  ${columns.join(',\n  ')}\n);`;
  }
  
  private static getSQLDataType(dataType: DataType): string {
    const typeMap = {
      [DataType.TEXT]: 'TEXT',
      [DataType.VARCHAR]: 'VARCHAR',
      [DataType.CHAR]: 'CHAR',
      [DataType.INTEGER]: 'INTEGER',
      [DataType.BIGINT]: 'BIGINT',
      [DataType.DECIMAL]: 'DECIMAL',
      [DataType.FLOAT]: 'FLOAT',
      [DataType.BOOLEAN]: 'BOOLEAN',
      [DataType.DATE]: 'DATE',
      [DataType.DATETIME]: 'DATETIME',
      [DataType.TIME]: 'TIME',
      [DataType.JSON]: 'JSON',
      [DataType.BLOB]: 'BLOB',
      [DataType.UUID]: 'UUID'
    };
    
    return typeMap[dataType] || 'TEXT';
  }
}
```

## Advanced Features

### 1. Visual Schema Designer

#### Drag-and-Drop Interface
```typescript
// Schema designer component
export const SchemaDesigner: React.FC<SchemaDesignerProps> = ({
  databaseId,
  onSchemaChange
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  const handleTableCreate = async (tableData: CreateTableRequest) => {
    const validation = await SchemaValidationService.validateTableSchema(tableData);
    
    if (!validation.isValid) {
      toast.error('Schema validation failed', {
        description: validation.errors.map(e => e.message).join(', ')
      });
      return;
    }
    
    const newTable = await TableCreationService.createTable(databaseId, tableData);
    setTables(prev => [...prev, newTable]);
    onSchemaChange();
  };
  
  const handleTableUpdate = async (tableId: number, updates: Partial<Table>) => {
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: updates
    });
    
    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    onSchemaChange();
  };
  
  return (
    <div className="schema-designer">
      <div className="toolbar">
        <Button onClick={() => setShowCreateTable(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Table
        </Button>
      </div>
      
      <div className="canvas">
        {tables.map(table => (
          <TableNode
            key={table.id}
            table={table}
            onSelect={() => setSelectedTable(table)}
            onUpdate={(updates) => handleTableUpdate(table.id, updates)}
          />
        ))}
        
        {relationships.map(rel => (
          <RelationshipLine
            key={rel.id}
            relationship={rel}
            tables={tables}
          />
        ))}
      </div>
      
      {selectedTable && (
        <TableEditor
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onUpdate={(updates) => handleTableUpdate(selectedTable.id, updates)}
        />
      )}
    </div>
  );
};
```

### 2. Schema Templates

#### Pre-built Schema Templates
```typescript
// Schema template system
export const schemaTemplates: SchemaTemplate[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Complete e-commerce database schema',
    tables: [
      {
        name: 'customers',
        displayName: 'Customers',
        description: 'Customer information',
        columns: [
          { name: 'id', dataType: DataType.INTEGER, semanticType: SemanticColumnType.PRIMARY_KEY, isRequired: true },
          { name: 'email', dataType: DataType.VARCHAR, semanticType: SemanticColumnType.EMAIL, isRequired: true, maxLength: 255 },
          { name: 'first_name', dataType: DataType.VARCHAR, maxLength: 100 },
          { name: 'last_name', dataType: DataType.VARCHAR, maxLength: 100 },
          { name: 'phone', dataType: DataType.VARCHAR, semanticType: SemanticColumnType.PHONE, maxLength: 20 },
          { name: 'created_at', dataType: DataType.DATETIME, isRequired: true }
        ]
      },
      {
        name: 'products',
        displayName: 'Products',
        description: 'Product catalog',
        columns: [
          { name: 'id', dataType: DataType.INTEGER, semanticType: SemanticColumnType.PRIMARY_KEY, isRequired: true },
          { name: 'name', dataType: DataType.VARCHAR, semanticType: SemanticColumnType.PRODUCT_NAME, isRequired: true, maxLength: 255 },
          { name: 'description', dataType: DataType.TEXT },
          { name: 'price', dataType: DataType.DECIMAL, semanticType: SemanticColumnType.PRODUCT_PRICE, precision: 10, scale: 2 },
          { name: 'vat_rate', dataType: DataType.DECIMAL, semanticType: SemanticColumnType.PRODUCT_VAT, precision: 5, scale: 2 },
          { name: 'stock_quantity', dataType: DataType.INTEGER, isRequired: true },
          { name: 'created_at', dataType: DataType.DATETIME, isRequired: true }
        ]
      }
    ],
    relationships: [
      {
        name: 'customer_orders',
        type: RelationshipType.ONE_TO_MANY,
        sourceTable: 'customers',
        targetTable: 'orders',
        sourceColumn: 'id',
        targetColumn: 'customer_id'
      }
    ]
  }
];

// Template application service
export class SchemaTemplateService {
  static async applyTemplate(
    databaseId: number,
    templateId: string
  ): Promise<Table[]> {
    const template = schemaTemplates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    const createdTables: Table[] = [];
    
    for (const tableTemplate of template.tables) {
      const table = await TableCreationService.createTable(databaseId, tableTemplate);
      createdTables.push(table);
    }
    
    // Create relationships after all tables are created
    for (const relTemplate of template.relationships) {
      const sourceTable = createdTables.find(t => t.name === relTemplate.sourceTable);
      const targetTable = createdTables.find(t => t.name === relTemplate.targetTable);
      
      if (sourceTable && targetTable) {
        await prisma.relationship.create({
          data: {
            tableId: sourceTable.id,
            name: relTemplate.name,
            type: relTemplate.type,
            sourceColumnId: sourceTable.columns.find(c => c.name === relTemplate.sourceColumn)!.id,
            targetTableId: targetTable.id,
            targetColumnId: targetTable.columns.find(c => c.name === relTemplate.targetColumn)!.id
          }
        });
      }
    }
    
    return createdTables;
  }
}
```

### 3. Schema Import/Export

#### Schema Export Service
```typescript
// Schema export service
export class SchemaExportService {
  static async exportSchema(databaseId: number): Promise<SchemaExport> {
    const database = await prisma.database.findUnique({
      where: { id: databaseId },
      include: {
        tables: {
          include: {
            columns: true,
            relationships: true,
            indexes: {
              include: {
                columns: true
              }
            }
          }
        }
      }
    });
    
    if (!database) {
      throw new Error('Database not found');
    }
    
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      database: {
        name: database.name,
        description: database.description
      },
      tables: database.tables.map(table => ({
        name: table.name,
        displayName: table.displayName,
        description: table.description,
        columns: table.columns.map(column => ({
          name: column.name,
          displayName: column.displayName,
          description: column.description,
          dataType: column.dataType,
          semanticType: column.semanticType,
          isRequired: column.isRequired,
          isUnique: column.isUnique,
          defaultValue: column.defaultValue,
          maxLength: column.maxLength,
          precision: column.precision,
          scale: column.scale
        })),
        relationships: table.relationships.map(rel => ({
          name: rel.name,
          type: rel.type,
          targetTable: rel.targetTable.name,
          targetColumn: rel.targetColumn.name,
          onDelete: rel.onDelete,
          onUpdate: rel.onUpdate
        })),
        indexes: table.indexes.map(index => ({
          name: index.name,
          type: index.type,
          isUnique: index.isUnique,
          columns: index.columns.map(col => col.column.name)
        }))
      }))
    };
  }
  
  static async importSchema(
    databaseId: number,
    schemaExport: SchemaExport
  ): Promise<Table[]> {
    const createdTables: Table[] = [];
    
    for (const tableExport of schemaExport.tables) {
      const table = await TableCreationService.createTable(databaseId, {
        name: tableExport.name,
        displayName: tableExport.displayName,
        description: tableExport.description,
        columns: tableExport.columns.map(col => ({
          name: col.name,
          displayName: col.displayName,
          description: col.description,
          dataType: col.dataType,
          semanticType: col.semanticType,
          isRequired: col.isRequired,
          isUnique: col.isUnique,
          defaultValue: col.defaultValue,
          maxLength: col.maxLength,
          precision: col.precision,
          scale: col.scale
        }))
      });
      
      createdTables.push(table);
    }
    
    return createdTables;
  }
}
```

## Common Issues & Solutions

### 1. Schema Validation Errors

**Problem**: Schema validation failing for valid table structures
**Solution**:
- Implement comprehensive validation rules
- Add detailed error messages
- Provide validation preview before creation

### 2. Relationship Creation Issues

**Problem**: Foreign key relationships not working correctly
**Solution**:
- Validate relationship compatibility
- Check column data types match
- Implement relationship validation

### 3. Migration Failures

**Problem**: Generated migrations failing to execute
**Solution**:
- Validate SQL syntax before execution
- Implement rollback mechanisms
- Add migration testing

## Future Enhancements

### 1. Advanced Features
- **Visual Query Builder**: Drag-and-drop query creation
- **Schema Versioning**: Track schema changes over time
- **Performance Analysis**: Analyze query performance and suggest optimizations

### 2. Integration Features
- **Database Sync**: Sync schemas across multiple databases
- **API Generation**: Auto-generate APIs from schema
- **Documentation Generation**: Auto-generate documentation from schema

### 3. Collaboration Features
- **Schema Sharing**: Share schemas between teams
- **Review Process**: Schema change approval workflow
- **Comments**: Add comments to schema elements
