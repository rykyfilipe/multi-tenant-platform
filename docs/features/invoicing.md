# Advanced Invoicing System

The invoicing system provides comprehensive invoice management with multi-currency support, automatic calculations, PDF generation, and integration with external payment systems.

## Overview

The invoicing system enables businesses to:

- **Generate Professional Invoices**: Multi-currency invoice creation with automatic calculations
- **Manage Customer Data**: Integrated customer database with billing information
- **Track Payment Status**: Real-time payment tracking and status updates
- **Export to PDF**: Professional PDF generation with customizable templates
- **Multi-Currency Support**: Automatic currency conversion and exchange rate handling
- **Tax Calculations**: Automatic VAT/tax calculations based on product and customer location

## Architecture Components

### 1. Invoice Data Model

#### Dynamic Invoice Tables
The invoice system uses dynamic tables created through the module system:

```typescript
// Invoice system creates three main tables dynamically
interface InvoiceTables {
  customers: Table;      // Customer information
  invoices: Table;       // Invoice headers
  invoice_items: Table;  // Invoice line items
}

// Invoice data structure
interface InvoiceData {
  id: number;
  invoice_number: string;
  date: string;
  customer_id: number;
  customer_data: any;
  items: any[];
  additional_data?: Record<string, any>;
}

// Invoice product structure
interface InvoiceProduct {
  product_ref_table: string;
  product_ref_id: number;
  quantity: number;
  price?: number;
  description?: string;
  unit_of_measure?: string;
  currency?: string;
  original_price?: number;
  converted_price?: number;
}
```

### 2. Customer Management

#### Customer Data Structure
```typescript
// Customer data is stored in dynamic tables created by the invoice module
interface CustomerData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  currency?: string;
  payment_terms?: string;
  credit_limit?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}
```

### 3. Product Management

#### Product Reference System
```typescript
// Products are referenced from tenant tables
interface ProductReference {
  tableName: string;    // Source table name
  productId: number;   // Product ID in source table
  name: string;         // Product name
  description?: string; // Product description
  price: number;        // Base price
  currency: string;     // Product currency
  vatRate?: number;     // VAT rate percentage
  unitOfMeasure?: string; // Unit of measure
}
```

## Implementation Details

### 1. Invoice Creation Process

#### Invoice Creation API
```typescript
// API: POST /api/tenants/[tenantId]/invoices
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate request using Zod schema
  const parseResult = CreateInvoiceSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({
      error: "Validation failed",
      details: parseResult.error.errors
    }, { status: 400 });
  }
  
  const invoiceData = parseResult.data;
  
  // Get invoice system tables
  const invoiceTables = await InvoiceSystemService.getInvoiceTables(
    tenantId, 
    databaseId
  );
  
  // Validate required tables exist
  if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
    return NextResponse.json({
      error: "Invoice system not properly initialized"
    }, { status: 500 });
  }
  
  // Create invoice with automatic calculations
  const result = await createInvoiceWithCalculations(invoiceData, invoiceTables);
  
  return NextResponse.json(result);
}
```

#### Automatic Calculation Service
```typescript
// Invoice calculation service
export class InvoiceCalculationService {
  static async calculateInvoiceTotals(
    items: InvoiceItemForCalculation[],
    options: CalculationOptions
  ): Promise<InvoiceTotals> {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    
    // Calculate line totals for each item
    for (const item of items) {
      // Convert currency if needed
      const convertedPrice = await this.convertCurrency(
        item.originalPrice,
        item.currency,
        options.baseCurrency,
        options.exchangeRates
      );
      
      // Calculate line subtotal
      const lineSubtotal = convertedPrice * item.quantity;
      
      // Apply discount
      const discountAmount = lineSubtotal * (item.discountRate || 0) / 100;
      const discountedSubtotal = lineSubtotal - discountAmount;
      
      // Calculate tax
      const taxAmount = discountedSubtotal * (item.taxRate || 0) / 100;
      
      // Update totals
      subtotal += discountedSubtotal;
      taxTotal += taxAmount;
      discountTotal += discountAmount;
      
      // Update item with calculated values
      item.convertedPrice = convertedPrice;
      item.discountAmount = discountAmount;
      item.taxAmount = taxAmount;
      item.lineTotal = discountedSubtotal + taxAmount;
    }
    
    const grandTotal = subtotal + taxTotal;
    
    return {
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      items: items.map(item => ({
        ...item,
        calculated: true
      }))
    };
  }
  
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: Record<string, number>
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Get exchange rate
    const rate = exchangeRates[`${fromCurrency}_${toCurrency}`] || 1;
    return amount * rate;
  }
}
```

