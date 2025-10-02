# Quick Fixes for Critical Issues

This document provides immediate fixes for the most critical issues found in the invoice generation subsystem audit.

## 1. Fix Build Error (CRITICAL - Blocks Deployment) ✅ FIXED

**Issue**: Zod validation error in widget resolve endpoint
**Files**: `src/widgets/schemas/base.ts` and `src/widgets/schemas/chart.ts`
**Status**: ✅ **RESOLVED** - Build now passes successfully

```typescript
// BEFORE (causing build failure)
export const widgetPositionSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  // ...
});

// AFTER (fixed)
export const widgetPositionSchema = z.object({
  x: z.coerce.number().int().nonnegative(),
  y: z.coerce.number().int().nonnegative(),
  w: z.coerce.number().int().positive(),
  h: z.coerce.number().int().positive(),
  minW: z.coerce.number().int().positive().optional(),
  minH: z.coerce.number().int().positive().optional(),
  maxW: z.coerce.number().int().positive().optional(),
  maxH: z.coerce.number().int().positive().optional(),
  static: z.boolean().optional(),
});

// ADDITIONAL FIX for mappings.y field:
// BEFORE (causing build failure)
y: z.array(z.string()).default([]),

// AFTER (fixed)
y: z.union([z.array(z.string()), z.string()]).transform(val => Array.isArray(val) ? val : val ? [val] : []).default([]),
```

**Verification**: Build now completes successfully with exit code 0

## 2. Fix Invoice Numbering Race Condition (HIGH PRIORITY)

**Issue**: Concurrent requests can create duplicate invoice numbers
**File**: `src/app/api/tenants/[tenantId]/invoices/route.ts`

```typescript
// BEFORE (race condition)
const lastInvoice = await prisma.row.findFirst({
  where: { tableId: invoicesTable.id },
  orderBy: { id: 'desc' }
});
const nextNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber) + 1 : 1;

// AFTER (atomic)
async function generateInvoiceNumber(tx: PrismaTransaction, tenantId: number, databaseId: number): Promise<string> {
  const series = await tx.invoiceSeries.upsert({
    where: { 
      tenantId_databaseId_series: { 
        tenantId, 
        databaseId, 
        series: 'default' 
      } 
    },
    update: { currentNumber: { increment: 1 } },
    create: { 
      tenantId, 
      databaseId, 
      series: 'default', 
      currentNumber: 1 
    },
    select: { currentNumber: true }
  });
  
  return `INV-${new Date().getFullYear()}-${series.currentNumber.toString().padStart(6, '0')}`;
}

// Wrap entire invoice creation in transaction
export async function POST(request: NextRequest) {
  return await prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber(tx, tenantId, databaseId);
    // ... rest of invoice creation logic
  });
}
```

## 3. Fix Monetary Calculation Precision (HIGH PRIORITY)

**Issue**: JavaScript floating-point arithmetic causes rounding errors
**File**: `src/lib/invoice-calculations.ts`

First, install Decimal.js:
```bash
npm install decimal.js
npm install --save-dev @types/decimal.js
```

Then replace the calculation logic:

```typescript
// BEFORE (unsafe)
const lineTotal = quantity * unitPrice * (1 - discountRate);
const itemVat = (lineTotal * safeVatRate) / 100;

// AFTER (safe)
import { Decimal } from 'decimal.js';

const lineTotal = new Decimal(quantity)
  .mul(unitPrice)
  .mul(new Decimal(1).sub(discountRate))
  .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

const itemVat = lineTotal
  .mul(safeVatRate)
  .div(100)
  .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
```

## 4. Fix Reference Column Handling (HIGH PRIORITY)

**Issue**: invoice_id saved as single value instead of array
**File**: `src/app/api/tenants/[tenantId]/invoices/route.ts`

```typescript
// BEFORE (incorrect)
itemCells.push({
  rowId: itemRow.id,
  columnId: columns.invoice_id.id,
  value: invoiceRow.id, // ❌ Single value
});

// AFTER (correct)
itemCells.push({
  rowId: itemRow.id,
  columnId: columns.invoice_id.id,
  value: [invoiceRow.id], // ✅ Array for reference columns
});
```

## 5. Add Database Transaction Boundaries (HIGH PRIORITY)

**Issue**: Missing transaction boundaries can cause data inconsistency
**File**: `src/app/api/tenants/[tenantId]/invoices/route.ts`

