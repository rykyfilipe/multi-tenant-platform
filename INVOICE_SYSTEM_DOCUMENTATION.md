# Enhanced Invoice System Documentation

## Overview

The Enhanced Invoice System is a comprehensive solution for managing invoices, templates, automation, and import/export functionality. It provides a complete invoice management workflow with professional features and integrations.

## Features

### 1. Invoice Management
- **Create, Edit, Delete Invoices**: Full CRUD operations for invoice management
- **Invoice Status Tracking**: Draft, Issued, Paid, Overdue, Cancelled, Credit Note, Proforma
- **Customer Management**: Integrated customer database with VAT ID tracking
- **Item Management**: Detailed line items with quantities, prices, and VAT calculations
- **Multi-currency Support**: Support for multiple currencies with conversion
- **Payment Terms**: Configurable payment terms and methods

### 2. Import/Export System
- **Multiple Import Sources**:
  - CSV files
  - Oblio.eu API
  - SmartBill API
  - FGO API
- **Export Formats**: CSV, JSON
- **Deduplication**: Smart duplicate detection and handling
- **Data Validation**: Comprehensive validation and error handling
- **Import History**: Track all import operations
- **Export History**: Track all export operations

### 3. Invoice Templates
- **Template Management**: Create and manage custom invoice templates
- **Template Types**: Standard, Proforma, Credit Note, Quote
- **HTML/CSS Styling**: Full control over template appearance
- **Dynamic Content**: Support for variables and dynamic data
- **Page Settings**: Configurable page size, orientation, and margins
- **Preview System**: Real-time template preview

### 4. Invoice Series Management
- **Numbering Series**: Configurable invoice numbering
- **Series Configuration**: Prefix, suffix, separator options
- **Date Integration**: Optional year and month inclusion
- **Yearly Reset**: Automatic numbering reset options
- **Series Validation**: Prevent duplicate series names

### 5. Automation System
- **Trigger Types**:
  - Schedule-based (daily, weekly, monthly, yearly)
  - Event-based (invoice created, paid, overdue)
  - Condition-based (custom field conditions)
- **Action Types**:
  - Send Email
  - Create Invoice
  - Update Status
  - Send Notification
  - Webhook Integration
- **Conditional Logic**: Multiple conditions with AND/OR logic
- **Execution History**: Track rule execution and success rates

## Architecture

### Database Schema

#### Core Tables
- `invoices`: Main invoice data
- `invoice_items`: Line items for each invoice
- `customers`: Customer information
- `invoice_series`: Numbering series configuration
- `invoice_templates`: Template definitions
- `invoice_automation_rules`: Automation rules
- `invoice_imports`: Import history
- `invoice_audit_logs`: Audit trail

#### Supporting Tables
- `invoice_series`: Series configuration
- `invoice_imports`: Import tracking
- `invoice_audit_logs`: Audit logging

### API Endpoints

#### Invoice Management
- `GET /api/tenants/[tenantId]/invoices` - List invoices
- `POST /api/tenants/[tenantId]/invoices` - Create invoice
- `PUT /api/tenants/[tenantId]/invoices/[id]` - Update invoice
- `DELETE /api/tenants/[tenantId]/invoices/[id]` - Delete invoice

#### Import/Export
- `GET /api/tenants/[tenantId]/invoices/import` - Get import providers
- `POST /api/tenants/[tenantId]/invoices/import` - Import invoices
- `GET /api/tenants/[tenantId]/invoices/export` - Get export formats
- `POST /api/tenants/[tenantId]/invoices/export` - Export invoices

#### Series Management
- `GET /api/tenants/[tenantId]/invoices/series` - List series
- `POST /api/tenants/[tenantId]/invoices/series` - Create series
- `PUT /api/tenants/[tenantId]/invoices/series` - Update series
- `DELETE /api/tenants/[tenantId]/invoices/series` - Delete series

### Components

#### Core Components
- `InvoiceForm`: Create/edit invoice form
- `InvoiceList`: Display invoice list with filters
- `InvoiceTemplateManager`: Template management interface
- `SeriesManager`: Series configuration interface
- `InvoiceAutomation`: Automation rules management

