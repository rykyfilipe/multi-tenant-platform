# ANAF e-Factura Integration - Documentație Completă

## 📋 Cuprins

1. [Introducere](#introducere)
2. [Cerințe](#cerințe)
3. [Configurare Inițială](#configurare-inițială)
4. [Fluxul de Autentificare](#fluxul-de-autentificare)
5. [Gestionarea Certificatelor Digitale](#gestionarea-certificatelor-digitale)
6. [Trimitere Facturi](#trimitere-facturi)
7. [Verificare Status](#verificare-status)
8. [Descărcare Răspunsuri](#descărcare-răspunsuri)
9. [API Reference](#api-reference)
10. [Exemple Practice](#exemple-practice)
11. [Securitate](#securitate)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducere

Această documentație descrie integrarea completă cu sistemul ANAF e-Factura pentru transmiterea și gestionarea facturilor electronice în conformitate cu legislația românească.

### Ce face integrarea?

- ✅ **Autentificare OAuth2** cu ANAF
- ✅ **Gestionare certificate digitale** (.pfx / .p12)
- ✅ **Trimitere facturi XML** către ANAF
- ✅ **Verificare status** facturi trimise
- ✅ **Descărcare răspunsuri** validate de ANAF
- ✅ **Rate limiting** și protecție securitate
- ✅ **Audit logging** complet

---

## 📌 Cerințe

### 1. Certificat Digital ANAF

Pentru a utiliza această integrare, **fiecare utilizator** trebuie să dețină un **certificat digital calificat** emis de ANAF sau de un furnizor autorizat (CertSign, E-Factura).

**Unde obțin certificatul?**

- Portal ANAF: https://www.anaf.ro/
- CertSign: https://www.certsign.ro/
- Alte autorități de certificare autorizate

**Format acceptat:**

- `.pfx` (PKCS#12)
- `.p12` (PKCS#12)
- Protejat cu parolă

### 2. Credențiale OAuth2 ANAF

Aplicația trebuie înregistrată la ANAF pentru a obține:

- `client_id`
- `client_secret`
- `redirect_uri`

**Înregistrare aplicație:** https://www.anaf.ro/

### 3. Variabile de Mediu

```bash
# OAuth2 Credentials
ANAF_CLIENT_ID=your_client_id_here
ANAF_CLIENT_SECRET=your_client_secret_here
ANAF_REDIRECT_URI=https://yourdomain.com/api/anaf/callback

# Environment (sandbox sau production)
ANAF_ENVIRONMENT=sandbox
ANAF_BASE_URL=https://api.anaf.ro/test/FCTEL/rest

# Certificate Encryption Key (32 bytes hex)
# Generate with: openssl rand -hex 32
ANAF_CERTIFICATE_ENCRYPTION_KEY=your_256_bit_encryption_key_here
```

---

## ⚙️ Configurare Inițială

### 1. Instalare Dependințe

```bash
npm install node-forge
npm install --save-dev @types/node-forge
```

### 2. Configurare Bază de Date

Asigură-te că ai următoarele tabele în Prisma schema:

```prisma
model ANAFCertificate {
  id                Int       @id @default(autoincrement())
  userId            Int
  tenantId          Int
  encryptedData     Bytes
  encryptedPassword Bytes
  iv                Bytes
  authTag           Bytes
  salt              Bytes
  thumbprint        String
  serialNumber      String
  subject           String
  issuer            String
  validFrom         DateTime
  validTo           DateTime
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant            Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, tenantId])
  @@index([tenantId])
  @@index([thumbprint])
}

model ANAFCredentials {
  id              Int       @id @default(autoincrement())
  userId          Int
  tenantId        Int
  accessToken     String?
  refreshToken    String?
  tokenExpiresAt  DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, tenantId])
  @@index([tenantId])
}

model ANAFSubmissionLog {
  id              Int       @id @default(autoincrement())
  invoiceId       Int
  tenantId        Int
  submissionId    String?
  status          String    // pending, validated, rejected, error
  message         String?
  error           String?
  xmlContent      String?   @db.Text
  submittedAt     DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  retryCount      Int       @default(0)
  submissionType  String    // automatic, manual

  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([submissionId])
  @@index([invoiceId])
}

model ANAFAuditLog {
  id          Int       @id @default(autoincrement())
  userId      Int
  tenantId    Int
  operation   String    // certificate_upload, invoice_submit, status_check, etc.
  entityType  String    // certificate, invoice, etc.
  entityId    Int?
  message     String
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tenantId])
  @@index([operation])
  @@index([createdAt])
}
```

Rulează migrarea:

```bash
npx prisma migrate dev --name add_anaf_tables
```

---

## 🔐 Fluxul de Autentificare

### Metoda 1: OAuth2 Authorization Code Flow (Recomandat pentru Utilizatori)

#### Pas 1: Inițiere Autentificare

```typescript
// Frontend - Buton "Conectează cu ANAF"
const handleANAFLogin = async () => {
	try {
		const response = await fetch("/api/anaf/auth/authorize");
		const { authUrl } = await response.json();

		// Redirect user to ANAF login
		window.location.href = authUrl;
	} catch (error) {
		console.error("Failed to initiate ANAF auth:", error);
	}
};
```

#### Pas 2: Callback și Schimb Token

ANAF va redirecționa utilizatorul către `/api/anaf/callback?code=...&state=...`

```typescript
// API Route: /api/anaf/callback/route.ts
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");

	// Exchange code for access token
	const tokenResult = await ANAFAuth.getAuthorizationCodeToken(
		code,
		userId,
		tenantId
	);

	if (tokenResult.success) {
		// Redirect to success page
		return NextResponse.redirect("/dashboard?anaf=connected");
	}
}
```

### Metoda 2: Client Credentials Flow (Pentru Aplicații Server-to-Server)

```typescript
// Backend - Obținere token automat
const tokenResult = await ANAFAuth.getAccessToken({
	userId,
	tenantId,
	forceRefresh: false,
});

if (tokenResult.success) {
	console.log("Access token:", tokenResult.accessToken);
}
```

---

## 📜 Gestionarea Certificatelor Digitale

### Încărcare Certificat

#### Frontend (React/Next.js)

```tsx
"use client";

import { useState } from "react";

export function CertificateUploadForm() {
	const [file, setFile] = useState<File | null>(null);
	const [password, setPassword] = useState("");
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState<any>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!file || !password) {
			alert("Please select a certificate file and enter password");
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("certificate", file);
			formData.append("password", password);

			const response = await fetch("/api/anaf/certificate/upload", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (data.success) {
				setResult(data);
				alert("Certificate uploaded successfully!");
			} else {
				alert(`Upload failed: ${data.message}`);
			}
		} catch (error) {
			alert("Failed to upload certificate");
		} finally {
			setUploading(false);
			setPassword(""); // Clear password for security
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<div>
				<label>Certificate File (.pfx / .p12)</label>
				<input
					type="file"
					accept=".pfx,.p12"
					onChange={(e) => setFile(e.target.files?.[0] || null)}
					required
				/>
			</div>

			<div>
				<label>Certificate Password</label>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					minLength={8}
					required
				/>
			</div>

			<button type="submit" disabled={uploading}>
				{uploading ? "Uploading..." : "Upload Certificate"}
			</button>

			{result && (
				<div>
					<h3>Certificate Info</h3>
					<p>Valid from: {result.info.validFrom}</p>
					<p>Valid until: {result.info.validTo}</p>
					<p>Days until expiry: {result.info.daysUntilExpiry}</p>
					{result.warnings?.length > 0 && (
						<div>
							<strong>Warnings:</strong>
							<ul>
								{result.warnings.map((w: string, i: number) => (
									<li key={i}>{w}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</form>
	);
}
```

#### cURL Example

```bash
curl -X POST https://yourdomain.com/api/anaf/certificate/upload \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -F "certificate=@/path/to/certificate.pfx" \
  -F "password=your_certificate_password"
```

#### Response

```json
{
	"success": true,
	"certificateId": 123,
	"message": "Certificate uploaded successfully",
	"info": {
		"subject": {
			"commonName": "COMPANIA SRL",
			"organization": "COMPANIA SRL",
			"country": "RO"
		},
		"issuer": {
			"commonName": "ANAF CA",
			"organization": "ANAF"
		},
		"validFrom": "2024-01-01T00:00:00.000Z",
		"validTo": "2025-12-31T23:59:59.000Z",
		"serialNumber": "1234567890",
		"thumbprint": "A1B2C3D4E5F6...",
		"isValid": true,
		"daysUntilExpiry": 245
	},
	"warnings": []
}
```

### Verificare Status Certificat

```typescript
// Get certificate info
const certInfo = await ANAFCertificateService.getCertificateInfo(
	userId,
	tenantId
);

if (certInfo) {
	console.log("Certificate valid until:", certInfo.validTo);
	console.log("Days until expiry:", certInfo.daysUntilExpiry);

	if (certInfo.daysUntilExpiry < 30) {
		console.warn("Certificate expires soon!");
	}
}
```

---

## 📤 Trimitere Facturi

### Frontend Example

```typescript
async function submitInvoiceToANAF(invoiceId: number) {
	try {
		const response = await fetch("/api/anaf/invoice/upload", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				invoiceId,
				submissionType: "manual",
			}),
		});

		const data = await response.json();

		if (data.success) {
			console.log("Invoice submitted successfully!");
			console.log("Submission ID:", data.submissionId);
			console.log("Status:", data.status);

			// Store submission ID for later status checks
			return data.submissionId;
		} else {
			console.error("Submission failed:", data.message);
		}
	} catch (error) {
		console.error("Failed to submit invoice:", error);
	}
}
```

### cURL Example

```bash
curl -X POST https://yourdomain.com/api/anaf/invoice/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "invoiceId": 12345,
    "submissionType": "manual"
  }'
```

### Response

```json
{
	"success": true,
	"submissionId": "anaf-submission-uuid-123",
	"message": "Invoice submitted successfully",
	"status": "pending",
	"timestamp": "2024-12-01T10:30:00.000Z",
	"certificateInfo": {
		"validUntil": "2025-12-31T23:59:59.000Z",
		"daysUntilExpiry": 245
	}
}
```

---

## ✅ Verificare Status

### Frontend Example

```typescript
async function checkInvoiceStatus(submissionId: string) {
	try {
		const response = await fetch(`/api/anaf/invoice/status/${submissionId}`);
		const data = await response.json();

		if (data.success) {
			console.log("Status:", data.status);
			console.log("Message:", data.message);

			// Handle different statuses
			switch (data.status) {
				case "validated":
					console.log("✅ Invoice validated by ANAF");
					break;
				case "rejected":
					console.log("❌ Invoice rejected by ANAF");
					break;
				case "pending":
					console.log("⏳ Invoice pending validation");
					break;
			}

			return data;
		}
	} catch (error) {
		console.error("Failed to check status:", error);
	}
}
```

### cURL Example

```bash
curl -X GET https://yourdomain.com/api/anaf/invoice/status/anaf-submission-uuid-123 \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Response

```json
{
	"success": true,
	"submissionId": "anaf-submission-uuid-123",
	"status": "validated",
	"message": "Invoice validated successfully",
	"timestamp": "2024-12-01T10:35:00.000Z",
	"responseData": {
		"validationDate": "2024-12-01T10:34:30.000Z",
		"fiscalCode": "RO12345678",
		"invoiceNumber": "INV-2024-001"
	}
}
```

---

## ⬇️ Descărcare Răspunsuri

### Frontend Example

```typescript
async function downloadANAFResponse(submissionId: string) {
	try {
		const response = await fetch(`/api/anaf/invoice/download/${submissionId}`);

		if (response.ok) {
			const blob = await response.blob();
			const filename =
				response.headers
					.get("content-disposition")
					?.split("filename=")[1]
					?.replace(/"/g, "") || `anaf_response_${submissionId}.xml`;

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			window.URL.revokeObjectURL(url);

			console.log("✅ Response downloaded successfully");
		} else {
			const error = await response.json();
			console.error("Download failed:", error.message);
		}
	} catch (error) {
		console.error("Failed to download response:", error);
	}
}
```

### cURL Example

```bash
curl -X GET https://yourdomain.com/api/anaf/invoice/download/anaf-submission-uuid-123 \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -o anaf_response.xml
```

---

## 📚 API Reference

### 1. POST /api/anaf/certificate/upload

Încarcă certificat digital.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `certificate` (file): Fișier certificat (.pfx / .p12)
  - `password` (string): Parolă certificat

**Response:** `200 OK`

```json
{
	"success": true,
	"certificateId": 123,
	"info": {
		/* CertificateInfo */
	},
	"warnings": []
}
```

**Errors:**

- `400`: Invalid file type, missing password
- `401`: Unauthorized
- `500`: Server error

---

### 2. POST /api/anaf/invoice/upload

Trimite factură către ANAF.

**Request:**

- Method: `POST`
- Content-Type: `application/json`
- Body:

```json
{
	"invoiceId": 12345,
	"submissionType": "manual"
}
```

**Response:** `200 OK`

```json
{
	"success": true,
	"submissionId": "uuid",
	"message": "Invoice submitted successfully",
	"status": "pending",
	"timestamp": "2024-12-01T10:30:00.000Z"
}
```

**Errors:**

- `400`: Missing certificate, invalid invoice
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Server error

---

### 3. GET /api/anaf/invoice/status/[id]

Verifică status factură.

**Request:**

- Method: `GET`
- Path: `/api/anaf/invoice/status/{submissionId}`

**Response:** `200 OK`

```json
{
	"success": true,
	"submissionId": "uuid",
	"status": "validated",
	"message": "Invoice validated",
	"timestamp": "2024-12-01T10:35:00.000Z"
}
```

---

### 4. GET /api/anaf/invoice/download/[id]

Descarcă răspuns ANAF.

**Request:**

- Method: `GET`
- Path: `/api/anaf/invoice/download/{submissionId}`

**Response:** `200 OK`

- Content-Type: `application/xml`
- Body: XML content

---

## 🛡️ Securitate

### 1. Criptare Certificate

Certificate-le sunt stocate criptate în baza de date folosind **AES-256-GCM**:

```typescript
// Generate encryption key
openssl rand -hex 32
```

Setează în `.env`:

```bash
ANAF_CERTIFICATE_ENCRYPTION_KEY=your_256_bit_key_here
```

### 2. Rate Limiting

Limită automată de **1000 cereri/minut** per utilizator (conform specificațiilor ANAF).

### 3. Audit Logging

Toate operațiile sunt înregistrate în `ANAFAuditLog`:

- Încărcare certificate
- Trimitere facturi
- Verificări status
- Descărcări răspunsuri

### 4. Best Practices

✅ **DO:**

- Folosește HTTPS pentru toate cererile
- Stochează certificatele criptate
- Șterge parolele din memorie după folosire
- Validează toate input-urile
- Monitorizează expirarea certificatelor

❌ **DON'T:**

- Nu stoca parolele în plain text
- Nu transmite certificatele necriptate
- Nu împărtăși cheile de criptare
- Nu ignora avertismentele de securitate

---

## 🔧 Troubleshooting

### Problemă: "Certificate has expired"

**Soluție:**

1. Verifică data de expirare: `certInfo.validTo`
2. Obține un certificat nou de la ANAF
3. Încarcă certificatul nou

### Problemă: "Invalid certificate password"

**Soluție:**

1. Verifică parola certificatului
2. Testează certificatul cu:

```bash
openssl pkcs12 -in certificate.pfx -noout
```

### Problemă: "Rate limit exceeded"

**Soluție:**

1. Așteaptă `retryAfter` secunde
2. Implementează exponential backoff
3. Contactează ANAF pentru limite mai mari

### Problemă: "Authentication failed"

**Soluție:**

1. Verifică `ANAF_CLIENT_ID` și `ANAF_CLIENT_SECRET`
2. Verifică dacă aplicația e înregistrată la ANAF
3. Verifică `ANAF_REDIRECT_URI`

---

## 📞 Support

Pentru probleme tehnice sau întrebări, contactează:

- **Email**: support@yourdomain.com
- **Documentation**: https://docs.yourdomain.com/anaf
- **ANAF Support**: https://www.anaf.ro/

---

## 📄 Licență

© 2024 MultiTenantPlatform. All rights reserved.
