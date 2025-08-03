# Stripe Webhook Setup

## Configurarea Webhook-ului în Stripe Dashboard

### 1. Accesează Stripe Dashboard
- Mergi la https://dashboard.stripe.com/webhooks
- Click "Add endpoint"

### 2. Configurează Endpoint-ul
- **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
- **Events to send**: Selectează următoarele evenimente:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 3. Salvează și Copiază Secret-ul
- După salvare, copiază `whsec_...` secret-ul
- Adaugă-l în `.env` ca `STRIPE_WEBHOOK_SECRET`

## Testare

După configurarea webhook-ului:
1. Fă o plată reală
2. Verifică log-urile în console
3. Verifică baza de date pentru actualizarea abonamentului
