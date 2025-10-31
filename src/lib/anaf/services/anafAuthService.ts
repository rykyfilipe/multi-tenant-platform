/**
 * ANAF Authentication Service
 * 
 * Handles OAuth2 authentication with mutual TLS (mTLS) using digital certificates.
 * 
 * CRITICAL: All requests to logincert.anaf.ro MUST use client certificate authentication.
 * 
 * Flow:
 * 1. User uploads .pfx certificate + password
 * 2. App initiates OAuth2 flow with mTLS
 * 3. User logs in with ANAF username/password (NOT certificate password)
 * 4. ANAF redirects with authorization code
 * 5. App exchanges code for access_token (with mTLS)
 * 6. Token is stored and refreshed automatically
 * 
 * @author MultiTenantPlatform
 * @version 2.0.0 - Professional mTLS Implementation
 */

import https from 'https';
import forge from 'node-forge';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { ANAFCertificateService } from '../certificate-service';

export interface ANAFAuthConfig {
  clientId: string; // CUI al firmei
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
}

export interface ANAFTokenData {
  access_token: string;
  refresh_token?: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

export interface ANAFAuthResult {
  success: boolean;
  data?: ANAFTokenData;
  error?: string;
}

export class ANAFAuthService {
  private static readonly CONFIG: ANAFAuthConfig = {
    clientId: process.env.ANAF_CLIENT_ID || '', // CUI fără RO
    redirectUri: process.env.ANAF_REDIRECT_URI || 'https://ydv.digital/api/anaf/callback',
    authUrl: process.env.ANAF_AUTH_URL || 'https://logincert.anaf.ro/anaf-oauth2/v1/authorize',
    tokenUrl: process.env.ANAF_TOKEN_URL || 'https://logincert.anaf.ro/anaf-oauth2/v1/token',
    scope: 'openid', // Conform documentației ANAF
  };

  /**
   * Step 1: Generate OAuth2 authorization URL
   * User will be redirected here to login with ANAF credentials
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Authorization URL
   */
  static async getAuthorizationUrl(userId: number, tenantId: number): Promise<string> {
    // Generate CSRF protection state
    const state = this.generateState(userId, tenantId);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CONFIG.clientId,
      redirect_uri: this.CONFIG.redirectUri,
      scope: this.CONFIG.scope,
      state,
    });

