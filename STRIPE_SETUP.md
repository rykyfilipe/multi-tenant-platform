# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for the YDV multi-tenant platform.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Node.js and npm installed
3. The project dependencies installed

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# Stripe Price IDs (create these in your Stripe dashboard)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_...

# NextAuth URL (for webhooks and redirects)
NEXTAUTH_URL=http://localhost:3000
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. Create three products:
   - **Starter** ($19/month)
   - **Pro** ($49/month) 
   - **Enterprise** ($149/month)

4. For each product:
   - Set the name and description
   - Add a recurring price (monthly)
   - Copy the Price ID (starts with `price_`)

### 2. Set Up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the webhook signing secret and add it to your `.env` file

### 3. Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer Portal**
2. Enable the customer portal
3. Configure the settings:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Allow customers to update billing information
   - Set the return URL to: `https://yourdomain.com/home/settings`

## Database Migration

The Stripe integration adds new fields to the User model. Run the migration:

```bash
npx prisma migrate dev --name add_stripe_subscription_fields
```

## Testing

### Test Mode

1. Use Stripe test keys for development
2. Use test card numbers:
   - `4242 4242 4242 4242` (Visa)
   - `4000 0000 0000 0002` (Visa - declined)
   - `4000 0000 0000 9995` (Visa - insufficient funds)

### Webhook Testing

1. Use Stripe CLI for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. Or use the Stripe Dashboard webhook testing feature

## Features Implemented

### 1. Checkout Flow
- Users can select a plan on the landing page
- Stripe Checkout handles payment collection
- Automatic subscription creation

### 2. Subscription Management
- Users can view their subscription status
- Access to Stripe Customer Portal for billing management
- Automatic subscription status updates via webhooks

### 3. Webhook Handling
- `checkout.session.completed`: Creates subscription records
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Handles cancellations
- `invoice.payment_succeeded/failed`: Handles payment events

### 4. Database Integration
- User model includes Stripe fields:
  - `stripeCustomerId`
  - `stripeSubscriptionId`
  - `subscriptionStatus`
  - `subscriptionPlan`
  - `subscriptionCurrentPeriodEnd`

## API Endpoints

### POST `/api/stripe/create-checkout-session`
Creates a Stripe checkout session for subscription plans.

**Request:**
```json
{
  "priceId": "price_...",
  "planName": "Pro"
}
```

**Response:**
```json
{
  "sessionId": "cs_..."
}
```

### POST `/api/stripe/create-portal-session`
Creates a Stripe customer portal session for subscription management.

**Request:**
```json
{
  "customerId": "cus_..."
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### GET `/api/user/subscription`
Fetches the current user's subscription information.

**Response:**
```json
{
  "stripeCustomerId": "cus_...",
  "stripeSubscriptionId": "sub_...",
  "subscriptionStatus": "active",
  "subscriptionPlan": "Pro",
  "subscriptionCurrentPeriodEnd": "2024-02-01T00:00:00.000Z"
}
```

## Components

### SubscriptionCard
A React component that displays subscription information and provides management options.

**Usage:**
```tsx
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/hooks/useSubscription';

const SettingsPage = () => {
  const { subscription, loading } = useSubscription();

  if (loading) return <div>Loading...</div>;

  return (
    <SubscriptionCard 
      subscription={subscription} 
      onManageSubscription={() => {}} 
    />
  );
};
```

## Security Considerations

1. **Webhook Verification**: All webhooks are verified using Stripe signatures
2. **Authentication**: All API endpoints require user authentication
3. **Environment Variables**: Sensitive keys are stored in environment variables
4. **HTTPS**: Webhooks require HTTPS in production

## Production Deployment

1. Switch to Stripe live keys
2. Update webhook endpoints to production URLs
3. Test the complete payment flow
4. Monitor webhook events in Stripe Dashboard
5. Set up proper error handling and logging

## Troubleshooting

### Common Issues

1. **Webhook failures**: Check webhook endpoint URL and secret
2. **Payment failures**: Verify Stripe keys and test card numbers
3. **Database errors**: Ensure migrations are applied
4. **Authentication issues**: Check NextAuth configuration

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=stripe:*
```

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://community.stripe.com) 