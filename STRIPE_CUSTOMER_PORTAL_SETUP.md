<!-- @format -->

# Stripe Customer Portal Setup Guide

## 🔧 **Problema**

```
Error: No configuration provided and your live mode default configuration has not been created.
Provide a configuration or create your default by saving your customer portal settings in live mode
at https://dashboard.stripe.com/settings/billing/portal.
```

## ✅ **Soluția**

### **1. Accesează Stripe Dashboard**

- Mergi la: https://dashboard.stripe.com/settings/billing/portal
- Sau: Dashboard → Settings → Billing → Customer Portal

### **2. Configurează Customer Portal**

#### **Step 1: Business Information**

- **Business name**: Numele companiei tale
- **Support email**: Email-ul pentru suport
- **Support phone**: Numărul de telefon (opțional)

#### **Step 2: Customer Portal Features**

Activează următoarele funcții:

✅ **Update payment methods**

- Permite clienților să actualizeze metodele de plată

✅ **Cancel subscriptions**

- Permite clienților să anuleze abonamentele

✅ **Update billing information**

- Permite clienților să actualizeze informațiile de facturare

✅ **Download invoices**

- Permite clienților să descarce facturile

✅ **Update subscription quantity**

- Permite clienților să modifice cantitatea abonamentului

#### **Step 3: Branding**

- **Logo**: Adaugă logo-ul companiei
- **Colors**: Personalizează culorile
- **Custom CSS**: Adaugă CSS personalizat (opțional)

#### **Step 4: Save Configuration**

- Click **"Save"** pentru a salva configurația

### **3. Testează Customer Portal**

#### **Pentru Test Mode:**

1. Mergi la: https://dashboard.stripe.com/test/settings/billing/portal
2. Configurează portal-ul pentru test mode
3. Testează cu card-uri de test

#### **Pentru Live Mode:**

1. Mergi la: https://dashboard.stripe.com/settings/billing/portal
2. Configurează portal-ul pentru live mode
3. Testează cu card-uri reale

## 🎯 **Configurație Recomandată**

### **Features Active:**

- ✅ Update payment methods
- ✅ Cancel subscriptions
- ✅ Update billing information
- ✅ Download invoices
- ✅ Update subscription quantity
- ✅ Pause subscriptions (opțional)

### **Features Dezactivate:**

- ❌ Add payment methods (dacă vrei să controlezi adăugarea)
- ❌ Reactivate subscriptions (dacă vrei control manual)

## 🔄 **Alternative Temporare**

### **Opțiunea 1: Disable Customer Portal**

Dacă nu vrei să folosești Customer Portal acum, poți dezactiva funcționalitatea:

```typescript
// În SubscriptionCard.tsx
const handleManageSubscription = async () => {
	// Temporar, redirect la landing page pentru upgrade
	window.location.href = "/";
};
```

### **Opțiunea 2: Manual Subscription Management**

Creează propriile pagini pentru management-ul abonamentelor:

```typescript
// În loc de Customer Portal, folosește propriile pagini
const handleManageSubscription = async () => {
	// Redirect la pagina ta de management
	window.location.href = "/home/subscription-management";
};
```

## 🚀 **Testare**

### **1. Testează cu Card de Test**

```javascript
// Card de test Stripe
Card number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

### **2. Verifică Customer Portal**

1. Fă o plată de test
2. Accesează Customer Portal
3. Verifică că toate funcțiile lucrează

### **3. Testează în Aplicație**

1. Fă upgrade la un plan
2. Accesează "Manage Subscription"
3. Verifică că portal-ul se deschide corect

## 📋 **Checklist Configurație**

- [ ] Business information completată
- [ ] Features activate (update, cancel, download)
- [ ] Branding configurat
- [ ] Configurație salvată
- [ ] Testat în test mode
- [ ] Testat în live mode (dacă aplicabil)
- [ ] Integrat în aplicație

## 🔧 **Dacă Problema Persistă**

### **1. Verifică Mode-ul**

- Asigură-te că ești în modul corect (test/live)
- Verifică că API keys-urile corespund modului

### **2. Verifică Permisiunile**

- Asigură-te că contul Stripe are permisiunile necesare
- Verifică că nu ai restricții de securitate

### **3. Contactează Suport**

- Dacă problema persistă, contactează Stripe Support
- Include mesajul de eroare exact

## 🎯 **Rezultat Final**

După configurare, utilizatorii vor putea:

- ✅ Actualiza metodele de plată
- ✅ Anula abonamentele
- ✅ Descărca facturile
- ✅ Modifica cantitatea abonamentului
- ✅ Actualiza informațiile de facturare
