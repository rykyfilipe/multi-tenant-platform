# Ghid Profesional: Schimbarea Tipului unei Coloane

## 🎯 Problema Actuală

Când modifici tipul unei coloane (ex: `string` → `number`), sistemul actual face doar:
```typescript
await prisma.column.update({
    where: { id: columnId },
    data: { type: newType }
});
```

**Celulele existente NU sunt gestionate**, rezultând în:
- ❌ Date incompatibile (string-uri în coloane numerice)
- ❌ Erori de validare
- ❌ UI broken
- ❌ Filtre și agregări defecte

---

## ✅ Soluție Profesională Recomandată

### Approach: **Safe Migration cu Validare și Preview**

#### 1. **Pre-Flight Check** (Verificare înainte de modificare)
```typescript
async function analyzeTypeChange(columnId: number, newType: string) {
    const column = await prisma.column.findUnique({
        where: { id: columnId },
        include: {
            cells: {
                take: 1000, // Sample
                select: { value: true }
            }
        }
    });

    const oldType = column.type;
    const totalCells = await prisma.cell.count({
        where: { columnId }
    });

    // Analyze compatibility
    const analysis = {
        totalCells,
        convertible: 0,
        lossyConversion: 0,
        willFail: 0,
        examples: {
            success: [],
            loss: [],
            fail: []
        }
    };

    for (const cell of column.cells) {
        const result = attemptConversion(cell.value, oldType, newType);
        
        if (result.success && !result.dataLoss) {
            analysis.convertible++;
            if (analysis.examples.success.length < 5) {
                analysis.examples.success.push({
                    original: cell.value,
                    converted: result.newValue
                });
            }
        } else if (result.success && result.dataLoss) {
            analysis.lossyConversion++;
            if (analysis.examples.loss.length < 5) {
                analysis.examples.loss.push({
                    original: cell.value,
                    converted: result.newValue,
                    warning: result.warning
                });
            }
        } else {
            analysis.willFail++;
            if (analysis.examples.fail.length < 5) {
                analysis.examples.fail.push({
                    original: cell.value,
                    error: result.error
                });
            }
        }
    }

    return analysis;
}
```

#### 2. **Conversion Logic** (Logica de conversie)
```typescript
function attemptConversion(
    value: any, 
    fromType: string, 
    toType: string
): ConversionResult {
    // NULL handling
    if (value === null || value === undefined) {
        return { success: true, newValue: null, dataLoss: false };
    }

    const conversions = {
        'string->number': (v) => {
            if (v === '') return { success: true, newValue: null };
            const num = Number(v);
            if (isNaN(num)) {
                return { 
                    success: false, 
                    error: `Cannot convert "${v}" to number` 
                };
            }
            return { success: true, newValue: num };
        },

        'string->boolean': (v) => {
            const lower = v.toLowerCase().trim();
            if (['true', '1', 'yes', 'da'].includes(lower)) {
                return { success: true, newValue: true };
            }
            if (['false', '0', 'no', 'nu', ''].includes(lower)) {
                return { success: true, newValue: false };
            }
            return { 
                success: false, 
                error: `Cannot convert "${v}" to boolean` 
            };
        },

        'string->date': (v) => {
            if (v === '') return { success: true, newValue: null };
            const date = new Date(v);
            if (isNaN(date.getTime())) {
                return { 
                    success: false, 
                    error: `Cannot convert "${v}" to date` 
                };
            }
            return { success: true, newValue: date.toISOString() };
        },

        'number->string': (v) => {
            return { success: true, newValue: String(v) };
        },

        'number->boolean': (v) => {
            return { 
                success: true, 
                newValue: v !== 0,
                dataLoss: v > 1 || v < 0,
                warning: v > 1 ? 'Numbers > 1 become true' : 
                         v < 0 ? 'Negative numbers become true' : undefined
            };
        },

        'boolean->string': (v) => {
            return { success: true, newValue: v ? 'true' : 'false' };
        },

        'boolean->number': (v) => {
            return { success: true, newValue: v ? 1 : 0 };
        },

        'date->string': (v) => {
            return { 
                success: true, 
                newValue: new Date(v).toISOString() 
            };
        },

        // Fallback: try toString
        'default': (v) => {
            try {
                return { 
                    success: true, 
                    newValue: String(v),
                    dataLoss: true,
                    warning: 'Converted to string representation'
                };
            } catch (e) {
                return { 
                    success: false, 
                    error: 'Cannot convert value' 
                };
            }
        }
    };

    const conversionKey = `${fromType}->${toType}`;
    const converter = conversions[conversionKey] || conversions.default;
    
    return converter(value);
}
```

