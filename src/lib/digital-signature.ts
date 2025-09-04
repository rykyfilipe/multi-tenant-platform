/** @format */

import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

export interface DigitalSignature {
	id: string;
	signerId: string;
	signerName: string;
	signerEmail: string;
	signature: string;
	timestamp: string;
	certificate: string;
	algorithm: 'RSA-SHA256' | 'ECDSA-SHA256';
	valid: boolean;
	verifiedAt?: string;
}

export interface SignatureCertificate {
	id: string;
	subject: string;
	issuer: string;
	validFrom: string;
	validTo: string;
	algorithm: string;
	publicKey: string;
	serialNumber: string;
	thumbprint: string;
}

export interface SignatureValidationResult {
	valid: boolean;
	trusted: boolean;
	errors: string[];
	warnings: string[];
	certificate?: SignatureCertificate;
	signature?: DigitalSignature;
}

export class DigitalSignatureService {
	private static instance: DigitalSignatureService;
	private privateKey: string;
	private publicKey: string;
	private certificateStore: Map<string, SignatureCertificate>;

	constructor() {
		this.privateKey = process.env.DIGITAL_SIGNATURE_PRIVATE_KEY || '';
		this.publicKey = process.env.DIGITAL_SIGNATURE_PUBLIC_KEY || '';
		this.certificateStore = new Map();
		this.initializeDefaultCertificate();
	}

	static getInstance(): DigitalSignatureService {
		if (!DigitalSignatureService.instance) {
			DigitalSignatureService.instance = new DigitalSignatureService();
		}
		return DigitalSignatureService.instance;
	}

