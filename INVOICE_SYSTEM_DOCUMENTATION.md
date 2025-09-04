# Invoice System Documentation - PDF Generation MVP

## Overview

This is a minimal invoice system focused exclusively on internal PDF invoice generation. The system allows creating, managing, and generating professional PDF invoices for internal use without external integrations.

## Features

### 1. Invoice Management
- **Create, Edit, Delete Invoices**: Full CRUD operations for invoice management
- **Invoice Status Tracking**: Draft, Issued, Paid, Overdue, Cancelled
- **Customer Management**: Basic customer database with VAT ID tracking
- **Item Management**: Detailed line items with quantities, prices, and VAT calculations
- **Multi-currency Support**: Support for multiple currencies with conversion
- **Payment Terms**: Configurable payment terms and methods

### 2. PDF Generation
- **Professional PDF Output**: Generate well-formatted PDF invoices
- **Romanian Compliance**: Invoices comply with Romanian fiscal requirements
- **Custom Styling**: Professional invoice layouts and formatting
- **Export Options**: PDF download and potential simple CSV export

### 3. Invoice Templates
- **Template Management**: Create and manage custom invoice templates
- **Template Types**: Standard, Proforma, Credit Note, Quote
- **HTML/CSS Styling**: Full control over template appearance
- **Dynamic Content**: Support for variables and dynamic data
- **Page Settings**: Configurable page size, orientation, and margins
- **Preview System**: Real-time template preview

### 3. Invoice Series Management
- **Numbering Series**: Configurable invoice numbering
- **Series Configuration**: Prefix, suffix, separator options
- **Date Integration**: Optional year and month inclusion
- **Yearly Reset**: Automatic numbering reset options
- **Series Validation**: Prevent duplicate series names

## Architecture

### Database Schema

#### Core Tables
- `invoices`: Main invoice data
- `invoice_items`: Line items for each invoice
- `customers`: Customer information
- `invoice_series`: Numbering series configuration
- `invoice_audit_logs`: Audit trail

### API Endpoints

#### Invoice Management
- `GET /api/tenants/[tenantId]/invoices` - List invoices
- `POST /api/tenants/[tenantId]/invoices` - Create invoice
- `PUT /api/tenants/[tenantId]/invoices/[id]` - Update invoice
- `DELETE /api/tenants/[tenantId]/invoices/[id]` - Delete invoice
- `GET /api/tenants/[tenantId]/invoices/[id]/pdf` - Generate PDF

#### Series Management
- `GET /api/tenants/[tenantId]/invoices/series` - List series
- `POST /api/tenants/[tenantId]/invoices/series` - Create series
- `PUT /api/tenants/[tenantId]/invoices/series` - Update series
- `DELETE /api/tenants/[tenantId]/invoices/series` - Delete series

### Components

#### Core Components
- `InvoiceForm`: Create/edit invoice form
- `InvoiceList`: Display invoice list with filters
- `SeriesManager`: Series configuration interface
- `EnhancedPDFGenerator`: PDF generation service

## Usage

### Creating an Invoice

1. Navigate to the Invoices section
2. Click "New Invoice"
3. Fill in customer information
4. Add line items with quantities, prices, and VAT
5. Configure payment terms
6. Save the invoice

### Generating PDF Invoices

1. From the invoice list, click on an invoice
2. Click "Generate PDF" button
3. The PDF will be generated and downloaded automatically
4. PDFs include all invoice details formatted professionally

### Managing Invoice Series

1. Go to Series configuration
2. Set up numbering prefixes and formats
3. Configure yearly reset options
4. Save series configuration

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/db"
DIRECT_URL="postgresql://username:password@localhost:5432/db"

# Optional: Email Configuration for invoice delivery
SMTP_HOST="mail.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

### Database Migration

Run the following command to apply database changes:

```bash
npx prisma migrate dev --name add-invoice-system-tables
```

### Initial Setup

1. Run database migrations
2. Configure environment variables
3. Create default invoice series
4. Start creating invoices and generating PDFs

## PDF Generation

### PDF Library
The system uses `pdf-lib` for generating professional PDF invoices.

### PDF Features
- Professional invoice layout
- Company branding support
- VAT calculations
- Multi-currency formatting
- Romanian fiscal compliance

## File Locations

### Core Invoice Logic
- `src/lib/invoice-system.ts` - Main invoice service
- `src/lib/invoice-calculations.ts` - VAT and totals calculations
- `src/lib/pdf-enhanced-generator.ts` - PDF generation logic

### UI Components
- `src/components/invoice/EnhancedInvoiceList.tsx` - Invoice listing and management
- `src/app/home/invoices/page.tsx` - Main invoice page

This clean, minimal system focuses exclusively on creating and generating professional PDF invoices for internal use.
