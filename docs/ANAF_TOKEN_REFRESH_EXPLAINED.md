# 🔄 ANAF Token Refresh - Cum Funcționează

> **Data:** 31 Octombrie 2025  
> **Status:** ✅ AUTOMAT (Backend) | ⚠️ NU VIZIBIL ÎN UI (încă)

---

## 🎯 Răspuns Rapid

**Întrebare:** "Cum se face refresh la token? Este în UI?"

**Răspuns:**

- ✅ **Token refresh este AUTOMAT** - se face în backend
- ❌ **NU este vizibil în UI momentan** - nu există indicator vizual
- ✅ **Funcționează transparent** - userul nu trebuie să facă nimic
- 🔄 **Se refreshează automat** când tokenul expiră (cu 5 minute buffer)

---

## 🔧 Cum Funcționează Acum (Backend)

### Flow Automat de Token Refresh

```typescript
// 1. La fiecare request către ANAF
const token = await ANAFAuthService.getValidAccessToken(userId, tenantId);

// 2. Backend verifică dacă tokenul expiră în <5 minute
if (tokenExpiresSoon) {
	// 3. Backend face refresh AUTOMAT cu mTLS
	await ANAFAuthService.refreshAccessToken(userId, tenantId);

	// 4. Returnează noul token
	return newAccessToken;
}

// 5. Altfel, returnează tokenul existent
return currentAccessToken;
```

### Detalii Tehnice

**Locație:** `src/lib/anaf/services/anafAuthService.ts`

**Funcții Cheie:**

1. **`getValidAccessToken(userId, tenantId)`** - Linia 237

   - Verifică dacă tokenul expiră în următoarele 5 minute
   - Dacă DA → apelează `refreshAccessToken()` automat
   - Dacă NU → returnează tokenul curent
   - **Folosit la FIECARE request ANAF**

2. **`refreshAccessToken(userId, tenantId)`** - Linia 160
   - Ia refresh_token din baza de date
   - Face request mTLS către ANAF cu refresh_token
   - Primește access_token nou
   - Salvează în baza de date
   - **Apelat automat când tokenul expiră**

### Când Se Face Refresh?

```
Token expires at: 2025-10-31 15:00:00
Current time:     2025-10-31 14:55:00
Buffer time:      5 minutes

Calcul:
expiresAt - currentTime = 5 minutes
5 minutes <= 5 minutes buffer → TRIGGER REFRESH ✅
```

**Buffer de 5 minute** = token se refreshează cu 5 minute ÎNAINTE de expirare

---

## ❌ Ce NU Este în UI Acum

### 1. Nu există indicator vizual pentru:

- Când tokenul se refreshează
- Când va expira tokenul
- Statusul refresh-ului (success/fail)
- Timpul rămas până la expirare

### 2. Nu există notificări pentru:

- "Token-ul va expira în X minute"
- "Token-ul a fost refreshat cu succes"
- "Token refresh a eșuat - reconectați-vă"

### 3. Nu există butoane pentru:

- Manual refresh (forțare refresh)
- Vizualizare detalii token
- Istoric refresh-uri

---

## ✅ Ce Funcționează (Backend)

### 1. Refresh Automat ✅

```typescript
// Cod: src/lib/anaf/services/anafAuthService.ts, line 237-258

// Verificare expirare cu buffer de 5 minute
const bufferTime = 5 * 60 * 1000; // 5 minutes
const isExpired = storedToken.expiresAt.getTime() - Date.now() < bufferTime;

if (isExpired && storedToken.refreshToken) {
	// Refresh automat
	const refreshResult = await this.refreshAccessToken(userId, tenantId);

	if (refreshResult.success && refreshResult.data) {
		return refreshResult.data.access_token;
	}

	throw new Error("Token expired and refresh failed. Please re-authenticate.");
}
```

### 2. mTLS pentru Token Refresh ✅

