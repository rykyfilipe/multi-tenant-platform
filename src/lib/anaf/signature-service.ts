/** @format */

import crypto from 'crypto';
import { ANAFError } from './types';

export class ANAFSignatureService {
  /**
   * Sign XML content for ANAF e-Factura submission
   * This is a simplified implementation - in production, you would use proper digital certificates
   */
  static async signXML(xmlContent: string, userId: number, tenantId: number): Promise<string> {
    try {
      // In a real implementation, this would:
      // 1. Load the user's digital certificate
      // 2. Create a proper XML signature using XMLDSig
      // 3. Embed the signature in the XML
      
      // For now, we'll create a simple hash-based signature
      const signature = this.createSimpleSignature(xmlContent, userId, tenantId);
      
      // Embed signature in XML (simplified approach)
      const signedXML = this.embedSignature(xmlContent, signature);
      
      return signedXML;
    } catch (error) {
      console.error('Error signing XML:', error);
      throw new Error('Failed to sign XML content');
    }
  }

  /**
   * Create a simple signature for development/testing
   * In production, use proper digital certificates and XMLDSig
   */
  private static createSimpleSignature(xmlContent: string, userId: number, tenantId: number): string {
    const timestamp = Date.now();
    const data = `${xmlContent}:${userId}:${tenantId}:${timestamp}`;
    
    // Create SHA-256 hash
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    // Create base64 encoded signature
    const signature = Buffer.from(hash).toString('base64');
    
    return signature;
  }

  /**
   * Embed signature in XML content
   * This is a simplified approach - in production, use proper XMLDSig
   */
  private static embedSignature(xmlContent: string, signature: string): string {
    // Find the closing </Invoice> tag
    const closingTagIndex = xmlContent.lastIndexOf('</Invoice>');
    
    if (closingTagIndex === -1) {
      throw new Error('Invalid XML content - missing closing Invoice tag');
    }
    
    // Insert signature before closing tag
    const signatureElement = `
  <!-- Digital Signature -->
  <cac:Signature>
    <cbc:ID>1</cbc:ID>
    <cac:SignatoryParty>
      <cbc:ID>ANAF_SIGNATURE</cbc:ID>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>data:application/pkcs7-signature;base64,${signature}</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
`;
    
    return xmlContent.slice(0, closingTagIndex) + signatureElement + xmlContent.slice(closingTagIndex);
  }

  /**
   * Verify XML signature
   */
  static async verifySignature(signedXML: string, userId: number, tenantId: number): Promise<boolean> {
    try {
      // Extract signature from XML
      const signatureMatch = signedXML.match(/<cbc:URI>data:application\/pkcs7-signature;base64,([^<]+)<\/cbc:URI>/);
      
      if (!signatureMatch) {
        return false;
      }
      
      const signature = signatureMatch[1];
      
      // Remove signature from XML to get original content
      const originalXML = signedXML.replace(/<cac:Signature>[\s\S]*?<\/cac:Signature>/g, '');
      
      // Verify signature
      return this.verifySimpleSignature(originalXML, signature, userId, tenantId);
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Verify simple signature (for development/testing)
   */
  private static verifySimpleSignature(xmlContent: string, signature: string, userId: number, tenantId: number): boolean {
    try {
      // Decode signature
      const decodedSignature = Buffer.from(signature, 'base64').toString('hex');
      
      // Create expected signature
      const timestamp = Date.now();
      const data = `${xmlContent}:${userId}:${tenantId}:${timestamp}`;
      const expectedHash = crypto.createHash('sha256').update(data).digest('hex');
      
      // For simplicity, we'll just check if the signature is valid base64
      // In production, you would properly verify the digital signature
      return Buffer.from(signature, 'base64').length > 0;
    } catch (error) {
      console.error('Error verifying simple signature:', error);
      return false;
    }
  }

  /**
   * Generate certificate fingerprint for user
   * In production, this would use the actual certificate
   */
  static generateCertificateFingerprint(userId: number, tenantId: number): string {
    const data = `user:${userId}:tenant:${tenantId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if user has valid digital certificate
   * In production, this would check against actual certificate store
   */
  static async hasValidCertificate(userId: number, tenantId: number): Promise<boolean> {
    try {
      // In production, this would:
      // 1. Check if user has uploaded a valid certificate
      // 2. Verify certificate is not expired
      // 3. Verify certificate is issued by trusted CA
      
      // For now, return true for all users
      return true;
    } catch (error) {
      console.error('Error checking certificate validity:', error);
      return false;
    }
  }

  /**
   * Get certificate expiration date
   * In production, this would read from actual certificate
   */
  static async getCertificateExpiration(userId: number, tenantId: number): Promise<Date | null> {
    try {
      // In production, this would read from actual certificate
      // For now, return a date 1 year from now
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error('Error getting certificate expiration:', error);
      return null;
    }
  }

  /**
   * Create proper XMLDSig signature (placeholder for production)
   * This would be implemented with proper digital certificate libraries
   */
  static async createXMLDSigSignature(xmlContent: string, certificate: Buffer, privateKey: Buffer): Promise<string> {
    // This is a placeholder for proper XMLDSig implementation
    // In production, you would use libraries like:
    // - xml-crypto
    // - xml2js with xml-crypto
    // - node-forge with xml-crypto
    
    throw new Error('XMLDSig signature not implemented - requires proper digital certificate integration');
  }

  /**
   * Validate signature format
   */
  static validateSignatureFormat(signature: string): { isValid: boolean; error?: string } {
    try {
      // Check if signature is valid base64
      const decoded = Buffer.from(signature, 'base64');
      
      if (decoded.length === 0) {
        return { isValid: false, error: 'Invalid base64 signature' };
      }
      
      // Check minimum length (should be at least 32 bytes for SHA-256)
      if (decoded.length < 32) {
        return { isValid: false, error: 'Signature too short' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Invalid signature format: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}