#### Import/Export Components
- `ImportModal`: Import interface with provider selection
- `ExportModal`: Export interface with format selection

#### Utility Components
- `InvoiceTemplateManager`: Template creation and editing
- `InvoiceAutomation`: Automation rule configuration

## Usage

### Creating an Invoice

1. Navigate to the Invoices section
2. Click "New Invoice"
3. Fill in customer information
4. Add line items
5. Configure payment terms
6. Save the invoice

### Importing Invoices

1. Go to the Import section
2. Select a provider (CSV, Oblio, SmartBill, FGO)
3. Configure import options
4. Upload file or provide API credentials
5. Review import preview
6. Execute import

### Setting Up Automation

1. Navigate to Automation section
2. Click "New Rule"
3. Configure trigger (schedule, event, or condition)
4. Set up action (email, create invoice, etc.)
5. Add conditions if needed
6. Activate the rule

### Managing Templates

1. Go to Templates section
2. Click "New Template"
3. Choose template type
4. Configure HTML/CSS
5. Set display options
6. Save and test template

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/db"
DIRECT_URL="postgresql://username:password@localhost:5432/db"

# API Keys for External Services
OBLIO_API_KEY="your-oblio-api-key"
SMARTBILL_API_KEY="your-smartbill-api-key"
FGO_API_KEY="your-fgo-api-key"

# Email Configuration
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
3. Set up external API keys
4. Create default invoice series
5. Configure email templates

## API Integration

### External Providers

#### Oblio.eu
- **Authentication**: Bearer token
- **Endpoints**: Company info, invoice list
- **Rate Limits**: As per Oblio documentation

#### SmartBill
- **Authentication**: Basic auth with API key
- **Endpoints**: Company info, invoice list
- **Rate Limits**: As per SmartBill documentation

#### FGO
- **Authentication**: Bearer token
- **Endpoints**: Company info, invoice list
- **Rate Limits**: As per FGO documentation

### Webhook Integration

The system supports webhook notifications for:
- Invoice created
- Invoice paid
- Invoice overdue
- Customer created

Webhook payload format:
```json
{
  "event": "invoice.created",
  "data": {
    "invoice": {
      "id": 123,
      "number": "INV-001",
      "status": "issued",
      "amount": 1000.00
    },
    "customer": {
      "id": 456,
      "name": "Customer Name"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Security

### Data Protection
- All sensitive data is encrypted at rest
- API keys are stored securely
- Customer data is protected according to GDPR

### Access Control
- Role-based access control
- Tenant isolation
- Audit logging for all operations

### Validation
- Input validation on all forms
- SQL injection prevention
- XSS protection

## Performance

### Optimization
- Database indexing for common queries
- Pagination for large datasets
- Caching for frequently accessed data
- Background processing for heavy operations

### Monitoring
- Performance metrics tracking
- Error logging and alerting
- Usage analytics

## Troubleshooting

### Common Issues

#### Import Failures
- Check API credentials
- Verify file format
- Review error logs
- Check network connectivity

#### Template Rendering
- Validate HTML/CSS syntax
- Check variable names
- Test with sample data
- Review browser console

#### Automation Rules
- Verify trigger conditions
- Check action configuration
- Review execution logs
- Test with sample data

### Debug Mode

Enable debug mode by setting:
```env
ENABLE_DEBUG_MODE="true"
ENABLE_ERROR_DETAILS="true"
```

## Support

### Documentation
- API documentation available at `/docs`
- Component documentation in code
- Video tutorials available

### Contact
- Support email: support@example.com
- Documentation: docs.example.com
- GitHub issues: github.com/example/issues

## Changelog

### Version 1.0.0
- Initial release
- Basic invoice management
- Import/export functionality
- Template system
- Automation rules
- Series management

### Future Releases
- Advanced reporting
- Multi-language support
- Mobile app
- Advanced integrations
- AI-powered features

## License

This project is licensed under the MIT License - see the LICENSE file for details.
