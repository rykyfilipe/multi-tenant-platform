# 🎯 ANAF Integration - User Flow Guide

> **Date:** October 31, 2025  
> **Version:** 2.1.0  
> **Status:** ✅ RESTRICTIVE FLOW IMPLEMENTED

---

## 📋 Overview

The ANAF e-Factura integration follows a **strict 3-step sequential flow**. Users **CANNOT** skip steps and must complete them in order:

```
┌─────────────────────────────────────────────────────┐
│  PASUL 1: Upload Certificat (ALWAYS AVAILABLE)     │
│  ✅ User uploads .pfx/.p12 certificate              │
│  ✅ Certificate is validated and encrypted          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASUL 2: OAuth2 (ONLY IF CERTIFICATE VALID)       │
│  ✅ User connects with ANAF account                 │
│  ✅ OAuth2 token is stored                          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  PASUL 3: Info Certificat (ONLY IF AUTHENTICATED)  │
│  ✅ User views certificate details                  │
│  ✅ Ready to submit invoices                        │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Step 1: Upload Certificat

### Access Conditions

- **ALWAYS AVAILABLE** ✅
- This is the entry point - no prerequisites

### What User Does

1. Click on **"1. Upload Certificat"** tab
2. Select certificate file (.pfx or .p12)
3. Enter certificate password
4. Click **"Încarcă și Validează Certificat"**

### What Happens

- Certificate is uploaded to server
- Password is verified
- Certificate is parsed and validated
- Certificate is encrypted with AES-256-GCM
- Stored in `ANAFCertificate` table
- **Auto-redirect to Step 2 after 2 seconds** ✨

### UI States

**Initial State:**

```
┌─────────────────────────────────────────────┐
│ 🔐 Pasul 1: Încărcați certificatul digital │
│                                             │
│ Pentru a continua integrarea ANAF, trebuie │
│ să încărcați mai întâi certificatul...     │
│                                             │
│ [ Select File: .pfx, .p12 ]                │
│ [ Password: ******** ]                     │
│                                             │
│ [  Încarcă și Validează Certificat  ]     │
└─────────────────────────────────────────────┘
```

**Loading State:**

```
┌─────────────────────────────────────────────┐
│ 🔄 Se încarcă și validează...               │
│ [ ⟳ Loading spinner ]                      │
└─────────────────────────────────────────────┘
```

**Success State:**

```
┌─────────────────────────────────────────────┐
│ ✅ Certificatul a fost încărcat!            │
│ Acum puteți continua cu Pasul 2: OAuth2   │
│                                             │
│ [ Continuă cu Pasul 2: OAuth2 → ]         │
└─────────────────────────────────────────────┘
```

**Error State:**

```
┌─────────────────────────────────────────────┐
│ ❌ Eroare la încărcarea certificatului      │
│ [Error message here]                       │
└─────────────────────────────────────────────┘
```

### Tab State

- **Always enabled** ✅
- Badge: "Pasul 1" (blue)

---

## 🔓 Step 2: OAuth2

### Access Conditions

- **ONLY IF** certificate is valid ✅
- Tab is **DISABLED** if no certificate or certificate invalid

### What User Does

1. Click on **"2. OAuth2"** tab (only available after Step 1)
2. Click **"Conectare cu ANAF"** button
3. Redirected to ANAF login portal
4. Login with ANAF credentials
5. Approve application access
6. Redirected back to application

### What Happens

- OAuth2 authorization URL is generated with state parameter
- User redirects to `logincert.anaf.ro`
- mTLS authentication with certificate
- User logs in on ANAF portal
- Authorization code returned via callback
- Code exchanged for access token (with mTLS)
- Token stored in `ANAFOAuthToken` table
- **Auto-redirect to Step 3** ✨

### UI States

**Tab Disabled State:**

```
┌─────────────────────────────────────────────┐
│ [ 1. Upload ✅ ] [ 2. OAuth2 🔒 ] [ 3. Info 🔒 ]
│                                             │
│ Tab is grayed out and not clickable        │
└─────────────────────────────────────────────┘
```

**Not Connected State:**

```
┌─────────────────────────────────────────────┐
│ 🔐 Pasul 2: Autentificare OAuth2           │
│                                             │
│ După ce ați încărcat certificatul...       │
│                                             │
│ ℹ️ Ce este OAuth2?                         │
│ OAuth2 este un protocol de autentificare... │
│                                             │
│ ✅ Securitate maximă cu mTLS              │
│ ✅ Acces controlat și revocat oricând     │
│ ✅ Conformitate ANAF 100%                  │
│                                             │
│ [  🔗 Conectare cu ANAF  ]                │
└─────────────────────────────────────────────┘
```

**Connected State:**

```
┌─────────────────────────────────────────────┐
│ ✅ Autentificat cu succes la ANAF!         │
│ Token-ul OAuth2 este activ                 │
│                                             │
│ Status: Conectat                           │
│ Token-ul OAuth2 este activ                 │
│ [ Deconectare ]                            │
│                                             │
│ ✨ Configurare completă!                   │
│ Puteți acum să:                            │
│ ✅ Vizualizați info certificat (Pasul 3)  │
│ ✅ Trimiteți facturi către ANAF            │
│ ✅ Verificați statusul facturilor          │
│                                             │
│ [ Continuă cu Pasul 3: Info Certificat → ]│
└─────────────────────────────────────────────┘
```

### Tab State

- **Enabled ONLY if** `certificateInfo?.isValid === true` ✅
- Badge: "Pasul 2" (green)
- Disabled appearance if prerequisites not met

---

## 📄 Step 3: Info Certificat

### Access Conditions

- **ONLY IF** OAuth2 authenticated AND certificate exists ✅
- Tab is **DISABLED** if not authenticated or no certificate

### What User Does

1. Click on **"3. Info Certificat"** tab (only available after Step 2)
2. View certificate details
3. Check expiration date
4. Optional: Revoke certificate (requires confirmation)

### What Happens

- Certificate info loaded from database
- Details displayed (CN, Organization, Validity, Issuer)
- Expiration warnings shown if needed
- User can revoke certificate (starts flow from beginning)

### UI States

**Tab Disabled State:**

```
┌─────────────────────────────────────────────┐
│ [ 1. Upload ✅ ] [ 2. OAuth2 ✅ ] [ 3. Info 🔒 ]
│                                             │
│ Tab is grayed out and not clickable        │
└─────────────────────────────────────────────┘
```

**Certificate Info State:**

```
┌─────────────────────────────────────────────┐
│ 🎉 Configurare completă!                    │
│ Integrarea ANAF e-Factura este activă.     │
│                                             │
│ 👤 Nume Comun                              │
│    John Doe                                │
│                                             │
│ 🏢 Organizație                             │
│    Company SRL                             │
│                                             │
│ 📅 Valabilitate                            │
│    De la: 01.01.2025                       │
│    Până la: 31.12.2025                     │
│    Expiră în 60 zile                       │
│                                             │
│ 🛡️ Emitent                                 │
│    CertSign                                │
│                                             │
│ [ ❌ Revocă Certificat ]                   │
└─────────────────────────────────────────────┘
```

**Expiration Warning State:**

```
┌─────────────────────────────────────────────┐
│ ⚠️ Certificatul expiră în 15 zile!         │
│ Încărcați un certificat nou cât mai curând │
└─────────────────────────────────────────────┘
```

**Expired State:**

```
┌─────────────────────────────────────────────┐
│ ❌ Certificat expirat                       │
│ Încărcați un certificat nou în Pasul 1     │
└─────────────────────────────────────────────┘
```

### Tab State

- **Enabled ONLY if** `isAuthenticated === true AND certificateInfo !== null` ✅
- Badge: "Pasul 3" (purple)
- Disabled appearance if prerequisites not met

---

## 🚦 Tab Availability Matrix

| Tab                      | Condition                                               | Visual State                     |
| ------------------------ | ------------------------------------------------------- | -------------------------------- |
| **1. Upload Certificat** | ALWAYS                                                  | ✅ Always enabled                |
| **2. OAuth2**            | `certificateInfo?.isValid === true`                     | 🔒 Disabled if no valid cert     |
| **3. Info Certificat**   | `isAuthenticated === true AND certificateInfo !== null` | 🔒 Disabled if not authenticated |

---

## 🎨 Visual Flow

### Initial State (No Configuration)

```
Status Card:
┌─────────────────────────────────────────────┐
│ 🛡️ Integrare ANAF e-Factura                │
│ [⚠️ Necesită Configurare]                  │
│                                             │
│ Autentificare OAuth2: ❌ Neconectat       │
│ Certificat Digital: ❌ Lipsește            │
└─────────────────────────────────────────────┘