#### 3. **User Confirmation UI** (UI de confirmare)
```typescript
// În frontend, după analysis:
if (analysis.willFail > 0) {
    showWarningDialog({
        title: "Type Change Will Cause Data Loss",
        message: `${analysis.willFail} cells cannot be converted and will become NULL.`,
        examples: analysis.examples.fail,
        actions: [
            {
                label: "Cancel",
                variant: "secondary"
            },
            {
                label: "Delete Failed Cells & Continue",
                variant: "destructive",
                onConfirm: () => executeTypeChange({ deleteIncompatible: true })
            },
            {
                label: "Convert Failed to NULL",
                variant: "warning",
                onConfirm: () => executeTypeChange({ convertToNull: true })
            }
        ]
    });
} else if (analysis.lossyConversion > 0) {
    showWarningDialog({
        title: "Type Change Will Modify Data",
        message: `${analysis.lossyConversion} cells will lose precision or be approximated.`,
        examples: analysis.examples.loss,
        actions: [
            {
                label: "Cancel",
                variant: "secondary"
            },
            {
                label: "Accept Data Loss",
                variant: "warning",
                onConfirm: () => executeTypeChange({ acceptLoss: true })
            }
        ]
    });
} else {
    showSuccessDialog({
        title: "Safe Type Change",
        message: `All ${analysis.totalCells} cells can be safely converted.`,
        examples: analysis.examples.success.slice(0, 3),
        actions: [
            {
                label: "Cancel",
                variant: "secondary"
            },
            {
                label: "Convert All",
                variant: "primary",
                onConfirm: () => executeTypeChange({ safe: true })
            }
        ]
    });
}
```

#### 4. **Execution Phase** (Execuție cu Transaction)
```typescript
async function executeTypeChange(
    columnId: number,
    newType: string,
    options: TypeChangeOptions
): Promise<TypeChangeResult> {
    return await prisma.$transaction(async (tx) => {
        // 1. Get column and all cells
        const column = await tx.column.findUnique({
            where: { id: columnId },
            include: { cells: true }
        });

        const oldType = column.type;
        const cellUpdates = [];
        const cellsToDelete = [];
        const conversionLog = [];

        // 2. Process each cell
        for (const cell of column.cells) {
            const result = attemptConversion(
                cell.value, 
                oldType, 
                newType
            );

            if (result.success) {
                cellUpdates.push({
                    where: { id: cell.id },
                    data: { value: result.newValue }
                });
                
                conversionLog.push({
                    cellId: cell.id,
                    rowId: cell.rowId,
                    oldValue: cell.value,
                    newValue: result.newValue,
                    status: result.dataLoss ? 'lossy' : 'success',
                    warning: result.warning
                });
            } else {
                if (options.deleteIncompatible) {
                    cellsToDelete.push(cell.id);
                    conversionLog.push({
                        cellId: cell.id,
                        rowId: cell.rowId,
                        oldValue: cell.value,
                        status: 'deleted',
                        reason: result.error
                    });
                } else if (options.convertToNull) {
                    cellUpdates.push({
                        where: { id: cell.id },
                        data: { value: null }
                    });
                    conversionLog.push({
                        cellId: cell.id,
                        rowId: cell.rowId,
                        oldValue: cell.value,
                        newValue: null,
                        status: 'nullified',
                        reason: result.error
                    });
                } else {
                    throw new Error(
                        `Cannot convert cell ${cell.id}: ${result.error}`
                    );
                }
            }
        }

        // 3. Execute all updates in batches
        const BATCH_SIZE = 100;
        
        // Update cells
        for (let i = 0; i < cellUpdates.length; i += BATCH_SIZE) {
            const batch = cellUpdates.slice(i, i + BATCH_SIZE);
            await Promise.all(
                batch.map(update => tx.cell.update(update))
            );
        }

        // Delete incompatible cells
        if (cellsToDelete.length > 0) {
            await tx.cell.deleteMany({
                where: { id: { in: cellsToDelete } }
            });
        }

        // 4. Update column type
        const updatedColumn = await tx.column.update({
            where: { id: columnId },
            data: { type: newType }
        });

        // 5. Log the migration
        await tx.columnMigrationLog.create({
            data: {
                columnId,
                oldType,
                newType,
                totalCells: column.cells.length,
                successfulConversions: cellUpdates.length,
                deletedCells: cellsToDelete.length,
                lossyConversions: conversionLog.filter(
                    l => l.status === 'lossy'
                ).length,
                log: JSON.stringify(conversionLog),
                performedBy: options.userId,
                performedAt: new Date()
            }
        });

        return {
            success: true,
            column: updatedColumn,
            stats: {
                total: column.cells.length,
                converted: cellUpdates.length,
                deleted: cellsToDelete.length,
                lossy: conversionLog.filter(l => l.status === 'lossy').length
            },
            log: conversionLog
        };
    });
}
```

