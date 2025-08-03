<!-- @format -->

# Debug Limits Guide

## 🔍 **Problema Identificată**

Utilizatorul raportează că:

- Are 1 tabelă
- Are 1 bază de date
- Are 0 utilizatori (doar el)
- Dar componenta afișează totul la 0 și sugerează upgrade

## 🛠️ **Debugging Steps**

### 1. **Test API Endpoint**

Accesează: `http://localhost:3000/api/test-limits`

Acest endpoint va afișa:

- Detaliile utilizatorului
- Detaliile tenant-ului
- Numărul brut de resurse
- Numărul din funcția `getCurrentCounts`

### 2. **Verifică Console Logs**

În browser console, caută:

```
Fetching limits for user: [ID]
Received limits data: [DATA]
Rendering databases: current=X, limit=Y, percentage=Z
```

### 3. **Verifică Server Logs**

În terminal, caută:

```
Current counts for user [ID]: [COUNTS]
Raw counts for tenant [ID]: [COUNTS]
```

## 🔧 **Posibile Cauze**

### **1. Problema cu Session**

- Session-ul nu conține `user.id`
- NextAuth nu returnează ID-ul corect

### **2. Problema cu Tenant ID**

- Utilizatorul nu are `tenantId` setat
- `tenantId` este null sau undefined

### **3. Problema cu Database Queries**

- Queries-urile nu returnează rezultatele corecte
- Relațiile din Prisma nu sunt corecte

### **4. Problema cu Componenta**

- `currentCounts` nu se setează corect
- Componenta nu se re-renderizează

## 🎯 **Soluții**

### **Soluția 1: Verifică Session**

```javascript
// În browser console
console.log("Session:", session);
console.log("User ID:", session?.user?.id);
```

### **Soluția 2: Verifică API Direct**

```bash
curl -H "Authorization: Bearer [TOKEN]" http://localhost:3000/api/user/limits
```

### **Soluția 3: Verifică Database Direct**

```sql
-- Verifică utilizatorul
SELECT id, email, "tenantId", "subscriptionPlan" FROM "User" WHERE email = '[EMAIL]';

-- Verifică tenant-ul
SELECT * FROM "Tenant" WHERE id = [TENANT_ID];

-- Verifică bazele de date
SELECT COUNT(*) FROM "Database" WHERE "tenantId" = [TENANT_ID];

-- Verifică tabelele
SELECT COUNT(*) FROM "Table" t
JOIN "Database" d ON t."databaseId" = d.id
WHERE d."tenantId" = [TENANT_ID];

-- Verifică utilizatorii
SELECT COUNT(*) FROM "User" WHERE "tenantId" = [TENANT_ID];
```

## 📋 **Checklist Debugging**

- [ ] Session conține user.id
- [ ] User are tenantId setat
- [ ] API /api/user/limits returnează date
- [ ] API /api/test-limits confirmă numerele
- [ ] Componenta primește datele corecte
- [ ] Console logs arată numerele corecte

## 🚀 **Testare Rapidă**

1. Deschide browser console
2. Accesează `/home/settings`
3. Verifică logs-urile
4. Accesează `/api/test-limits` direct
5. Compară rezultatele

## 🔄 **Dacă Problema Persistă**

1. **Reset Component State**

```javascript
// În componenta PlanLimitsDisplay
const [currentCounts, setCurrentCounts] = useState(null);
const [loading, setLoading] = useState(true);
```

2. **Force Re-render**

```javascript
// Adaugă un key pentru a forța re-render
<PlanLimitsDisplay key={session?.user?.id} />
```

3. **Manual Data Fetch**

```javascript
// Testează manual în browser console
fetch("/api/user/limits", {
	headers: { Authorization: "Bearer [TOKEN]" },
})
	.then((r) => r.json())
	.then(console.log);
```
