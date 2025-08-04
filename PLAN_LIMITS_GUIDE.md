<!-- @format -->

# Plan Limits Implementation Guide

## ✅ **Restricții Implementate**

### **Planuri și Limite**

| Feature           | Starter | Pro | Enterprise |
| ----------------- | ------- | --- | ---------- |
| **Databases**     | 1       | 1   | 10         |
| **Tables**        | 1       | 5   | 50         |
| **Users**         | 2       | 5   | 20         |
| **API Tokens**    | 1       | 3   | 10         |
| **Public Tables** | 0       | 2   | 10         |

### **API Endpoints cu Restricții**

#### 1. **Database Creation** (`/api/tenants/[tenantId]/database`)

- Verifică limita de baze de date
- Returnează eroare 403 dacă limita este depășită

#### 2. **Table Creation** (`/api/tenants/[tenantId]/database/tables`)

- Verifică limita de tabele
- Returnează eroare 403 dacă limita este depășită

#### 3. **User Management** (`/api/tenants/[tenantId]/users`)

- Verifică limita de utilizatori
- Returnează eroare 403 dacă limita este depășită

#### 4. **API Tokens** (`/api/public/tokens`)

- Verifică limita de token-uri API
- Returnează eroare 403 dacă limita este depășită

#### 5. **Public Tables** (`/api/tenants/[tenantId]/database/tables/[tableId]/public`)

- Verifică limita de tabele publice
- Returnează eroare 403 dacă limita este depășită

### **Componente Frontend**

#### 1. **PlanLimitsDisplay** (`/components/PlanLimitsDisplay.tsx`)

- Afișează utilizarea curentă vs limitele planului
- Progress bars pentru fiecare limită
- Avertismente când limitele sunt atinse

#### 2. **usePlanLimits Hook** (`/hooks/usePlanLimits.ts`)

- Hook pentru verificarea limitelor în componente
- Funcții pentru verificarea limitelor
- Calcularea procentelor de utilizare

### **API pentru Limite**

#### **GET** `/api/user/limits`

- Returnează numărul curent pentru fiecare tip de resursă
- Utilizat de componentele frontend

### **Sistem de Verificare**

#### **checkPlanLimit** (`/lib/planLimits.ts`)

```typescript
const result = await checkPlanLimit(userId, "tables", currentCount);
// Returns: { allowed: boolean, limit: number, current: number }
```

#### **getCurrentCounts** (`/lib/planLimits.ts`)

```typescript
const counts = await getCurrentCounts(userId);
// Returns: { databases, tables, users, apiTokens, publicTables }
```

### **Mesaje de Eroare**

Toate API-urile returnează mesaje de eroare consistente:

```json
{
	"error": "Plan limit exceeded. You can only have X tables. Upgrade your plan to create more tables.",
	"limit": 5,
	"current": 5,
	"plan": "tables"
}
```

### **Integrare în Interfață**

#### **Settings Page**

- Componenta `PlanLimitsDisplay` afișează utilizarea
- Progress bars pentru fiecare limită
- Link-uri pentru upgrade

#### **Landing Page**

- Planurile actualizate cu limitele exacte
- Features reflectă restricțiile reale

### **Database Schema**

#### **Table Model**

```prisma
model Table {
  // ... existing fields
  isPublic Boolean @default(false)  // New field for public tables
}
```

### **Automatic Plan Assignment**

#### **New Users**

- Utilizatorii noi primesc automat planul Starter
- Setat în NextAuth și register route
- Valabil 1 an

### **Testare**

1. **Creează un cont nou** → verifică planul Starter
2. **Încearcă să creezi mai multe tabele** → verifică restricțiile
3. **Adaugă utilizatori** → verifică limita de utilizatori
4. **Creează token-uri API** → verifică limita de token-uri
5. **Fă tabele publice** → verifică limita de tabele publice

### **Upgrade Flow**

1. Utilizatorul atinge o limită
2. Primește mesaj de eroare cu sugestia de upgrade
3. Poate accesa pagina de settings pentru upgrade
4. Stripe procesează upgrade-ul
5. Webhook actualizează planul în baza de date

## 🎯 **Rezultat Final**

- ✅ **Restricții complete** pentru toate planurile
- ✅ **Verificări API** la fiecare operațiune
- ✅ **Interfață vizuală** pentru limite
- ✅ **Mesaje clare** pentru utilizatori
- ✅ **Flow de upgrade** integrat
- ✅ **Planuri transparente** în landing page
