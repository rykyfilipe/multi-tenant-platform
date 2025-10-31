# ANAF e-Factura Integration - Quick Start

## 🚀 Setup Rapid (5 minute)

### 1. Instalare Dependințe

```bash
npm install node-forge
npm install --save-dev @types/node-forge
```

### 2. Configurare Environment Variables

Creează/editează `.env`:

```bash
# OAuth2 ANAF
ANAF_CLIENT_ID=your_client_id
ANAF_CLIENT_SECRET=your_client_secret
ANAF_REDIRECT_URI=https://yourdomain.com/api/anaf/callback

# Environment (sandbox sau production)
ANAF_ENVIRONMENT=sandbox
ANAF_BASE_URL=https://api.anaf.ro/test/FCTEL/rest

# Certificate Encryption (generează cu: openssl rand -hex 32)
ANAF_CERTIFICATE_ENCRYPTION_KEY=your_256_bit_key_here
```

### 3. Migrare Bază de Date

```bash
npx prisma migrate dev --name add_anaf_tables
```

### 4. Test Conectivitate

```bash
curl http://localhost:3000/api/anaf/test/connectivity
```

---

## 📝 Fluxul Complet pentru Utilizatori

### Pas 1: Încărcare Certificat Digital

```typescript
// Frontend
const uploadCertificate = async (file: File, password: string) => {
	const formData = new FormData();
	formData.append("certificate", file);
	formData.append("password", password);

	const response = await fetch("/api/anaf/certificate/upload", {
		method: "POST",
		body: formData,
	});

	return response.json();
};
```

### Pas 2: Trimitere Factură

```typescript
const submitInvoice = async (invoiceId: number) => {
	const response = await fetch("/api/anaf/invoice/upload", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ invoiceId }),
	});

	return response.json();
};
```

### Pas 3: Verificare Status

```typescript
const checkStatus = async (submissionId: string) => {
	const response = await fetch(`/api/anaf/invoice/status/${submissionId}`);
	return response.json();
};
```

### Pas 4: Descărcare Răspuns

```typescript
const downloadResponse = async (submissionId: string) => {
	const response = await fetch(`/api/anaf/invoice/download/${submissionId}`);
	const blob = await response.blob();

	// Trigger download
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `anaf_response_${submissionId}.xml`;
	a.click();
};
```

---

## 🔐 Securitate

### Generare Cheie de Criptare

```bash
openssl rand -hex 32
```

### Validare Certificat Înainte de Upload

```bash
openssl pkcs12 -in certificate.pfx -info -noout
```

---

## 📚 Documentație Completă

Vezi [ANAF_INTEGRATION.md](./ANAF_INTEGRATION.md) pentru:

- Explicații detaliate
- Toate API endpoints
- Exemple complete
- Troubleshooting
- Best practices

---

## ✅ Checklist Implementare

- [ ] Instalat dependințe (node-forge)
- [ ] Configurat variabile de mediu
- [ ] Rulat migrări Prisma
- [ ] Testat conectivitate ANAF
- [ ] Obținut certificat digital ANAF
- [ ] Încărcat certificat în aplicație
- [ ] Testat trimitere factură
- [ ] Verificat rate limiting
- [ ] Configurat audit logging

---

## 🆘 Suport

- **Documentație Completă**: [ANAF_INTEGRATION.md](./ANAF_INTEGRATION.md)
- **API Reference**: [docs/api/anaf](./api/anaf.md)
- **ANAF Official**: https://www.anaf.ro/
- **Support**: support@yourdomain.com