```typescript
// Cod: src/lib/anaf/services/anafAuthService.ts, line 160-225

// Token refresh folosește certificatul digital (mTLS)
const certData = await ANAFCertificateService.getDecryptedCertificate(
	userId,
	tenantId
);
const { cert, key } = this.parsePKCS12(certData.certificate, certData.password);

// Request cu mTLS
const tokenData = await this.makeSecureRequest<ANAFTokenData>(
	this.CONFIG.tokenUrl,
	{
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Accept: "application/json",
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: storedToken.refreshToken,
			client_id: this.CONFIG.clientId,
		}).toString(),
	},
	cert,
	key
);
```

### 3. Error Handling ✅

```typescript
// Dacă refresh eșuează
if (!refreshResult.success) {
	throw new Error("Token expired and refresh failed. Please re-authenticate.");
}
```

### 4. Database Update ✅

```typescript
// Noul token se salvează automat în DB
await this.storeToken(userId, tenantId, tokenData);
```

---

## 🎨 Ce Ar Trebui Adăugat în UI

### Propunere 1: Token Status Card

```tsx
┌─────────────────────────────────────────────┐
│ 🔑 OAuth2 Token Status                      │
│                                             │
│ Status: ✅ Activ                           │
│ Expiră în: 45 minute                       │
│ Ultimul refresh: Acum 15 minute            │
│                                             │
│ [ ↻ Refresh Manual ]                       │
└─────────────────────────────────────────────┘
```

### Propunere 2: Expiration Warning

```tsx
┌─────────────────────────────────────────────┐
│ ⚠️ Token-ul expiră în 10 minute!           │
│ Se va refresha automat în 5 minute.        │
└─────────────────────────────────────────────┘
```

### Propunere 3: Refresh Notification

```tsx
┌─────────────────────────────────────────────┐
│ 🔄 Token-ul se refreshează...               │
│ [ ⟳ Loading spinner ]                      │
└─────────────────────────────────────────────┘

După success:
┌─────────────────────────────────────────────┐
│ ✅ Token refreshat cu succes!               │
│ Expiră în: 60 minute                       │
└─────────────────────────────────────────────┘
```

### Propunere 4: Token Info în Tab 3

```tsx
Tab "3. Info Certificat" ar putea include:

┌─────────────────────────────────────────────┐
│ 🔑 Informații Token OAuth2                  │
│                                             │
│ Access Token: ✅ Activ                     │
│ Valabil până: 2025-10-31 15:00:00         │
│ Timp rămas: 45 minute                      │
│ Auto-refresh: ✅ Activat                   │
│                                             │
│ Refresh Token: ✅ Disponibil               │
│                                             │
│ 📊 Istoric Refresh:                        │
│ • 2025-10-31 14:00:00 - Success           │
│ • 2025-10-31 13:00:00 - Success           │
└─────────────────────────────────────────────┘
```

---

## 📊 Flow Complet (Cum E Acum)

```
┌───────────────────────────────────────────────┐
│ USER: Trimite factură către ANAF             │
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│ APP: Apelează ANAFInvoiceService.uploadInvoice()
└───────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────┐
│ SERVICE: Cere token valid                     │
│ getValidAccessToken(userId, tenantId)         │
└───────────────────────────────────────────────┘
                    ↓
         ┌─────────┴─────────┐
         │ Tokenul expiră?   │
         └─────────┬─────────┘
              ↓           ↓
           NU ✅        DA ⚠️
              ↓           ↓
    ┌─────────┘     ┌─────────┐
    │               │ REFRESH │
    │               │ AUTOMAT │
    │               └─────────┘
    │                    ↓
    │         ┌──────────┴──────────┐
    │         │ mTLS Request        │
    │         │ refresh_token       │
    │         └──────────┬──────────┘
    │                    ↓
    │         ┌──────────┴──────────┐
    │         │ ANAF returnează     │
    │         │ access_token nou    │
    │         └──────────┬──────────┘
    │                    ↓
    │         ┌──────────┴──────────┐
    │         │ Salvează în DB      │
    │         └──────────┬──────────┘
    │                    ↓
    └──────────┬─────────┘
               ↓
    ┌──────────┴──────────┐
    │ Returnează token    │
    │ (nou sau vechi)     │
    └──────────┬──────────┘
               ↓
    ┌──────────┴──────────┐
    │ Upload factură      │
    │ cu Bearer token     │
    └─────────────────────┘

🔄 TOTUL AUTOMAT - USER NU FACE NIMIC!
```