	private initializeDefaultCertificate(): void {
		if (!this.privateKey || !this.publicKey) {
			// Generate default certificate for development
			const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
				modulusLength: 2048,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
				},
			});

			this.privateKey = privateKey;
			this.publicKey = publicKey;

			const certificate: SignatureCertificate = {
				id: 'default-cert',
				subject: 'CN=MultiTenantPlatform, O=Development, C=RO',
				issuer: 'CN=MultiTenantPlatform CA, O=Development, C=RO',
				validFrom: new Date().toISOString(),
				validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
				algorithm: 'RSA-SHA256',
				publicKey: publicKey,
				serialNumber: crypto.randomBytes(16).toString('hex'),
				thumbprint: crypto.createHash('sha256').update(publicKey).digest('hex'),
			};

			this.certificateStore.set('default-cert', certificate);
		}
	}

	/**
	 * Sign invoice data with digital signature
	 */
	async signInvoice(
		invoiceData: string,
		signerId: string,
		signerName: string,
		signerEmail: string,
		algorithm: 'RSA-SHA256' | 'ECDSA-SHA256' = 'RSA-SHA256'
	): Promise<DigitalSignature> {
		try {
			// Create signature data
			const signatureData = {
				invoiceData,
				signerId,
				timestamp: new Date().toISOString(),
				algorithm,
			};

			const signatureString = JSON.stringify(signatureData);
			const hash = crypto.createHash('sha256').update(signatureString).digest();

			// Sign the hash
			const sign = crypto.createSign(algorithm);
			sign.update(hash);
			const signature = sign.sign(this.privateKey, 'base64');

			// Get certificate
			const certificate = this.certificateStore.get('default-cert');
			if (!certificate) {
				throw new Error('No certificate available for signing');
			}

			const digitalSignature: DigitalSignature = {
				id: crypto.randomUUID(),
				signerId,
				signerName,
				signerEmail,
				signature,
				timestamp: new Date().toISOString(),
				certificate: certificate.id,
				algorithm,
				valid: true,
			};

			return digitalSignature;
		} catch (error) {
			console.error('Digital signature error:', error);
			throw new Error(`Failed to sign invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Verify digital signature
	 */
	async verifySignature(
		invoiceData: string,
		signature: DigitalSignature
	): Promise<SignatureValidationResult> {
		try {
			// Get certificate
			const certificate = this.certificateStore.get(signature.certificate);
			if (!certificate) {
				return {
					valid: false,
					trusted: false,
					errors: ['Certificate not found'],
					warnings: [],
				};
			}

			// Check certificate validity
			const now = new Date();
			const validFrom = new Date(certificate.validFrom);
			const validTo = new Date(certificate.validTo);

			if (now < validFrom || now > validTo) {
				return {
					valid: false,
					trusted: false,
					errors: ['Certificate has expired or is not yet valid'],
					warnings: [],
					certificate,
					signature,
				};
			}

			// Recreate signature data
			const signatureData = {
				invoiceData,
				signerId: signature.signerId,
				timestamp: signature.timestamp,
				algorithm: signature.algorithm,
			};

			const signatureString = JSON.stringify(signatureData);
			const hash = crypto.createHash('sha256').update(signatureString).digest();

			// Verify signature
			const verify = crypto.createVerify(signature.algorithm);
			verify.update(hash);
			const isValid = verify.verify(certificate.publicKey, signature.signature, 'base64');

			return {
				valid: isValid,
				trusted: true, // In production, this would check against a trusted CA
				errors: isValid ? [] : ['Signature verification failed'],
				warnings: [],
				certificate,
				signature,
			};
		} catch (error) {
			console.error('Signature verification error:', error);
			return {
				valid: false,
				trusted: false,
				errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
				warnings: [],
				signature,
			};
		}
	}

	/**
	 * Add digital signature to PDF
	 */
	async addSignatureToPDF(
		pdfBuffer: Buffer,
		signature: DigitalSignature,
		position: { x: number; y: number; width: number; height: number } = { x: 50, y: 50, width: 200, height: 50 }
	): Promise<Buffer> {
		try {
			const pdfDoc = await PDFDocument.load(pdfBuffer);
			const pages = pdfDoc.getPages();
			const firstPage = pages[0];

			// Add signature text
			firstPage.drawText(`Digitally signed by: ${signature.signerName}`, {
				x: position.x,
				y: position.y + 30,
				size: 10,
			});

			firstPage.drawText(`Date: ${new Date(signature.timestamp).toLocaleString()}`, {
				x: position.x,
				y: position.y + 20,
				size: 8,
			});

			firstPage.drawText(`Signature ID: ${signature.id}`, {
				x: position.x,
				y: position.y + 10,
				size: 8,
			});

			firstPage.drawText(`Algorithm: ${signature.algorithm}`, {
				x: position.x,
				y: position.y,
				size: 8,
			});

			// Add signature verification QR code (placeholder)
			firstPage.drawText('✓ Digitally Signed', {
				x: position.x + 150,
				y: position.y + 20,
				size: 12,
			});

			return Buffer.from(await pdfDoc.save());
		} catch (error) {
			console.error('PDF signature error:', error);
			throw new Error(`Failed to add signature to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Generate signature certificate
	 */
	async generateCertificate(
		subject: string,
		issuer: string,
		validityDays: number = 365
	): Promise<SignatureCertificate> {
		try {
			const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
				modulusLength: 2048,
				publicKeyEncoding: {
					type: 'spki',
					format: 'pem',
				},
				privateKeyEncoding: {
					type: 'pkcs8',
					format: 'pem',
				},
			});

			const now = new Date();
			const validTo = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

			const certificate: SignatureCertificate = {
				id: crypto.randomUUID(),
				subject,
				issuer,
				validFrom: now.toISOString(),
				validTo: validTo.toISOString(),
				algorithm: 'RSA-SHA256',
				publicKey: publicKey,
				serialNumber: crypto.randomBytes(16).toString('hex'),
				thumbprint: crypto.createHash('sha256').update(publicKey).digest('hex'),
			};

			this.certificateStore.set(certificate.id, certificate);
			return certificate;
		} catch (error) {
			console.error('Certificate generation error:', error);
			throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get all certificates
	 */
	getCertificates(): SignatureCertificate[] {
		return Array.from(this.certificateStore.values());
	}

	/**
	 * Get certificate by ID
	 */
	getCertificate(id: string): SignatureCertificate | undefined {
		return this.certificateStore.get(id);
	}

	/**
	 * Revoke certificate
	 */
	revokeCertificate(id: string): boolean {
		return this.certificateStore.delete(id);
	}

	/**
	 * Validate certificate
	 */
	validateCertificate(certificate: SignatureCertificate): {
		valid: boolean;
		errors: string[];
		warnings: string[];
	} {
		const errors: string[] = [];
		const warnings: string[] = [];

		const now = new Date();
		const validFrom = new Date(certificate.validFrom);
		const validTo = new Date(certificate.validTo);

		if (now < validFrom) {
			errors.push('Certificate is not yet valid');
		}

		if (now > validTo) {
			errors.push('Certificate has expired');
		}

		// Check if certificate expires within 30 days
		const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
		if (validTo < thirtyDaysFromNow) {
			warnings.push('Certificate expires within 30 days');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}
}

export default DigitalSignatureService;
