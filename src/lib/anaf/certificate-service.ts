/**
 * ANAF Certificate Service
 * 
 * Handles digital certificate management for ANAF e-Factura integration.
 * Supports PKCS12 certificates (.pfx / .p12) with password protection.
 * 
 * Security features:
 * - AES-256-GCM encryption for stored certificates
 * - Password validation and strength checks
 * - Certificate expiration validation
 * - Audit logging for certificate operations
 * 
 * @author MultiTenantPlatform
 * @version 1.0.0
 */

import crypto from 'crypto';
import forge from 'node-forge';
import prisma from '@/lib/prisma';
import { ANAFErrorHandler, ANAFErrorType, ANAFErrorContext } from './error-handler';

export interface CertificateInfo {
  subject: {
    commonName: string;
    organization?: string;
    organizationalUnit?: string;
    country?: string;
  };
  issuer: {
    commonName: string;
    organization?: string;
  };
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  thumbprint: string;
  isValid: boolean;
  daysUntilExpiry: number;
}

export interface CertificateUploadResult {
  success: boolean;
  certificateId?: number;
  info?: CertificateInfo;
  error?: string;
}

export interface CertificateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info?: CertificateInfo;
}

export class ANAFCertificateService {
  // Encryption configuration
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly AUTH_TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  
  // Certificate validation thresholds
  private static readonly MIN_PASSWORD_LENGTH = 8;
  private static readonly EXPIRY_WARNING_DAYS = 30;
  
  /**
   * Get encryption key from environment
   * CRITICAL: This key MUST be stored securely (e.g., AWS Secrets Manager, HashiCorp Vault)
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.ANAF_CERTIFICATE_ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error(
        'ANAF_CERTIFICATE_ENCRYPTION_KEY not set. ' +
        'Generate one using: openssl rand -hex 32'
      );
    }
    
    // Derive 256-bit key from hex string
    return Buffer.from(key, 'hex');
  }

  /**
   * Upload and store digital certificate
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param certificateBuffer PKCS12 certificate file buffer
   * @param password Certificate password
   * @returns Promise<CertificateUploadResult>
   */
  static async uploadCertificate(
    userId: number,
    tenantId: number,
    certificateBuffer: Buffer,
    password: string
  ): Promise<CertificateUploadResult> {
    const context: ANAFErrorContext = {
      userId,
      tenantId,
      operation: 'upload_certificate'
    };

    try {
      console.log('[Certificate] Starting certificate upload:', { userId, tenantId });

      // Validate password strength
      if (password.length < this.MIN_PASSWORD_LENGTH) {
        throw new Error(
          `Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`
        );
      }

      // Parse and validate certificate
      const certInfo = await this.parseCertificate(certificateBuffer, password);
      
      if (!certInfo.isValid) {
        throw new Error('Certificate is invalid or expired');
      }

      // Check for existing certificate
      const existing = await prisma.aNAFCertificate.findFirst({
        where: {
          userId,
          tenantId,
          isActive: true,
        },
      });

      if (existing) {
        // Deactivate old certificate
        await prisma.aNAFCertificate.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
        
        console.log('[Certificate] Deactivated existing certificate:', existing.id);
      }

      // Encrypt certificate
      const encrypted = await this.encryptCertificate(certificateBuffer, password);

      // Store in database
      const certificate = await prisma.aNAFCertificate.create({
        data: {
          userId,
          tenantId,
          encryptedData: encrypted.data,
          encryptedPassword: encrypted.password,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          salt: encrypted.salt,
          thumbprint: certInfo.thumbprint,
          serialNumber: certInfo.serialNumber,
          subject: JSON.stringify(certInfo.subject),
          issuer: JSON.stringify(certInfo.issuer),
          validFrom: certInfo.validFrom,
          validTo: certInfo.validTo,
          isActive: true,
        },
      });

      // Log certificate upload
      await this.logCertificateOperation(
        userId,
        tenantId,
        'upload',
        certificate.id,
        'Certificate uploaded successfully'
      );

      console.log('[Certificate] Certificate uploaded successfully:', certificate.id);

      return {
        success: true,
        certificateId: certificate.id,
        info: certInfo,
      };
    } catch (error) {
      const anafError = await ANAFErrorHandler.handleError(error as Error, context);
      return {
        success: false,
        error: ANAFErrorHandler.getUserFriendlyMessage(anafError),
      };
    }
  }

