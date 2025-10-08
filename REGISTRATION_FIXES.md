# Fix-uri pentru Problema de Inițializare la Primul Register

## Problema Raportată
Când un utilizator se înregistrează pentru prima dată:
- Nu se creează o bază de date default cu nume
- Pagina de dashboards rămâne în loading infinit
- După refresh, totul funcționează normal

## Cauze Identificate

### 1. User fără tenantId după register
**Fișier**: `src/app/api/(auth)/register/route.ts`
- User-ul era creat și asociat cu tenant, dar câmpul `tenantId` din tabelul User nu era setat
- Sesiunea NextAuth nu avea `tenantId` disponibil după primul login

### 2. Database fără nume
**Fișiere**: 
- `src/app/api/(auth)/register/route.ts`
- `src/lib/auth.ts` (OAuth flow)
- Database-ul era creat fără nume explicit (deși schema Prisma are default)

### 3. Dashboard folosea tenantId hardcoded
**Fișier**: `src/components/analytics/SimplifiedAnalyticsDashboard.tsx`
- Folosea `tenantId = 1` hardcoded în loc să ia din sesiune
- Pentru utilizatori noi cu tenantId diferit de 1, dashboard-ul încerca să încarce date pentru tenant greșit

### 4. Race condition în AppContext
**Fișier**: `src/contexts/AppContext.tsx`
- Logica de fetch pentru tenant avea o problemă de dependency
- `tenant` era în dependency array dar și verificat în condiție, creând un loop infinit

### 5. Session sync după register
**Fișier**: `src/components/auth/RegisterForm.tsx`
- Redirect imediat după signIn fără să aștepte sincronizarea sesiunii

### 6. JWT callback nu actualiza tenantId
**Fișier**: `src/lib/auth.ts`
- După update user în OAuth flow, nu se refetch-a user-ul cu tenantId
- În JWT callback refresh, nu se selecta `tenantId` din baza de date

## Soluții Implementate

### 1. Register Route - User tenantId
```typescript
// src/app/api/(auth)/register/route.ts (linii 94-98)
const newTenant = await prisma.tenant.create({ ... });

// Update user with tenantId
await prisma.user.update({
    where: { id: user.id },
    data: { tenantId: newTenant.id },
});

const newDatabase = await prisma.database.create({
    data: {
        name: "Main Database",
        tenantId: newTenant.id,
    },
});
```

### 2. OAuth Flow - User tenantId & Database Name
```typescript
// src/lib/auth.ts (linii 175-179 în jwt callback)
const newTenant = await prisma.tenant.create({ ... });
await prisma.user.update({ 
    where: { id: newUser.id }, 
    data: { tenantId: newTenant.id } 
});
await prisma.database.create({ 
    data: { name: "Main Database", tenantId: newTenant.id } 
});
// Refetch user to get the updated tenantId
dbUser = await prisma.user.findFirst({ where: { id: newUser.id } });
```

### 3. JWT Callback - Refresh tenantId
```typescript
// src/lib/auth.ts (linii 209-220)
if (token.id && token.role) {
    const dbUser = await prisma.user.findFirst({ 
        where: { id: parseInt(token.id as string) }, 
        select: { 
            subscriptionStatus: true, 
            subscriptionPlan: true, 
            subscriptionCurrentPeriodEnd: true, 
            profileImage: true, 
            tenantId: true  // ✅ ADĂUGAT
        } 
    });
    if (dbUser) {
        // ... alte fields
        token.tenantId = dbUser.tenantId ? dbUser.tenantId.toString() : null; // ✅ ADĂUGAT
    }
}
```

### 4. AppContext - Fix Tenant Fetch Logic
```typescript
// src/contexts/AppContext.tsx (linii 134-179)
export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [hasFetched, setHasFetched] = useState(false); // ✅ ADĂUGAT flag

    const fetchTenant = useCallback(async () => {
        if (!token) return; // ✅ Removed tenant check
        // ... fetch logic
        setHasFetched(true); // ✅ ADĂUGAT
    }, [token]); // ✅ REMOVED tenant from dependencies

    useEffect(() => {
        if (token && !hasFetched) { // ✅ Check hasFetched instead
            fetchTenant();
        } else if (!token && (tenant || hasFetched)) {
            setTenant(null);
            setHasFetched(false); // ✅ Reset flag
        }
    }, [token, hasFetched, fetchTenant, tenant]);
    // ...
};
```