---

## 🏗️ Migration Table Schema (Opțional dar recomandat)

```prisma
model ColumnMigrationLog {
  id                     Int      @id @default(autoincrement())
  columnId               Int
  oldType                String
  newType                String
  totalCells             Int
  successfulConversions  Int
  deletedCells           Int
  lossyConversions       Int
  log                    Json     // Detailed conversion log
  performedBy            Int
  performedAt            DateTime @default(now())
  
  column                 Column   @relation(fields: [columnId], references: [id])
  user                   User     @relation(fields: [performedBy], references: [id])
  
  @@index([columnId])
  @@index([performedBy])
  @@index([performedAt])
}
```

---

## 📋 Alternative Approaches (Alternative)

### Approach 2: **Backup & Rollback**
```typescript
// Create backup before migration
async function createColumnBackup(columnId: number) {
    const cells = await prisma.cell.findMany({
        where: { columnId },
        select: { id: true, rowId: true, value: true }
    });

    return await prisma.columnBackup.create({
        data: {
            columnId,
            timestamp: new Date(),
            cellData: JSON.stringify(cells)
        }
    });
}

// Rollback if needed
async function rollbackTypeChange(backupId: number) {
    const backup = await prisma.columnBackup.findUnique({
        where: { id: backupId }
    });

    const cells = JSON.parse(backup.cellData);
    
    await prisma.$transaction([
        // Restore all cell values
        ...cells.map(cell => 
            prisma.cell.update({
                where: { id: cell.id },
                data: { value: cell.value }
            })
        ),
        // Restore column type
        prisma.column.update({
            where: { id: backup.columnId },
            data: { type: backup.originalType }
        })
    ]);
}
```

### Approach 3: **Staged Migration** (Pentru tabele mari)
```typescript
async function stagedTypeChange(columnId: number, newType: string) {
    // 1. Create new temporary column
    const tempColumn = await prisma.column.create({
        data: {
            name: `${originalColumn.name}_migrating`,
            type: newType,
            tableId: originalColumn.tableId,
            isTemporary: true
        }
    });

    // 2. Copy & convert data gradually
    let cursor = 0;
    const BATCH_SIZE = 1000;
    
    while (true) {
        const cells = await prisma.cell.findMany({
            where: { columnId },
            take: BATCH_SIZE,
            skip: cursor,
            orderBy: { id: 'asc' }
        });

        if (cells.length === 0) break;

        // Convert and create in new column
        const convertedCells = cells.map(cell => ({
            rowId: cell.rowId,
            columnId: tempColumn.id,
            value: convertValue(cell.value, newType)
        }));

        await prisma.cell.createMany({
            data: convertedCells
        });

        cursor += BATCH_SIZE;
        
        // Report progress
        await updateMigrationProgress(columnId, cursor);
    }

    // 3. Atomic swap
    await prisma.$transaction([
        // Delete old column cells
        prisma.cell.deleteMany({ where: { columnId } }),
        // Update temp column cells to use original column ID
        prisma.cell.updateMany({
            where: { columnId: tempColumn.id },
            data: { columnId }
        }),
        // Update original column type
        prisma.column.update({
            where: { id: columnId },
            data: { type: newType }
        }),
        // Delete temp column
        prisma.column.delete({
            where: { id: tempColumn.id }
        })
    ]);
}
```

---

## 🎨 UX Best Practices