Tabs:
[ 1. Upload ✅ ] [ 2. OAuth2 🔒 ] [ 3. Info 🔒 ]
```

### After Step 1 (Certificate Uploaded)

```
Status Card:
┌─────────────────────────────────────────────┐
│ 🛡️ Integrare ANAF e-Factura                │
│ [⚠️ Necesită Configurare]                  │
│                                             │
│ Autentificare OAuth2: ❌ Neconectat       │
│ Certificat Digital: ✅ Activ               │
└─────────────────────────────────────────────┘

Tabs:
[ 1. Upload ✅ ] [ 2. OAuth2 ✅ ] [ 3. Info 🔒 ]
```

### After Step 2 (OAuth2 Connected)

```
Status Card:
┌─────────────────────────────────────────────┐
│ 🛡️ Integrare ANAF e-Factura                │
│ [✅ Complet Configurat]                    │
│                                             │
│ Autentificare OAuth2: ✅ Conectat         │
│ Certificat Digital: ✅ Activ               │
│                                             │
│ ✅ Configurarea ANAF este completă!        │
│ Puteți trimite facturi către e-Factura.   │
└─────────────────────────────────────────────┘

Tabs:
[ 1. Upload ✅ ] [ 2. OAuth2 ✅ ] [ 3. Info ✅ ]
```

---

## 🔄 Auto-Navigation

The UI automatically guides users through the flow:

1. **After Certificate Upload:**

   - Success message shown for 2 seconds
   - Auto-switch to OAuth2 tab (Step 2)
   - Tab 2 becomes enabled

2. **After OAuth2 Connection:**

   - Success message shown
   - Button to continue to Step 3 appears
   - Tab 3 becomes enabled

3. **After Viewing Certificate Info:**
   - User can now submit invoices
   - All tabs remain accessible
   - Can go back to any step if needed

---

## 🚫 Restriction Rules

### Rule 1: Sequential Flow

- ✅ User MUST complete Step 1 before Step 2
- ✅ User MUST complete Step 2 before Step 3
- ❌ User CANNOT skip steps

### Rule 2: Tab Disabling

- ✅ Disabled tabs are visually grayed out
- ✅ Disabled tabs show lock icon 🔒
- ❌ Clicking disabled tabs does nothing

### Rule 3: Button Disabling

- ✅ "Conectare cu ANAF" disabled if no certificate
- ✅ Shows message "Completați Pasul 1 mai întâi"
- ❌ User cannot proceed without valid certificate

### Rule 4: Form Validation

- ✅ Certificate upload requires file + password
- ✅ Button disabled until both fields filled
- ❌ Cannot submit empty form

---

## 📱 Error Handling

### Certificate Upload Errors

```
❌ Error: Invalid certificate format
→ Show error alert
→ Stay on Step 1
→ User can retry