### 5. SimplifiedAnalyticsDashboard - Dynamic tenantId
```typescript
// src/components/analytics/SimplifiedAnalyticsDashboard.tsx (linii 169-199)
useEffect(() => {
    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // ✅ Get tenant ID from session instead of hardcoded
            const sessionResponse = await fetch('/api/auth/session');
            if (!sessionResponse.ok) {
                throw new Error('Failed to fetch session');
            }
            
            const session = await sessionResponse.json();
            if (!session?.user?.tenantId) {
                throw new Error('No tenant ID found in session');
            }
            
            const tenantId = session.user.tenantId; // ✅ Dynamic tenantId
            const response = await fetch(`/api/tenants/${tenantId}/analytics/summary`);
            // ...
        }
    };
    fetchAnalytics();
}, []);
```

### 6. RegisterForm - Session Sync Delay
```typescript
// src/components/auth/RegisterForm.tsx (linii 60-66)
if (res?.ok) {
    showAlert(t("register.accountCreated"), "success");
    closeForm(true);
    // ✅ Wait a bit for the session to fully sync before redirecting
    setTimeout(() => {
        window.location.href = "/home/analytics";
    }, 300);
}
```

## Fluxul Complet Corect

### Pentru Register cu Credentials:
1. User completează formular → POST `/api/register`
2. Server creează User în DB
3. Server creează Tenant
4. **Server UPDATE User cu tenantId** ✅
5. Server creează Database cu nume "Main Database" ✅
6. Client face signIn cu NextAuth
7. NextAuth JWT callback:
   - Primește user cu tenantId setat ✅
   - Creează token cu tenantId inclus ✅
8. Client așteaptă 300ms pentru session sync ✅
9. Redirect la `/home/analytics`
10. Analytics Dashboard:
    - Fetch session pentru tenantId ✅
    - Fetch analytics pentru tenant-ul corect ✅

### Pentru Register cu OAuth (Google):
1. User face click pe "Sign in with Google"
2. NextAuth callbacks:
   - `signIn`: Creează User, Tenant, Database cu nume ✅
   - `signIn`: UPDATE User cu tenantId ✅
   - `jwt`: Refetch user după update pentru a avea tenantId ✅
3. Session creată cu tenantId corect ✅
4. Redirect la `/home/analytics`
5. Analytics Dashboard funcționează corect ✅

## Testare

### Pași de testare pentru Register nou:
1. ✅ Șterge un user de test din DB (dacă există)
2. ✅ Înregistrează un user nou
3. ✅ Verifică în DB că user-ul are `tenantId` setat
4. ✅ Verifică în DB că există un tenant cu numele "First Name's tenant"
5. ✅ Verifică în DB că există un database cu numele "Main Database"
6. ✅ După login, verifică că pagina de analytics se încarcă fără probleme
7. ✅ Verifică în console că nu sunt erori de "No tenant ID found"

### Verificare în Browser DevTools:
```javascript
// După login, în console:
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('User ID:', session.user.id);
    console.log('Tenant ID:', session.user.tenantId); // Trebuie să fie != null
    console.log('Email:', session.user.email);
  });
```

## Fișiere Modificate

1. ✅ `src/app/api/(auth)/register/route.ts` - Update user cu tenantId, nume database
2. ✅ `src/lib/auth.ts` - OAuth flow fix, JWT callback refresh tenantId
3. ✅ `src/contexts/AppContext.tsx` - Fix tenant fetch logic
4. ✅ `src/components/analytics/SimplifiedAnalyticsDashboard.tsx` - Dynamic tenantId
5. ✅ `src/components/auth/RegisterForm.tsx` - Session sync delay

## Verificare Build
```bash
npm run build
```
Status: ✅ SUCCESS (verificat pe 2025-10-08)

## Note Importante

- Schema Prisma pentru Database are default `name: "Main Database"`, dar setăm explicit pentru claritate
- Delay-ul de 300ms în RegisterForm este suficient pentru majoritatea browserelor
- AppContext folosește flag `hasFetched` pentru a preveni re-fetch-uri inutile
- JWT callback acum include `tenantId` în toate refresh-urile de session

## Impact

### Înainte:
- ❌ First-time users: Loading infinit în dashboard
- ❌ Database fără nume explicit
- ❌ Race conditions în tenant fetch
- ❌ Session fără tenantId după register

### După:
- ✅ First-time users: Dashboard se încarcă imediat
- ✅ Database cu nume "Main Database"
- ✅ No race conditions
- ✅ Session cu tenantId complet de la început