```typescript
// BEFORE (no transaction)
const invoiceRow = await prisma.row.create({...});
const itemRows = await prisma.row.createMany({...});

// AFTER (with transaction)
export async function POST(request: NextRequest) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generate invoice number atomically
      const invoiceNumber = await generateInvoiceNumber(tx, tenantId, databaseId);
      
      // Create invoice
      const invoiceRow = await tx.row.create({
        data: {
          tableId: invoicesTable.id,
          cells: {
            create: invoiceCells
          }
        }
      });
      
      // Create invoice items
      const itemRows = await tx.row.createMany({
        data: itemRowsData
      });
      
      return { invoiceRow, itemRows };
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Invoice creation failed:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
```

## 6. Fix Input Validation (MEDIUM PRIORITY)

**Issue**: Missing validation for monetary inputs
**File**: `src/lib/invoice-form-validator.ts`

```typescript
// Add validation schema
import { z } from 'zod';

export const invoiceItemSchema = z.object({
  product_ref_id: z.number().int().positive(),
  quantity: z.number().positive().finite(),
  price: z.number().finite().min(0),
  currency: z.string().min(3).max(3),
  product_vat: z.number().min(0).max(100)
});

export const createInvoiceSchema = z.object({
  customer_id: z.number().int().positive(),
  products: z.array(invoiceItemSchema).min(1),
  additional_data: z.record(z.any()).optional()
});

// Use in API route
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = createInvoiceSchema.parse(body);
  // ... rest of logic
}
```

## 7. Add Error Handling (MEDIUM PRIORITY)

**Issue**: Inconsistent error handling across endpoints
**File**: `src/app/api/tenants/[tenantId]/invoices/route.ts`

```typescript
// Add comprehensive error handling
export async function POST(request: NextRequest) {
  try {
    // ... invoice creation logic
  } catch (error) {
    console.error('Invoice creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }
    
    if (error.code === 'P2002') { // Prisma unique constraint error
      return NextResponse.json({
        error: 'Invoice number already exists'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

## 8. Fix PDF Generation Build Error (MEDIUM PRIORITY)

**Issue**: PDF generation may fail due to template issues
**File**: `src/lib/invoice-template.ts`

```typescript
// Add error handling for template generation
export class InvoiceTemplate {
  static generateHTML(data: InvoiceData): string {
    try {
      // Validate required data
      if (!data.invoice || !data.customer || !data.items) {
        throw new Error('Missing required invoice data');
      }
      
      // ... template generation logic
      
      return html;
    } catch (error) {
      console.error('Template generation error:', error);
      return this.generateErrorTemplate(error.message);
    }
  }
  
  private static generateErrorTemplate(errorMessage: string): string {
    return `
      <html>
        <body>
          <h1>Invoice Generation Error</h1>
          <p>Unable to generate invoice: ${errorMessage}</p>
          <p>Please contact support.</p>
        </body>
      </html>
    `;
  }
}
```

## Testing the Fixes

### 1. Test Build Fix
```bash
npm run build
# Should complete without errors
```

### 2. Test Race Condition Fix
```bash
node invoices-audit/replicable-cases/invoice-creation-race-condition.js
# Should show no duplicate invoice numbers
```

### 3. Test Precision Fix
```bash
node invoices-audit/replicable-cases/monetary-precision-errors.js
# Should show correct calculations
```

### 4. Test API Endpoints
```bash
chmod +x invoices-audit/replicable-cases/curl-test-commands.sh
./invoices-audit/replicable-cases/curl-test-commands.sh
```

## Deployment Checklist

- [ ] Build passes without errors
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Race condition test shows no duplicates
- [ ] Precision test shows correct calculations
- [ ] API endpoints return expected responses
- [ ] Database migrations are ready
- [ ] Rollback plan is prepared

## Priority Order for Implementation

1. **Fix build error** (blocks all deployments)
2. **Fix race condition** (prevents data corruption)
3. **Fix precision errors** (prevents financial errors)
4. **Fix reference columns** (prevents API errors)
5. **Add transactions** (prevents data inconsistency)
6. **Add validation** (prevents invalid data)
7. **Add error handling** (improves reliability)
8. **Fix PDF generation** (improves user experience)

## Estimated Time to Fix

- **Critical fixes (1-3)**: 2-4 hours
- **High priority fixes (4-5)**: 4-6 hours  
- **Medium priority fixes (6-8)**: 6-8 hours
- **Total**: 12-18 hours of development time

## Next Steps After Quick Fixes

1. Run comprehensive test suite
2. Implement monitoring and alerting
3. Add performance optimizations
4. Enhance security measures
5. Add audit logging
6. Implement rate limiting