  /**
   * Get certificate information
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Promise<CertificateInfo | null>
   */
  static async getCertificateInfo(
    userId: number,
    tenantId: number
  ): Promise<CertificateInfo | null> {
    try {
      const certificate = await prisma.aNAFCertificate.findFirst({
        where: {
          userId,
          tenantId,
          isActive: true,
        },
      });

      if (!certificate) {
        return null;
      }

      const daysUntilExpiry = Math.floor(
        (certificate.validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      return {
        subject: JSON.parse(certificate.subject as string),
        issuer: JSON.parse(certificate.issuer as string),
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        serialNumber: certificate.serialNumber,
        thumbprint: certificate.thumbprint,
        isValid: certificate.validTo > new Date(),
        daysUntilExpiry,
      };
    } catch (error) {
      console.error('[Certificate] Error getting certificate info:', error);
      return null;
    }
  }

  /**
   * Get decrypted certificate for signing
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Promise<{ certificate: Buffer, password: string } | null>
   */
  static async getDecryptedCertificate(
    userId: number,
    tenantId: number
  ): Promise<{ certificate: Buffer; password: string } | null> {
    try {
      const cert = await prisma.aNAFCertificate.findFirst({
        where: {
          userId,
          tenantId,
          isActive: true,
        },
      });

      if (!cert) {
        return null;
      }

      // Check if certificate is still valid
      if (cert.validTo < new Date()) {
        throw new Error('Certificate has expired');
      }

      // Decrypt certificate and password
      const certificate = await this.decryptCertificate(
        Buffer.from(cert.encryptedData),
        Buffer.from(cert.iv),
        Buffer.from(cert.authTag),
        Buffer.from(cert.salt)
      );

      const password = await this.decryptPassword(
        Buffer.from(cert.encryptedPassword),
        Buffer.from(cert.salt)
      );

      return {
        certificate,
        password,
      };
    } catch (error) {
      console.error('[Certificate] Error getting decrypted certificate:', error);
      return null;
    }
  }

  /**
   * Validate certificate
   * 
   * @param certificateBuffer PKCS12 certificate buffer
   * @param password Certificate password
   * @returns Promise<CertificateValidationResult>
   */
  static async validateCertificate(
    certificateBuffer: Buffer,
    password: string
  ): Promise<CertificateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse certificate
      const certInfo = await this.parseCertificate(certificateBuffer, password);

      // Check expiration
      if (!certInfo.isValid) {
        errors.push('Certificate has expired');
      } else if (certInfo.daysUntilExpiry <= this.EXPIRY_WARNING_DAYS) {
        warnings.push(
          `Certificate will expire in ${certInfo.daysUntilExpiry} days`
        );
      }

      // Check if certificate is issued by valid CA
      const validIssuers = ['ANAF', 'Autoritatea Naționala de Administrare Fiscală'];
      const issuerOk = validIssuers.some(issuer =>
        certInfo.issuer.commonName.includes(issuer) ||
        certInfo.issuer.organization?.includes(issuer)
      );

      if (!issuerOk) {
        warnings.push(
          'Certificate issuer is not recognized as ANAF. ' +
          'Ensure this is a valid ANAF-issued certificate.'
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        info: certInfo,
      };
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Failed to parse certificate'
      );
      
      return {
        isValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Revoke certificate
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Promise<boolean>
   */
  static async revokeCertificate(
    userId: number,
    tenantId: number
  ): Promise<boolean> {
    try {
      await prisma.aNAFCertificate.updateMany({
        where: {
          userId,
          tenantId,
          isActive: true,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      await this.logCertificateOperation(
        userId,
        tenantId,
        'revoke',
        null,
        'Certificate revoked by user'
      );

      return true;
    } catch (error) {
      console.error('[Certificate] Error revoking certificate:', error);
      return false;
    }
  }

  /**
   * Parse PKCS12 certificate
   */
  private static async parseCertificate(
    certificateBuffer: Buffer,
    password: string
  ): Promise<CertificateInfo> {
    try {
      // Convert Buffer to forge format
      const p12Der = forge.util.createBuffer(certificateBuffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      
      // Parse PKCS12
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
      
      // Get certificate bags
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      
      if (!certBag || certBag.length === 0) {
        throw new Error('No certificate found in PKCS12 file');
      }
      
      const cert = certBag[0].cert;
      if (!cert) {
        throw new Error('Invalid certificate structure');
      }

      // Extract certificate information
      const subject = cert.subject.attributes.reduce((acc: any, attr: any) => {
        if (attr.shortName === 'CN') acc.commonName = attr.value;
        if (attr.shortName === 'O') acc.organization = attr.value;
        if (attr.shortName === 'OU') acc.organizationalUnit = attr.value;
        if (attr.shortName === 'C') acc.country = attr.value;
        return acc;
      }, {});

      const issuer = cert.issuer.attributes.reduce((acc: any, attr: any) => {
        if (attr.shortName === 'CN') acc.commonName = attr.value;
        if (attr.shortName === 'O') acc.organization = attr.value;
        return acc;
      }, {});

      // Calculate certificate thumbprint (SHA-1 hash)
      const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      const md = forge.md.sha1.create();
      md.update(der);
      const thumbprint = md.digest().toHex().toUpperCase();

      // Check validity
      const now = new Date();
      const validFrom = cert.validity.notBefore;
      const validTo = cert.validity.notAfter;
      const isValid = now >= validFrom && now <= validTo;
      
      const daysUntilExpiry = Math.floor(
        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        subject,
        issuer,
        validFrom,
        validTo,
        serialNumber: cert.serialNumber,
        thumbprint,
        isValid,
        daysUntilExpiry,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid password')) {
        throw new Error('Invalid certificate password');
      }
      throw new Error(
        `Failed to parse certificate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Encrypt certificate using AES-256-GCM
   */
  private static async encryptCertificate(
    certificateBuffer: Buffer,
    password: string
  ): Promise<{
    data: Buffer;
    password: Buffer;
    iv: Buffer;
    authTag: Buffer;
    salt: Buffer;
  }> {
    const key = this.getEncryptionKey();
    
    // Generate random IV and salt
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);

    // Encrypt certificate
    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(certificateBuffer),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Encrypt password separately
    const passwordCipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    const encryptedPassword = Buffer.concat([
      passwordCipher.update(Buffer.from(password, 'utf8')),
      passwordCipher.final(),
    ]);

    return {
      data: encrypted,
      password: encryptedPassword,
      iv,
      authTag,
      salt,
    };
  }

  /**
   * Decrypt certificate
   */
  private static async decryptCertificate(
    encryptedData: Buffer,
    iv: Buffer,
    authTag: Buffer,
    salt: Buffer
  ): Promise<Buffer> {
    const key = this.getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
  }

  /**
   * Decrypt password
   */
  private static async decryptPassword(
    encryptedPassword: Buffer,
    salt: Buffer
  ): Promise<string> {
    const key = this.getEncryptionKey();
    
    // For password, we use a simple encryption without auth tag
    // In production, use the same method as certificate with auth tag
    const iv = salt.slice(0, this.IV_LENGTH);
    
    const decipher = crypto.createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedPassword),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Log certificate operation
   */
  private static async logCertificateOperation(
    userId: number,
    tenantId: number,
    operation: string,
    certificateId: number | null,
    message: string
  ): Promise<void> {
    try {
      await prisma.aNAFAuditLog.create({
        data: {
          userId,
          tenantId,
          operation: `certificate_${operation}`,
          entityType: 'certificate',
          entityId: certificateId,
          message,
          ipAddress: null, // Set from request context in API route
          userAgent: null, // Set from request context in API route
        },
      });
    } catch (error) {
      console.error('[Certificate] Error logging operation:', error);
      // Don't throw - logging failure shouldn't stop the operation
    }
  }
}
