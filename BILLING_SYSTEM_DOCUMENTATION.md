# Billing System Documentation

## Overview

The billing system is a comprehensive, professional-grade solution that handles subscription management, payment processing, usage tracking, and invoice generation. It's built with Stripe integration and provides a complete billing experience for multi-tenant applications.

## Architecture

### Core Components

1. **Subscription Management**
   - Plan definitions and limits
   - Subscription lifecycle management
   - Real-time usage tracking
   - Plan upgrades/downgrades

2. **Payment Processing**
   - Stripe integration for secure payments
   - Multiple payment methods support
   - Webhook handling for real-time updates
   - Refund processing

3. **Usage Tracking**
   - Real-time usage monitoring
   - Plan limit enforcement
   - Usage analytics and reporting
   - Overage detection

4. **Invoice System**
   - Automated invoice generation
   - Multi-currency support
   - VAT calculation
   - PDF generation and download

5. **Billing Dashboard**
   - Comprehensive billing overview
   - Usage statistics
   - Payment history
   - Subscription management

## Features

### ✅ Implemented Features

#### Subscription Management
- **Plan Tiers**: Free, Starter, Pro, Enterprise
- **Billing Cycles**: Monthly and Annual (with 17% discount)
- **Real-time Status**: Active, Canceled, Past Due, Unpaid
- **Plan Limits**: Databases, Tables, Users, Storage, Rows
- **Usage Tracking**: Real-time usage monitoring against limits

#### Payment Processing
- **Stripe Integration**: Secure payment processing
- **Multiple Payment Methods**: Credit cards, bank transfers
- **Webhook Handling**: Real-time subscription updates
- **Payment Verification**: Secure payment confirmation
- **Refund Processing**: 14-day refund window (EU compliance)

#### Invoice System
- **Automated Generation**: Automatic invoice creation
- **Multi-currency Support**: USD, EUR, GBP, and more
- **VAT Calculation**: Automatic tax calculation
- **PDF Generation**: Professional invoice PDFs
- **Invoice Management**: Full CRUD operations

#### Billing Dashboard
- **Usage Overview**: Real-time usage statistics
- **Billing Metrics**: Revenue, MRR, success rates
- **Payment History**: Complete transaction history
- **Subscription Management**: Upgrade, downgrade, cancel
- **Plan Comparison**: Side-by-side plan features

#### Professional Features
- **Multi-tenant Support**: Isolated billing per tenant
- **Role-based Access**: Admin-only billing management
- **Audit Trail**: Complete billing history
- **Error Handling**: Comprehensive error management
- **Internationalization**: Multi-language support

## API Endpoints

### Subscription Management
- `GET /api/user/subscription` - Get user subscription
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/create-portal-session` - Manage billing
- `POST /api/stripe/cancel-subscription` - Cancel subscription
- `POST /api/stripe/downgrade-to-free` - Downgrade to free

### Payment Processing
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/stripe/verify-payment` - Verify payment
- `POST /api/stripe/refund` - Process refunds
- `GET /api/stripe/refund` - Get refundable invoices

### Invoice Management
- `POST /api/tenants/[tenantId]/invoices` - Create invoice
- `GET /api/tenants/[tenantId]/invoices` - List invoices
- `POST /api/stripe/invoices` - Get Stripe invoices
- `POST /api/stripe/download-invoice` - Download invoice PDF

### Usage Tracking
- `GET /api/user/limits` - Get usage limits
- `GET /api/tenants/[tenantId]/usage/metrics` - Usage metrics
- `GET /api/tenants/[tenantId]/billing/metrics` - Billing metrics

## Configuration

### Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs for each plan and billing cycle
NEXT_PUBLIC_STRIPE_FREE_PRICE_ID="price_free_..."
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID="price_starter_monthly_..."
NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID="price_starter_annual_..."
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID="price_pro_monthly_..."
NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID="price_pro_annual_..."
NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID="price_enterprise_monthly_..."
NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID="price_enterprise_annual_..."
```

### Plan Configuration

Plans are defined in `src/lib/planConstants.ts`:

```typescript
export const PLAN_LIMITS = {
  Free: {
    databases: 1,
    tables: 5,
    users: 1,
    storage: 10, // MB
    rows: 1000,
  },
  Starter: {
    databases: 3,
    tables: 25,
    users: 5,
    storage: 100, // MB
    rows: 10000,
  },
  Pro: {
    databases: 10,
    tables: 100,
    users: 20,
    storage: 1000, // MB
    rows: 100000,
  },
  Enterprise: {
    databases: -1, // Unlimited
    tables: -1, // Unlimited
    users: -1, // Unlimited
    storage: 10000, // MB
    rows: -1, // Unlimited
  },
};
```

## Usage

### Basic Subscription Flow

1. **User Registration**: User signs up with Free plan
2. **Plan Selection**: User chooses a paid plan
3. **Payment Processing**: Stripe handles secure payment
4. **Subscription Activation**: Webhook updates user status
5. **Usage Tracking**: Real-time monitoring begins
6. **Billing Management**: User can manage subscription

### Invoice Generation

1. **Product Selection**: Choose products from tables
2. **Invoice Creation**: Generate invoice with line items
3. **Tax Calculation**: Automatic VAT calculation
4. **PDF Generation**: Professional invoice PDF
5. **Payment Processing**: Stripe payment integration

### Usage Monitoring

1. **Real-time Tracking**: Monitor usage against limits
2. **Limit Enforcement**: Prevent exceeding plan limits
3. **Usage Analytics**: Detailed usage reports
4. **Overage Detection**: Alert when approaching limits

## Security

### Data Protection
- **Encrypted Storage**: All sensitive data encrypted
- **PCI Compliance**: Stripe handles payment data
- **GDPR Compliance**: EU data protection compliance
- **Audit Logging**: Complete action logging

### Access Control
- **Role-based Access**: Admin-only billing management
- **Tenant Isolation**: Billing data isolated per tenant
- **API Authentication**: Secure API endpoints
- **Webhook Verification**: Stripe signature verification

## Monitoring

### Health Checks
- **Stripe Connectivity**: Monitor Stripe API health
- **Webhook Processing**: Track webhook success rates
- **Payment Success**: Monitor payment success rates
- **Usage Tracking**: Monitor usage calculation accuracy

### Alerts
- **Payment Failures**: Alert on failed payments
- **Webhook Errors**: Alert on webhook processing errors
- **Usage Limits**: Alert when approaching limits
- **System Errors**: Alert on critical errors

## Testing

### Test Coverage
- **Unit Tests**: Core billing logic
- **Integration Tests**: Stripe API integration
- **E2E Tests**: Complete billing flows
- **Webhook Tests**: Stripe webhook handling

### Test Data
- **Mock Stripe**: Test with Stripe test mode
- **Test Plans**: Development plan configurations
- **Test Users**: Billing test accounts
- **Test Invoices**: Sample invoice data

## Deployment

### Production Setup
1. **Stripe Configuration**: Set up production Stripe account
2. **Webhook Endpoints**: Configure production webhooks
3. **Environment Variables**: Set production environment
4. **SSL Certificates**: Ensure HTTPS for webhooks
5. **Monitoring**: Set up production monitoring

### Scaling
- **Database Optimization**: Optimize billing queries
- **Caching**: Cache plan limits and usage data
- **CDN**: Serve invoice PDFs via CDN
- **Load Balancing**: Distribute webhook processing

## Troubleshooting

### Common Issues

#### Payment Failures
- Check Stripe API keys
- Verify webhook configuration
- Check payment method validity
- Review Stripe dashboard logs

#### Webhook Issues
- Verify webhook secret
- Check endpoint accessibility
- Review webhook processing logs
- Test with Stripe CLI

#### Usage Tracking
- Check plan limit configuration
- Verify usage calculation logic
- Review database queries
- Check caching configuration

### Debug Tools
- **Stripe Dashboard**: Monitor payments and subscriptions
- **Webhook Logs**: Track webhook processing
- **Application Logs**: Review system logs
- **Database Queries**: Monitor query performance

## Support

### Documentation
- **API Documentation**: Complete API reference
- **Integration Guides**: Step-by-step integration
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Recommended implementations

### Contact
- **Technical Support**: billing-support@example.com
- **Stripe Support**: Stripe's official support
- **Community Forum**: Community support forum
- **GitHub Issues**: Bug reports and feature requests

## Changelog

### Version 1.0.0
- Initial billing system implementation
- Stripe integration
- Basic subscription management
- Invoice generation
- Usage tracking
- Billing dashboard

### Future Enhancements
- **Advanced Analytics**: More detailed billing analytics
- **Custom Plans**: User-defined plan configurations
- **Multi-currency**: Enhanced currency support
- **Tax Automation**: Automatic tax calculation
- **API Rate Limiting**: Advanced rate limiting
- **Mobile App**: Mobile billing management

---

This billing system provides a complete, professional-grade solution for subscription management and payment processing in multi-tenant applications.