---

## 🔍 Logging (Cum Verifici Că Merge)

### Backend Logs (Server Console)

```bash
# Token refresh declanșat
[ANAF Auth] Refreshing access token: { userId: 1, tenantId: 1 }

# mTLS request făcut
[ANAF Auth] Making secure mTLS request to: https://logincert.anaf.ro/anaf-oauth2/v1/token

# Success
[ANAF Auth] Token refresh successful: { userId: 1, tenantId: 1 }

# SAU Error
[ANAF Auth] Token refresh failed: [error message]
```

### Database Check

```sql
-- Vezi ultimul token
SELECT
  accessToken,
  refreshToken,
  expiresAt,
  updatedAt
FROM ANAFOAuthToken
WHERE userId = 1 AND tenantId = 1
ORDER BY updatedAt DESC
LIMIT 1;

-- Verifică când a fost refreshat
-- updatedAt se schimbă la fiecare refresh
```

---

## 🚀 Recomandare: Adaugă UI pentru Token Status

### Pas 1: Extinde API Status Endpoint

**File:** `src/app/api/anaf/auth/status/route.ts`

```typescript
// Adaugă în response
return NextResponse.json({
	authenticated: true,
	certificate: certInfo,
	token: {
		expiresAt: token.expiresAt,
		expiresIn: Math.floor((token.expiresAt.getTime() - Date.now()) / 1000), // seconds
		willRefreshSoon: token.expiresAt.getTime() - Date.now() < 5 * 60 * 1000,
		hasRefreshToken: !!token.refreshToken,
	},
});
```

### Pas 2: Adaugă State în UI

**File:** `src/components/anaf/ANAFAuthManager.tsx`

```typescript
interface TokenInfo {
	expiresAt: string;
	expiresIn: number; // seconds
	willRefreshSoon: boolean;
	hasRefreshToken: boolean;
}

const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
```

### Pas 3: Afișează Token Status

```tsx
{
	tokenInfo && (
		<div className="p-4 border rounded-lg bg-muted/50">
			<h4 className="font-medium text-sm mb-2">🔑 Token OAuth2</h4>
			<div className="space-y-1 text-sm">
				<p>Expiră în: {formatDuration(tokenInfo.expiresIn)}</p>
				{tokenInfo.willRefreshSoon && (
					<p className="text-yellow-600">⚠️ Se va refresha automat în curând</p>
				)}
			</div>
		</div>
	);
}
```

---

## ✅ Rezumat

### Ce Funcționează Acum ✅

- ✅ **Token refresh AUTOMAT** când expiră
- ✅ **mTLS authentication** pentru refresh
- ✅ **Buffer de 5 minute** pentru refresh preventiv
- ✅ **Error handling** dacă refresh eșuează
- ✅ **Database persistence** pentru noul token
- ✅ **Transparent pentru user** - nu trebuie să facă nimic

### Ce Lipsește în UI ❌

- ❌ **Indicator vizual** că tokenul expiră
- ❌ **Notificare** când se face refresh
- ❌ **Display** timp rămas până la expirare
- ❌ **Button** pentru manual refresh
- ❌ **Istoric** refresh-uri
- ❌ **Status** real-time al tokenului

### Concluzie 🎯

**Token refresh funcționează 100% automat în backend cu mTLS!**

**DAR:**

- User-ul **NU ȘTIE** că se face refresh
- User-ul **NU VEDE** când expiră tokenul
- User-ul **NU PRIMEȘTE** notificări

**Recomandare:**
Adaugă UI indicators pentru ca user-ul să vadă:

1. Când expiră tokenul
2. Când se face refresh
3. Dacă refresh-ul a reușit

---

**Docum Creat:** 31 Octombrie 2025  
**Autor:** AI Assistant  
**Status:** ✅ Explicație Completă