    return `${this.CONFIG.authUrl}?${params.toString()}`;
  }

  /**
   * Step 2: Exchange authorization code for access token
   * This request MUST use mutual TLS with the user's certificate
   * 
   * @param code Authorization code from ANAF redirect
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Token data
   */
  static async exchangeCodeForToken(
    code: string,
    userId: number,
    tenantId: number
  ): Promise<ANAFAuthResult> {
    try {
      console.log('[ANAF Auth] Exchanging authorization code for token:', { userId, tenantId });

      // Get user's certificate for mTLS
      const certData = await ANAFCertificateService.getDecryptedCertificate(userId, tenantId);
      
      if (!certData) {
        return {
          success: false,
          error: 'Digital certificate not found. Please upload your certificate first.',
        };
      }

      // Parse PKCS12 certificate to extract cert and key
      const { cert, key } = this.parsePKCS12(certData.certificate, certData.password);

      // Prepare request body
      const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.CONFIG.redirectUri,
        client_id: this.CONFIG.clientId,
      });

      // Make mTLS request to ANAF token endpoint
      const tokenData = await this.makeSecureRequest<ANAFTokenData>(
        this.CONFIG.tokenUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: requestBody.toString(),
        },
        cert,
        key
      );

      // Store token in database
      await this.storeToken(userId, tenantId, tokenData);

      console.log('[ANAF Auth] Token exchange successful:', { userId, tenantId });

      return {
        success: true,
        data: tokenData,
      };
    } catch (error) {
      console.error('[ANAF Auth] Token exchange failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to exchange authorization code',
      };
    }
  }

  /**
   * Step 3: Refresh access token
   * This request MUST use mutual TLS with the user's certificate
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns New token data
   */
  static async refreshAccessToken(
    userId: number,
    tenantId: number
  ): Promise<ANAFAuthResult> {
    try {
      console.log('[ANAF Auth] Refreshing access token:', { userId, tenantId });

      // Get stored token
      const storedToken = await this.getStoredToken(userId, tenantId);
      
      if (!storedToken || !storedToken.refreshToken) {
        return {
          success: false,
          error: 'No refresh token available. Please re-authenticate.',
        };
      }

      // Get user's certificate for mTLS
      const certData = await ANAFCertificateService.getDecryptedCertificate(userId, tenantId);
      
      if (!certData) {
        return {
          success: false,
          error: 'Digital certificate not found.',
        };
      }

      // Parse PKCS12 certificate
      const { cert, key } = this.parsePKCS12(certData.certificate, certData.password);

      // Prepare request body
      const requestBody = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: storedToken.refreshToken,
        client_id: this.CONFIG.clientId,
      });

      // Make mTLS request to ANAF token endpoint
      const tokenData = await this.makeSecureRequest<ANAFTokenData>(
        this.CONFIG.tokenUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: requestBody.toString(),
        },
        cert,
        key
      );

      // Update token in database
      await this.storeToken(userId, tenantId, tokenData);

      console.log('[ANAF Auth] Token refresh successful:', { userId, tenantId });

      return {
        success: true,
        data: tokenData,
      };
    } catch (error) {
      console.error('[ANAF Auth] Token refresh failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh token',
      };
    }
  }

  /**
   * Get valid access token (refresh if expired)
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Valid access token
   */
  static async getValidAccessToken(userId: number, tenantId: number): Promise<string> {
    const storedToken = await this.getStoredToken(userId, tenantId);
    
    if (!storedToken) {
      throw new Error('Not authenticated with ANAF. Please login first.');
    }

    // Check if token is expired (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    const isExpired = storedToken.expiresAt.getTime() - Date.now() < bufferTime;

    if (isExpired && storedToken.refreshToken) {
      // Try to refresh token
      const refreshResult = await this.refreshAccessToken(userId, tenantId);
      
      if (refreshResult.success && refreshResult.data) {
        return refreshResult.data.access_token;
      }
      
      throw new Error('Token expired and refresh failed. Please re-authenticate.');
    }

    return storedToken.accessToken;
  }

  /**
   * Check if user is authenticated
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns True if authenticated and token is valid
   */
  static async isAuthenticated(userId: number, tenantId: number): Promise<boolean> {
    try {
      const token = await this.getValidAccessToken(userId, tenantId);
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Logout user (revoke token)
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   */
  static async logout(userId: number, tenantId: number): Promise<void> {
    await prisma.aNAFOAuthToken.updateMany({
      where: { userId, tenantId },
      data: { isActive: false },
    });
  }

  // ============================================================================
  // PRIVATE METHODS - Core mTLS Implementation
  // ============================================================================

  /**
   * Make HTTPS request with mutual TLS authentication
   * CRITICAL: This is the core of ANAF integration - all requests MUST use mTLS
   * 
   * @param url Request URL
   * @param options Request options
   * @param cert PEM-encoded certificate
   * @param key PEM-encoded private key
   * @returns Response data
   */
  private static async makeSecureRequest<T>(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: string;
    },
    cert: string,
    key: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      // Create HTTPS agent with client certificate (mTLS)
      const agent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: true, // Verify server certificate
      });

      const requestOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers,
        agent,
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData as T);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          } else {
            let errorMessage = `ANAF API error (${res.statusCode})`;
            
            try {
              const errorData = JSON.parse(data);
              errorMessage += `: ${errorData.error || errorData.message || data}`;
            } catch {
              errorMessage += `: ${data}`;
            }
            
            reject(new Error(errorMessage));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      // Send request body if present
      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Parse PKCS12 certificate to PEM format
   * 
   * @param p12Buffer PKCS12 certificate buffer
   * @param password Certificate password
   * @returns PEM-encoded certificate and key
   */
  private static parsePKCS12(
    p12Buffer: Buffer,
    password: string
  ): { cert: string; key: string } {
    try {
      // Convert Buffer to forge format
      const p12Der = forge.util.createBuffer(p12Buffer.toString('binary'));
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      
      // Parse PKCS12
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
      
      // Get certificate bags
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];
      
      if (!certBag || certBag.length === 0) {
        throw new Error('No certificate found in PKCS12 file');
      }
      
      const certificate = certBag[0].cert;
      if (!certificate) {
        throw new Error('Invalid certificate structure');
      }

      // Get private key bags
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
      
      if (!keyBag || keyBag.length === 0) {
        throw new Error('No private key found in PKCS12 file');
      }
      
      const privateKey = keyBag[0].key;
      if (!privateKey) {
        throw new Error('Invalid private key structure');
      }

      // Convert to PEM format
      const certPem = forge.pki.certificateToPem(certificate);
      const keyPem = forge.pki.privateKeyToPem(privateKey);

      return {
        cert: certPem,
        key: keyPem,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse PKCS12 certificate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Store token in database
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param tokenData Token data from ANAF
   */
  private static async storeToken(
    userId: number,
    tenantId: number,
    tokenData: ANAFTokenData
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await prisma.aNAFOAuthToken.upsert({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenType: tokenData.token_type,
        expiresAt,
        scope: tokenData.scope,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        tenantId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenType: tokenData.token_type,
        expiresAt,
        scope: tokenData.scope,
        isActive: true,
      },
    });
  }

  /**
   * Get stored token from database
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Stored token data
   */
  static async getStoredToken(
    userId: number,
    tenantId: number
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
  } | null> {
    const token = await prisma.aNAFOAuthToken.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });

    if (!token || !token.isActive) {
      return null;
    }

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
    };
  }

  /**
   * Generate secure state parameter for CSRF protection
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Base64-encoded state
   */
  private static generateState(userId: number, tenantId: number): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    const data = JSON.stringify({ userId, tenantId, timestamp, random });
    return Buffer.from(data).toString('base64url');
  }

  /**
   * Validate state parameter
   * 
   * @param state State from OAuth callback
   * @returns Decoded user and tenant IDs
   */
  static validateState(state: string): { userId: number; tenantId: number } | null {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const data = JSON.parse(decoded);

      // Check state age (max 1 hour)
      const age = Date.now() - data.timestamp;
      if (age > 3600000) {
        return null;
      }

      return {
        userId: data.userId,
        tenantId: data.tenantId,
      };
    } catch {
      return null;
    }
  }
}