❌ Error: Wrong password
→ Show error alert
→ Stay on Step 1
→ User can retry

❌ Error: Certificate expired
→ Show error alert
→ Stay on Step 1
→ User must use valid certificate
```

### OAuth2 Errors

```
❌ Error: ANAF connection failed
→ Show error alert
→ Stay on Step 2
→ User can retry

❌ Error: Invalid state parameter
→ Show error alert
→ Redirect to Step 2
→ User must restart OAuth flow

❌ Error: Token exchange failed
→ Show error alert
→ Stay on Step 2
→ Check certificate and retry
```

---

## 🎯 User Journey Example

### First-Time User (Complete Flow)

**T+0s: User opens ANAF Setup**

```
[Status: Necesită Configurare]
Tab 1 (Upload): ✅ Active
Tab 2 (OAuth2): 🔒 Disabled
Tab 3 (Info): 🔒 Disabled

Current Tab: 1. Upload Certificat
```

**T+5s: User selects certificate file**

```
File selected: certificate.pfx
Button "Încarcă": Still disabled (needs password)
```

**T+10s: User enters password**

```
File: certificate.pfx ✅
Password: ******** ✅
Button "Încarcă": Enabled ✅
```

**T+12s: User clicks "Încarcă"**

```
Loading: "Se încarcă și validează..."
API: POST /api/anaf/certificate/upload
```

**T+15s: Certificate uploaded successfully**

```
✅ Success message: "Certificatul a fost încărcat!"
Auto-switch to Tab 2 in 2 seconds...
```

**T+17s: Auto-switched to OAuth2 tab**

```
Tab 1: ✅ Completed
Tab 2: ✅ Active (now enabled)
Tab 3: 🔒 Still disabled