### 2. PDF Generation

#### PDF Template System
```typescript
// PDF generation service
export class InvoicePDFService {
  static async generateInvoicePDF(invoice: InvoiceWithDetails): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });
    
    // Add header with company logo and details
    await this.addHeader(doc, invoice.tenant);
    
    // Add invoice details
    this.addInvoiceDetails(doc, invoice);
    
    // Add customer information
    this.addCustomerInfo(doc, invoice.customer);
    
    // Add invoice items table
    this.addInvoiceItemsTable(doc, invoice.items);
    
    // Add totals section
    this.addTotalsSection(doc, invoice);
    
    // Add footer
    this.addFooter(doc, invoice.tenant);
    
    return this.generatePDFBuffer(doc);
  }
  
  private static addInvoiceItemsTable(doc: PDFDocument, items: InvoiceItem[]) {
    // Table headers
    doc.fontSize(10).text('Description', 50, 300);
    doc.text('Qty', 300, 300);
    doc.text('Price', 350, 300);
    doc.text('Total', 450, 300);
    
    // Table rows
    let yPosition = 320;
    items.forEach(item => {
      doc.text(item.description || '', 50, yPosition);
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(item.price.toFixed(2), 350, yPosition);
      doc.text(item.lineTotal.toFixed(2), 450, yPosition);
      yPosition += 20;
    });
  }
}
```

### 3. Multi-Currency Support

#### Currency Management
```typescript
// Currency service for exchange rates
export class CurrencyService {
  private static exchangeRates: Record<string, number> = {};
  private static lastUpdate: Date | null = null;
  
  static async getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    // Check if rates are fresh (less than 1 hour old)
    if (this.lastUpdate && Date.now() - this.lastUpdate.getTime() < 3600000) {
      return this.exchangeRates;
    }
    
    try {
      // Fetch from external API (e.g., Fixer.io, ExchangeRate-API)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );
      const data = await response.json();
      
      this.exchangeRates = data.rates;
      this.lastUpdate = new Date();
      
      return this.exchangeRates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      return this.exchangeRates; // Return cached rates as fallback
    }
  }
  
  static convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
  }
}
```

### 4. Invoice Status Management

