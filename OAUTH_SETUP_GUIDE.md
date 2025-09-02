# Ghid de Configurare OAuth - Multi-Tenant Platform

## Probleme Identificate și Rezolvate

### 1. Cookie-uri cu SameSite=Lax
**Problema**: Cookie-urile cu `SameSite=Lax` cauzează probleme pe mobile browsers și în cross-origin requests.

**Soluția**: Configurația actualizată folosește:
- `SameSite=None` în producție (pentru cross-origin)
- `SameSite=Lax` în development (pentru localhost)
- `Secure=true` când este HTTPS

### 2. Configurație Cookie-uri Incompletă
**Problema**: Lipsesc setările pentru toate tipurile de cookie-uri NextAuth.

**Soluția**: Adăugate configurații complete pentru:
- `sessionToken`
- `callbackUrl`
- `csrfToken`
- `pkceCodeVerifier`
- `state`
- `nonce`

### 3. Error Handling Insuficient
**Problema**: Nu există fallback-uri pentru eșecuri OAuth.

**Soluția**: Implementat:
- Logging detaliat pentru toate evenimentele OAuth
- Error handling robust în callback-uri
- Fallback-uri pentru eșecuri de bază de date

## Configurarea Providerilor OAuth

### Google OAuth Setup

#### 1. Accesează Google Cloud Console
- Mergi la: https://console.developers.google.com/
- Selectează sau creează un proiect

#### 2. Activează Google+ API
- În "APIs & Services" > "Library"
- Caută "Google+ API" și activează-o

#### 3. Creează Credentiale OAuth 2.0
- În "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Selectează "Web application"

#### 4. Configurează Redirect URIs
**IMPORTANT**: Adaugă toate aceste URI-uri în câmpul "Authorized redirect URIs":

```
# Development
http://localhost:3000/api/auth/callback/google

# Production (înlocuiește cu domeniul tău)
https://yourdomain.com/api/auth/callback/google

# Testing cu ngrok (înlocuiește cu URL-ul tău ngrok)
https://your-ngrok-url.ngrok.io/api/auth/callback/google

# Testing pe LAN (înlocuiește cu IP-ul tău)
http://192.168.1.100:3000/api/auth/callback/google
```

#### 5. Configurează JavaScript Origins
Adaugă acestea în câmpul "Authorized JavaScript origins":

```
# Development
http://localhost:3000

# Production
https://yourdomain.com

# Testing cu ngrok
https://your-ngrok-url.ngrok.io

# Testing pe LAN
http://192.168.1.100:3000
```

#### 6. Copiază Credentialele
- Copiază `Client ID` și `Client Secret`
- Adaugă-le în fișierul `.env`:

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### GitHub OAuth Setup (Opțional)

#### 1. Accesează GitHub Settings
- Mergi la: https://github.com/settings/developers
- Click "New OAuth App"

#### 2. Completează Informațiile
- **Application name**: Numele aplicației tale
- **Homepage URL**: URL-ul principal al aplicației
- **Authorization callback URL**: 

```
# Development
http://localhost:3000/api/auth/callback/github

# Production
https://yourdomain.com/api/auth/callback/github

# Testing cu ngrok
https://your-ngrok-url.ngrok.io/api/auth/callback/github
```

#### 3. Copiază Credentialele
- Copiază `Client ID` și `Client Secret`
- Adaugă-le în `.env`:

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Configurarea Variabilelor de Mediu

### Fișierul .env
```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"  # Schimbă pentru producție
NEXTAUTH_SECRET="your-strong-secret"  # Generează cu: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (opțional)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Pentru Diferite Medii

#### Development
```env
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

#### Production
```env
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

#### Testing cu ngrok
```env
NEXTAUTH_URL="https://your-ngrok-url.ngrok.io"
NODE_ENV="development"
```

#### Testing pe LAN
```env
NEXTAUTH_URL="http://192.168.1.100:3000"
NODE_ENV="development"
```

## Testing și Debugging

### Endpoint-uri de Debug
Aplicația include endpoint-uri speciale pentru debugging:

#### 1. Debug General
```
GET /api/dev/debug
```
Returnează informații despre configurația aplicației.

#### 2. Debug OAuth
```
GET /api/dev/oauth-debug
```
Returnează informații specifice OAuth, inclusiv cookie-uri și URL-uri de callback.

#### 3. Clear Rate Limits
```
GET /api/dev/clear-rate-limits
```
Șterge rate limit-urile pentru testing.

### Verificarea Configurației

#### 1. Verifică Cookie-urile
În browser developer tools:
- Mergi la "Application" > "Cookies"
- Verifică că cookie-urile NextAuth sunt prezente
- Verifică că au setările corecte (`SameSite`, `Secure`)

#### 2. Verifică Redirect-urile
- Încearcă să te autentifici
- Verifică în Network tab că redirect-urile merg la URL-urile corecte
- Verifică că nu apar erori 404 pentru callback-uri

#### 3. Verifică Logs
- Verifică console logs pentru mesaje de debug
- Caută erori OAuth în server logs

## Probleme Comune și Soluții

### 1. "redirect_uri_mismatch"
**Cauza**: URL-ul de redirect nu este configurat în provider.

**Soluția**: 
- Verifică că ai adăugat URL-ul exact în provider
- Verifică că nu ai spații sau caractere invalide
- Verifică că folosești protocolul corect (http/https)

### 2. Cookie-uri nu se salvează pe mobile
**Cauza**: Configurația `SameSite` sau `Secure` incorectă.

**Soluția**:
- Verifică că folosești `SameSite=None` în producție
- Verifică că folosești `Secure=true` cu HTTPS
- Verifică că domeniul este configurat corect

### 3. Eșecuri în producție dar merge local
**Cauza**: Diferențe în configurația de mediu.

**Soluția**:
- Verifică că `NEXTAUTH_URL` este setat corect
- Verifică că toate redirect URI-urile sunt configurate
- Verifică că certificatele SSL sunt valide

### 4. Eșecuri pe mobile browsers
**Cauza**: Restricții de securitate ale browser-elor mobile.

**Soluția**:
- Folosește `SameSite=None` cu `Secure=true`
- Verifică că nu ai popup blockers
- Testează pe diferite browser-e mobile

## Optimizări Implementate

### 1. Cookie Configuration
- Configurație adaptivă bazată pe mediu
- Suport pentru cross-origin requests
- Securitate îmbunătățită

### 2. Error Handling
- Logging detaliat pentru debugging
- Fallback-uri pentru eșecuri
- Mesaje de eroare informative

### 3. Mobile Support
- Configurație optimizată pentru mobile browsers
- Suport pentru diferite protocoale
- Gestionare îmbunătățită a redirect-urilor

### 4. Production Ready
- Configurație HTTPS automată
- Headers de securitate
- Rate limiting pentru protecție

## Următorii Pași

1. **Configurează providerii** folosind instrucțiunile de mai sus
2. **Testează în development** cu endpoint-urile de debug
3. **Testează pe mobile** cu diferite browser-e
4. **Deploy în producție** cu configurația HTTPS
5. **Monitorizează logs** pentru erori OAuth

## Suport

Pentru probleme suplimentare:
- Verifică logs-urile aplicației
- Folosește endpoint-urile de debug
- Verifică configurația providerilor
- Testează pe diferite medii și dispozitive