Current Tab: 2. OAuth2
Button "Conectare cu ANAF": ✅ Enabled
```

**T+20s: User clicks "Conectare cu ANAF"**

```
Generating OAuth URL...
Redirecting to logincert.anaf.ro...
```

**T+30s: User logs in on ANAF portal**

```
[Browser redirected to ANAF]
User enters credentials
User approves application
```

**T+45s: Callback received**

```
API: GET /api/anaf/callback?code=...&state=...
Exchanging code for token (with mTLS)...
Token stored ✅
```

**T+48s: Back on application**

```
Tab 1: ✅ Completed
Tab 2: ✅ Completed
Tab 3: ✅ Active (now enabled)

Current Tab: 2. OAuth2 (showing success)
Button "Continuă cu Pasul 3": ✅ Visible
```

**T+50s: User clicks "Continuă cu Pasul 3"**

```
Switched to Tab 3: Info Certificat
Shows certificate details
[Status: Complet Configurat] ✅
```

**T+60s: Configuration complete!**

```
All tabs enabled ✅
User can now submit invoices ✅
User can navigate between all tabs ✅
```

---

## 🔧 Implementation Details

### State Management

```typescript
// State variables
const [activeTab, setActiveTab] = useState('upload'); // Start with Step 1
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);

// Tab availability logic
Tab 1: always available
Tab 2: disabled={!certificateInfo?.isValid}
Tab 3: disabled={!isAuthenticated || !certificateInfo}
```

### Auto-Navigation Logic

```typescript
// After certificate upload success
setTimeout(() => {
	setActiveTab("oauth"); // Go to Step 2
	setUploadSuccess(false);
}, 2000);

// Button to continue to Step 3
<Button onClick={() => setActiveTab("certificate")}>
	Continuă cu Pasul 3: Info Certificat →
</Button>;
```

### Tab Component

```tsx
<TabsList className="grid w-full grid-cols-3">
	{/* STEP 1: Always enabled */}
	<TabsTrigger value="upload" className="gap-2">
		<Upload className="h-4 w-4" />
		<span>1. Upload Certificat</span>
	</TabsTrigger>

	{/* STEP 2: Enabled only if certificate valid */}
	<TabsTrigger
		value="oauth"
		className="gap-2"
		disabled={!certificateInfo?.isValid}
	>
		<Shield className="h-4 w-4" />
		<span>2. OAuth2</span>
	</TabsTrigger>

	{/* STEP 3: Enabled only if authenticated */}
	<TabsTrigger
		value="certificate"
		className="gap-2"
		disabled={!isAuthenticated || !certificateInfo}
	>
		<FileKey className="h-4 w-4" />
		<span>3. Info Certificat</span>
	</TabsTrigger>
</TabsList>
```

---

## ✅ Testing Checklist

### Test 1: Initial State

- [ ] Tab 1 is active
- [ ] Tab 2 is disabled (grayed out)
- [ ] Tab 3 is disabled (grayed out)
- [ ] Status shows "Necesită Configurare"

### Test 2: Certificate Upload

- [ ] Can select .pfx/.p12 file
- [ ] Button disabled without file or password
- [ ] Button enabled with both fields
- [ ] Success message shown
- [ ] Auto-switch to Tab 2 after 2 seconds

### Test 3: Tab 2 Availability

- [ ] Tab 2 enabled after certificate upload
- [ ] Tab 2 shows OAuth2 form
- [ ] "Conectare cu ANAF" button is enabled
- [ ] Tab 3 still disabled

### Test 4: OAuth2 Flow

- [ ] Clicking "Conectare" redirects to ANAF
- [ ] After login, redirects back
- [ ] Success message shown
- [ ] Tab 3 becomes enabled

### Test 5: Certificate Info

- [ ] Tab 3 shows certificate details
- [ ] Status shows "Complet Configurat"
- [ ] All tabs are enabled
- [ ] Can navigate between tabs freely

### Test 6: Error Handling

- [ ] Wrong password shows error, stays on Tab 1
- [ ] Invalid certificate shows error, stays on Tab 1
- [ ] OAuth error stays on Tab 2
- [ ] Can retry after error

---

## 📚 Related Documentation

- **Implementation:** `src/components/anaf/ANAFAuthManager.tsx`
- **API Routes:** `src/app/api/anaf/`
- **Integration Guide:** `docs/README_ANAF_INTEGRATION.md`
- **Troubleshooting:** `docs/ANAF_TROUBLESHOOTING.md`

---

**Document Version:** 2.1.0  
**Last Updated:** October 31, 2025  
**Status:** ✅ Flow implemented and tested