### 1. **Progress Indicator**
```tsx
<MigrationProgress>
    <ProgressBar value={progress} max={100} />
    <Stats>
        <Stat>Processed: {processed}/{total}</Stat>
        <Stat>Converted: {converted}</Stat>
        <Stat>Failed: {failed}</Stat>
    </Stats>
    <EstimatedTime>~{estimatedMinutes} min remaining</EstimatedTime>
</MigrationProgress>
```

### 2. **Dry Run Mode**
```typescript
// Allow users to test migration first
const dryRunResult = await analyzeTypeChange(columnId, newType);

showPreview({
    title: "Migration Preview",
    changes: dryRunResult.examples,
    stats: dryRunResult,
    actions: [
        "Run Migration",
        "Export Failed Rows",
        "Cancel"
    ]
});
```

### 3. **Undo Option** (Time-Limited)
```typescript
// Keep backup for 24h
await createTemporaryBackup(columnId, {
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    allowUndo: true
});

// Show undo toast
toast.success("Type changed successfully", {
    action: {
        label: "Undo",
        onClick: () => rollbackTypeChange(backupId)
    },
    duration: 60000 // 1 minute
});
```

---

## 🚀 Implementation Priority

### Phase 1: **Essential Safety** (MUST HAVE)
1. ✅ Pre-flight analysis
2. ✅ Conversion logic for common types
3. ✅ User confirmation with examples
4. ✅ Transaction-based execution

### Phase 2: **Enhanced UX** (SHOULD HAVE)
1. ✅ Progress indicator for large tables
2. ✅ Dry run mode
3. ✅ Detailed migration log

### Phase 3: **Advanced Features** (NICE TO HAVE)
1. ✅ Backup & rollback
2. ✅ Staged migration for huge tables
3. ✅ Undo functionality
4. ✅ Migration history & audit trail

---

## 🔧 Quick Implementation

Pentru implementare rapidă, modifică `PATCH` endpoint-ul:

```typescript
export async function PATCH(request: NextRequest, { params }) {
    const { columnId } = await params;
    const body = await request.json();
    
    // If type is changing
    if (body.type && body.type !== existingColumn.type) {
        // 1. Analyze impact
        const analysis = await analyzeTypeChange(
            Number(columnId), 
            body.type
        );
        
        // 2. Check if safe
        if (analysis.willFail > 0) {
            return NextResponse.json({
                error: "Type change will cause data loss",
                analysis,
                requiresConfirmation: true
            }, { status: 400 });
        }
        
        // 3. If confirmed (via query param)
        if (request.nextUrl.searchParams.get('confirmed') === 'true') {
            const result = await executeTypeChange(
                Number(columnId),
                body.type,
                {
                    convertToNull: true,
                    userId: getUserId(sessionResult)
                }
            );
            
            return NextResponse.json(result);
        }
        
        // 4. Request confirmation
        return NextResponse.json({
            message: "Confirmation required",
            analysis,
            confirmUrl: `/api/.../columns/${columnId}?confirmed=true`
        }, { status: 428 }); // Precondition Required
    }
    
    // Normal update (non-type changes)
    const updatedColumn = await prisma.column.update({
        where: { id: Number(columnId) },
        data: body
    });
    
    return NextResponse.json(updatedColumn);
}
```

---

## 📊 Example Conversion Matrix

| From → To | String | Number | Boolean | Date | Reference |
|-----------|--------|--------|---------|------|-----------|
| **String** | ✅ | ⚠️ Parse | ⚠️ Parse | ⚠️ Parse | ❌ |
| **Number** | ✅ | ✅ | ⚠️ 0=false | ❌ | ❌ |
| **Boolean** | ✅ | ✅ 1/0 | ✅ | ❌ | ❌ |
| **Date** | ✅ ISO | ❌ | ❌ | ✅ | ❌ |
| **Reference** | ⚠️ ID | ⚠️ ID | ❌ | ❌ | ⚠️ |

✅ = Safe | ⚠️ = Lossy/Risky | ❌ = Not allowed

---

## 🎯 Concluzie

**NU lăsa utilizatorii să schimbe tipuri fără protecție!**

Implementează măcar **Phase 1** pentru:
- Siguranța datelor
- Experiență profesională
- Evitarea bug-urilor critice
- Trust-ul utilizatorilor

Este diferența între un tool "hobby" și un produs **production-ready**.

