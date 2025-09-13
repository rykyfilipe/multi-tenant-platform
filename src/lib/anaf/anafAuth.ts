/**
 * ANAF e-Factura Authentication Module
 * 
 * This module handles OAuth2 authentication with ANAF e-Factura system
 * according to the official ANAF documentation:
 * https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf
 * 
 * Supported OAuth2 flows:
 * - client_credentials: For server-to-server API access (primary)
 * - authorization_code: For user authentication (secondary)
 * 
 * @author MultiTenantPlatform
 * @version 1.0.0
 */

import { ANAFTokenResponse, ANAFConfiguration, ANAFError } from './types';
import { ANAFErrorHandler, ANAFErrorType, ANAFErrorContext } from './error-handler';
import prisma from '@/lib/prisma';

export interface ANAFAuthResult {
  success: boolean;
  accessToken?: string;
  error?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
}

export interface ANAFAuthOptions {
  userId?: number;
  tenantId?: number;
  forceRefresh?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export class ANAFAuth {
  private static readonly CONFIG: ANAFConfiguration = {
    clientId: process.env.ANAF_CLIENT_ID || '',
    clientSecret: process.env.ANAF_CLIENT_SECRET || '',
    redirectUri: process.env.ANAF_REDIRECT_URI || 'https://ydv.digital/api/anaf/callback',
    baseUrl: process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest',
    environment: (process.env.ANAF_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };

  // ANAF OAuth2 endpoints as per official documentation
  private static readonly ANAF_ENDPOINTS = {
    // Identity Provider endpoints
    authorization: 'https://logincert.anaf.ro/anaf-oauth2/v1/authorize',
    token: 'https://logincert.anaf.ro/anaf-oauth2/v1/token',
    
    // API endpoints
    testOauth: 'https://api.anaf.ro/TestOauth/jaxrs/hello',
    
    // e-Factura API endpoints
    eFacturaTest: 'https://api.anaf.ro/test/FCTEL/rest',
    eFacturaProd: 'https://api.anaf.ro/prod/FCTEL/rest',
    
    // e-Transport API endpoints
    eTransportTest: 'https://api.anaf.ro/test/ETRANSPORT/ws/v1',
    eTransportProd: 'https://api.anaf.ro/prod/ETRANSPORT/ws/v1'
  };

  // Retry configuration
  private static readonly RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2
  };

  /**
   * Get valid access token for ANAF API access
   * 
   * This is the main method for obtaining authentication tokens.
   * It supports both client_credentials and authorization_code flows.
   * 
   * @param options Authentication options
   * @returns Promise<ANAFAuthResult>
   */
  static async getAccessToken(options: ANAFAuthOptions = {}): Promise<ANAFAuthResult> {
    const context: ANAFErrorContext = {
      userId: options.userId,
      tenantId: options.tenantId,
      operation: 'get_access_token'
    };

    try {
      // Validate configuration
      this.validateConfiguration();

      // Try to get existing valid token first (unless force refresh is requested)
      if (!options.forceRefresh && options.userId && options.tenantId) {
        const existingToken = await this.getValidStoredToken(options.userId, options.tenantId);
        if (existingToken) {
          return {
            success: true,
            accessToken: existingToken.accessToken,
            expiresAt: existingToken.tokenExpiresAt,
            tokenType: 'Bearer',
            scope: 'e-factura'
          };
        }
      }

      // Get new token using client_credentials flow (primary method)
      const tokenResult = await this.getClientCredentialsToken(options);
      
      if (tokenResult.success && options.userId && options.tenantId) {
        // Store token for future use
        await this.storeToken(options.userId, options.tenantId, tokenResult);
      }

      return tokenResult;

    } catch (error) {
      const anafError = await ANAFErrorHandler.handleError(error as Error, context);
      return {
        success: false,
        error: ANAFErrorHandler.getUserFriendlyMessage(anafError)
      };
    }
  }

  /**
   * Get access token using client_credentials grant type
   * 
   * This is the primary authentication method for ANAF e-Factura API access.
   * It uses OAuth2 client_credentials flow as specified in RFC 6749.
   * 
   * @param options Authentication options
   * @returns Promise<ANAFAuthResult>
   */
  private static async getClientCredentialsToken(options: ANAFAuthOptions = {}): Promise<ANAFAuthResult> {
    const context: ANAFErrorContext = {
      userId: options.userId,
      tenantId: options.tenantId,
      operation: 'client_credentials_token',
      endpoint: this.ANAF_ENDPOINTS.token
    };

    const maxRetries = options.maxRetries || this.RETRY_CONFIG.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`ANAF Client Credentials Token Request (attempt ${attempt}/${maxRetries}):`, {
          clientId: this.CONFIG.clientId.substring(0, 10) + '...',
          environment: this.CONFIG.environment,
          endpoint: this.ANAF_ENDPOINTS.token
        });

        // Create Basic Auth header as per ANAF documentation
        const basicAuth = Buffer.from(`${this.CONFIG.clientId}:${this.CONFIG.clientSecret}`).toString('base64');
        
        // Prepare request body for client_credentials flow
        const requestBody = new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'e-factura'
        });

        // Make token request to ANAF OAuth2 endpoint
        const response = await fetch(this.ANAF_ENDPOINTS.token, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
            'User-Agent': 'MultiTenantPlatform/1.0'
          },
          body: requestBody
        });

        const responseText = await response.text();
        
        console.log(`ANAF Client Credentials Response (attempt ${attempt}):`, {
          status: response.status,
          statusText: response.statusText,
          responseLength: responseText.length
        });

        if (!response.ok) {
          const errorData = this.parseErrorResponse(responseText);
          const error = this.createOAuthError(response.status, errorData, attempt);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          lastError = error;
          continue;
        }

        // Parse successful response
        const tokenData: ANAFTokenResponse = JSON.parse(responseText);
        
        // Validate token response
        if (!tokenData.access_token) {
          throw new Error('Invalid token response from ANAF: missing access_token');
        }

        console.log('ANAF Client Credentials Token Success:', {
          hasAccessToken: !!tokenData.access_token,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope
        });

        return {
          success: true,
          accessToken: tokenData.access_token,
          expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
          tokenType: tokenData.token_type || 'Bearer',
          scope: tokenData.scope
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`ANAF Client Credentials Token Error (attempt ${attempt}):`, error);

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        const delay = this.calculateRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Failed to obtain access token after all retries');
  }

  /**
   * Get access token using authorization_code grant type
   * 
   * This method is used when a user has already authorized the application
   * and we have an authorization code to exchange for tokens.
   * 
   * @param code Authorization code from ANAF
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Promise<ANAFAuthResult>
   */
  static async getAuthorizationCodeToken(
    code: string, 
    userId: number, 
    tenantId: number
  ): Promise<ANAFAuthResult> {
    const context: ANAFErrorContext = {
      userId,
      tenantId,
      operation: 'authorization_code_token',
      endpoint: this.ANAF_ENDPOINTS.token
    };

    try {
      console.log('ANAF Authorization Code Token Request:', {
        userId,
        tenantId,
        code: code.substring(0, 10) + '...',
        endpoint: this.ANAF_ENDPOINTS.token
      });

      // Create Basic Auth header as per ANAF documentation
      const basicAuth = Buffer.from(`${this.CONFIG.clientId}:${this.CONFIG.clientSecret}`).toString('base64');
      
      // Prepare request body for authorization_code flow
      const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.CONFIG.redirectUri
      });

      // Make token request to ANAF OAuth2 endpoint
      const response = await fetch(this.ANAF_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        },
        body: requestBody
      });

      const responseText = await response.text();
      
      console.log('ANAF Authorization Code Response:', {
        status: response.status,
        statusText: response.statusText,
        responseLength: responseText.length
      });

      if (!response.ok) {
        const errorData = this.parseErrorResponse(responseText);
        throw this.createOAuthError(response.status, errorData, 1);
      }

      // Parse successful response
      const tokenData: ANAFTokenResponse = JSON.parse(responseText);
      
      // Validate token response
      if (!tokenData.access_token) {
        throw new Error('Invalid token response from ANAF: missing access_token');
      }

      console.log('ANAF Authorization Code Token Success:', {
        userId,
        tenantId,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });

      // Store token for future use
      await this.storeToken(userId, tenantId, {
        success: true,
        accessToken: tokenData.access_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope
      });

      return {
        success: true,
        accessToken: tokenData.access_token,
        expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope
      };

    } catch (error) {
      const anafError = await ANAFErrorHandler.handleError(error as Error, context);
      return {
        success: false,
        error: ANAFErrorHandler.getUserFriendlyMessage(anafError)
      };
    }
  }

  /**
   * Generate OAuth2 authorization URL for user authentication
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Promise<string>
   */
  static async getAuthorizationUrl(userId: number, tenantId: number): Promise<string> {
    try {
      const state = this.generateState(userId, tenantId);
      const scopes = 'e-factura';
      
      const params = new URLSearchParams({
        client_id: this.CONFIG.clientId,
        redirect_uri: this.CONFIG.redirectUri,
        response_type: 'code',
        scope: scopes,
        state: state
      });

      const authUrl = `${this.ANAF_ENDPOINTS.authorization}?${params.toString()}`;
      
      console.log('ANAF Authorization URL generated:', {
        userId,
        tenantId,
        clientId: this.CONFIG.clientId.substring(0, 10) + '...',
        redirectUri: this.CONFIG.redirectUri,
        scope: scopes,
        state: state.substring(0, 20) + '...'
      });

      return authUrl;
    } catch (error) {
      console.error('Error generating ANAF authorization URL:', error);
      throw new Error('Failed to generate authorization URL');
    }
  }

  /**
   * Test ANAF connectivity without authentication
   * 
   * @param name Test name
   * @returns Promise<ANAFAuthResult>
   */
  static async testConnectivity(name: string = 'ANAF Connectivity Test'): Promise<ANAFAuthResult> {
    try {
      const testUrl = `${this.ANAF_ENDPOINTS.testOauth}?name=${encodeURIComponent(name)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      // According to ANAF documentation, 401 Unauthorized is expected for TestOauth without authentication
      // This indicates the service is accessible and working correctly
      const isSuccess = response.ok || response.status === 401;
      
      if (isSuccess) {
        return {
          success: true,
          accessToken: 'test-connectivity-success',
          tokenType: 'test'
        };
      } else {
        return {
          success: false,
          error: `Connectivity test failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connectivity error'
      };
    }
  }

  /**
   * Test ANAF connectivity with authentication
   * 
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param name Test name
   * @returns Promise<ANAFAuthResult>
   */
  static async testAuthenticatedConnectivity(
    userId: number, 
    tenantId: number, 
    name: string = 'ANAF Authenticated Test'
  ): Promise<ANAFAuthResult> {
    try {
      // Get valid access token
      const tokenResult = await this.getAccessToken({ userId, tenantId });
      
      if (!tokenResult.success || !tokenResult.accessToken) {
        return {
          success: false,
          error: 'Failed to obtain access token for authenticated test'
        };
      }

      const testUrl = `${this.ANAF_ENDPOINTS.testOauth}?name=${encodeURIComponent(name)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenResult.accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      if (response.ok) {
        return {
          success: true,
          accessToken: 'authenticated-test-success',
          tokenType: 'test'
        };
      } else {
        return {
          success: false,
          error: `Authenticated test failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authenticated test error'
      };
    }
  }

  /**
   * Validate configuration
   */
  private static validateConfiguration(): void {
    if (!this.CONFIG.clientId) {
      throw new Error('ANAF_CLIENT_ID environment variable is not set');
    }
    
    if (!this.CONFIG.clientSecret) {
      throw new Error('ANAF_CLIENT_SECRET environment variable is not set');
    }
    
    if (!this.CONFIG.redirectUri) {
      throw new Error('ANAF_REDIRECT_URI environment variable is not set');
    }
  }

  /**
   * Get valid stored token from database
   */
  private static async getValidStoredToken(
    userId: number, 
    tenantId: number
  ): Promise<{ accessToken: string; tokenExpiresAt: Date } | null> {
    try {
      const credentials = await prisma.aNAFCredentials.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
      });

      if (!credentials || !credentials.accessToken || !credentials.isActive) {
        return null;
      }

      // Check if token is still valid (not expired)
      if (credentials.tokenExpiresAt && credentials.tokenExpiresAt > new Date()) {
        return {
          accessToken: credentials.accessToken,
          tokenExpiresAt: credentials.tokenExpiresAt
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Store token in database
   */
  private static async storeToken(
    userId: number, 
    tenantId: number, 
    tokenResult: ANAFAuthResult
  ): Promise<void> {
    try {
      if (!tokenResult.accessToken || !tokenResult.expiresAt) {
        return;
      }

      await prisma.aNAFCredentials.upsert({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
        update: {
          accessToken: tokenResult.accessToken,
          tokenExpiresAt: tokenResult.expiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          tenantId,
          accessToken: tokenResult.accessToken,
          tokenExpiresAt: tokenResult.expiresAt,
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Error storing token:', error);
      // Don't throw error here as token was obtained successfully
    }
  }

  /**
   * Parse error response from ANAF
   */
  private static parseErrorResponse(responseText: string): any {
    try {
      return JSON.parse(responseText);
    } catch {
      return { error: responseText };
    }
  }

  /**
   * Create OAuth error with proper handling
   */
  private static createOAuthError(status: number, errorData: any, attempt: number): Error {
    const errorCode = errorData.error || 'unknown_error';
    const errorDescription = errorData.error_description || errorData.error || 'Unknown error';
    
    // Handle specific ANAF error codes as per official documentation
    switch (errorCode) {
      case 'invalid_client':
        throw new Error('Invalid client credentials. Please check ANAF_CLIENT_ID and ANAF_CLIENT_SECRET.');
      
      case 'invalid_grant':
        throw new Error('Invalid authorization code or refresh token. The code may have expired or been used already.');
      
      case 'unauthorized_client':
        throw new Error('Client not authorized for this grant type.');
      
      case 'invalid_scope':
        throw new Error('Invalid scope requested. Please check the scope parameter.');
      
      case 'access_denied':
        throw new Error('Access denied by user or ANAF authorization server.');
      
      case 'unsupported_response_type':
        throw new Error('Unsupported response type. Only "code" is supported.');
      
      case 'server_error':
        throw new Error('ANAF server error. Please try again later.');
      
      case 'temporarily_unavailable':
        throw new Error('ANAF service temporarily unavailable. Please try again later.');
      
      default:
        if (status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        } else {
          throw new Error(`OAuth error (${status}): ${errorDescription}`);
        }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private static calculateRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.RETRY_CONFIG.baseDelay * Math.pow(this.RETRY_CONFIG.backoffMultiplier, attempt - 1),
      this.RETRY_CONFIG.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate secure state parameter for OAuth flow
   */
  private static generateState(userId: number, tenantId: number): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return Buffer.from(`${userId}:${tenantId}:${timestamp}:${random}`).toString('base64');
  }

  /**
   * Validate state parameter
   */
  static validateState(state: string): { userId: number; tenantId: number } | null {
    try {
      const decoded = Buffer.from(state, 'base64').toString();
      const parts = decoded.split(':');
      
      if (parts.length !== 4) {
        return null;
      }

      const [userId, tenantId, timestamp, random] = parts;
      
      // Check if state is not too old (1 hour)
      const stateAge = Date.now() - parseInt(timestamp);
      if (stateAge > 3600000) {
        return null;
      }

      return {
        userId: parseInt(userId),
        tenantId: parseInt(tenantId),
      };
    } catch (error) {
      console.error('Error validating state:', error);
      return null;
    }
  }

  /**
   * Revoke user access (logout)
   */
  static async revokeAccess(userId: number, tenantId: number): Promise<void> {
    try {
      await prisma.aNAFCredentials.update({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      throw new Error('Failed to revoke access');
    }
  }
}