#### Status Workflow
```typescript
// Invoice status is managed through dynamic table columns
// Common status values used in the system:
const InvoiceStatus = {
  DRAFT: "draft",           // Being created
  SENT: "sent",             // Sent to customer
  VIEWED: "viewed",         // Customer viewed
  PAID: "paid",             // Payment received
  OVERDUE: "overdue",       // Past due date
  CANCELLED: "cancelled",   // Cancelled
  REFUNDED: "refunded"      // Refunded
} as const;

// Status transition service
export class InvoiceStatusService {
  static async updateStatus(
    invoiceId: number,
    newStatus: InvoiceStatus,
    userId: number,
    notes?: string
  ): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Validate status transition
    const validTransitions = this.getValidTransitions(invoice.status);
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${invoice.status} to ${newStatus}`);
    }
    
    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });
    
    // Log status change
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId,
        action: 'STATUS_CHANGE',
        oldValue: invoice.status,
        newValue: newStatus,
        userId,
        notes
      }
    });
  }
  
  private static getValidTransitions(currentStatus: InvoiceStatus): InvoiceStatus[] {
    const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.SENT, InvoiceStatus.CANCELLED],
      [InvoiceStatus.SENT]: [InvoiceStatus.VIEWED, InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
      [InvoiceStatus.VIEWED]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
      [InvoiceStatus.PAID]: [InvoiceStatus.REFUNDED],
      [InvoiceStatus.OVERDUE]: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      [InvoiceStatus.CANCELLED]: [],
      [InvoiceStatus.REFUNDED]: []
    };
    
    return transitions[currentStatus] || [];
  }
}
```

## Advanced Features

### 1. Invoice Templates

#### Template System
```typescript
// Invoice template configuration
interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  layout: {
    header: TemplateSection;
    customerInfo: TemplateSection;
    itemsTable: TemplateSection;
    totals: TemplateSection;
    footer: TemplateSection;
  };
  styling: {
    fontFamily: string;
    fontSize: number;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

// Template application service
export class InvoiceTemplateService {
  static async applyTemplate(
    invoice: Invoice,
    templateId: string
  ): Promise<Buffer> {
    const template = await this.getTemplate(templateId);
    
    // Generate PDF with template styling
    const doc = new PDFDocument({
      size: 'A4',
      font: template.styling.fontFamily
    });
    
    // Apply template sections
    await this.renderHeader(doc, template.layout.header, invoice);
    this.renderCustomerInfo(doc, template.layout.customerInfo, invoice.customer);
    this.renderItemsTable(doc, template.layout.itemsTable, invoice.items);
    this.renderTotals(doc, template.layout.totals, invoice);
    this.renderFooter(doc, template.layout.footer, invoice.tenant);
    
    return this.generatePDFBuffer(doc);
  }
}
```

### 2. Payment Integration

#### Stripe Integration
```typescript
// Payment processing service
export class PaymentService {
  static async createPaymentIntent(
    invoice: Invoice,
    amount: number,
    currency: string
  ): Promise<PaymentIntent> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        invoiceId: invoice.id.toString(),
        tenantId: invoice.tenantId.toString(),
        customerId: invoice.customerId.toString()
      },
      description: `Payment for invoice ${invoice.invoiceNumber}`
    });
    
    return paymentIntent;
  }
  
  static async handlePaymentSuccess(paymentIntent: PaymentIntent): Promise<void> {
    const invoiceId = parseInt(paymentIntent.metadata.invoiceId);
    
    // Update invoice status to paid
    await InvoiceStatusService.updateStatus(
      invoiceId,
      InvoiceStatus.PAID,
      0, // System user
      `Payment received via Stripe: ${paymentIntent.id}`
    );
    
    // Send payment confirmation email
    await EmailService.sendPaymentConfirmation(invoiceId);
  }
}
```

### 3. Audit Trail

#### Comprehensive Audit Logging
```typescript
// Invoice audit logging
export class InvoiceAuditService {
  static async logAction(
    invoiceId: number,
    action: string,
    oldValue: any,
    newValue: any,
    userId: number,
    notes?: string
  ): Promise<void> {
    await prisma.invoiceAuditLog.create({
      data: {
        invoiceId,
        action,
        oldValue: JSON.stringify(oldValue),
        newValue: JSON.stringify(newValue),
        userId,
        notes,
        timestamp: new Date(),
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent()
      }
    });
  }
  
  static async getAuditTrail(invoiceId: number): Promise<InvoiceAuditLog[]> {
    return prisma.invoiceAuditLog.findMany({
      where: { invoiceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}
```

## Common Issues & Solutions

### 1. Currency Conversion Errors

**Problem**: Incorrect currency conversion rates
**Solution**:
- Implement fallback exchange rate sources
- Cache rates with TTL
- Validate conversion accuracy

### 2. PDF Generation Issues

**Problem**: PDF generation fails or produces incorrect output
**Solution**:
- Implement error handling and retry logic
- Validate PDF template structure
- Add PDF preview functionality

### 3. Payment Processing Failures

**Problem**: Payment integration not working correctly
**Solution**:
- Implement webhook validation
- Add payment status reconciliation
- Create payment retry mechanisms

## Future Enhancements

### 1. Advanced Features
- **Recurring Invoices**: Automated recurring billing
- **Payment Plans**: Installment payment options
- **Credit Notes**: Credit note generation and management

### 2. Integrations
- **Accounting Software**: QuickBooks, Xero integration
- **Banking APIs**: Direct bank payment processing
- **Tax Services**: Automated tax calculation and filing

### 3. Analytics & Reporting
- **Revenue Analytics**: Detailed revenue reporting
- **Customer Insights**: Payment behavior analysis
- **Cash Flow Forecasting**: Predictive cash flow analysis
