/** @format */

import { ANAFTokenResponse, ANAFConfiguration, ANAFUserCredentials, ANAFError } from './types';
import { ANAFJWTTokenService } from './jwt-token-service';
import { PrismaClient } from '@/generated/prisma';
const prisma = new PrismaClient();

export class ANAFOAuthService {
  private static readonly CONFIG: ANAFConfiguration = {
    clientId: process.env.ANAF_CLIENT_ID || '',
    clientSecret: process.env.ANAF_CLIENT_SECRET || '',
    redirectUri: process.env.ANAF_REDIRECT_URI || 'https://ydv.digital/api/anaf/callback',
    baseUrl: process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest',
    environment: (process.env.ANAF_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };

  // ANAF OAuth endpoints as per official documentation
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

  /**
   * Generate OAuth authorization URL for ANAF
   * Conform documentației ANAF: Oauth procedura inregistrare aplicatii portal ANAF
   */
  static async getAuthUrl(userId: number, tenantId: number): Promise<string> {
    try {
      const state = this.generateState(userId, tenantId);
      const scopes = 'e-factura'; // Conform documentației ANAF
      
      // Get redirect URI from environment or use default
      const redirectUri = process.env.ANAF_REDIRECT_URI || this.CONFIG.redirectUri;
      
      const params = new URLSearchParams({
        client_id: this.CONFIG.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        state: state
      });

      const authUrl = `${this.ANAF_ENDPOINTS.authorization}?${params.toString()}`;
      
      console.log('ANAF OAuth Authorization URL generated:', {
        userId,
        tenantId,
        clientId: this.CONFIG.clientId,
        redirectUri,
        scope: scopes,
        state: state.substring(0, 20) + '...',
        authUrl: authUrl.substring(0, 100) + '...'
      });

      return authUrl;
    } catch (error) {
      console.error('Error generating ANAF auth URL:', error);
      throw new Error('Failed to generate authorization URL');
    }
  }

  /**
   * Exchange authorization code for access token
   * Conform documentației ANAF: folosește Basic Auth pentru client credentials
   */
  static async exchangeCodeForToken(
    code: string,
    userId: number,
    tenantId: number
  ): Promise<ANAFTokenResponse> {
    try {
      // Get redirect URI from environment or use default
      const redirectUri = process.env.ANAF_REDIRECT_URI || this.CONFIG.redirectUri;
      
      // Create Basic Auth header conform documentației ANAF
      const basicAuth = Buffer.from(`${this.CONFIG.clientId}:${this.CONFIG.clientSecret}`).toString('base64');
      
      const requestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      });

      console.log('ANAF OAuth Token Exchange Request:', {
        userId,
        tenantId,
        endpoint: this.ANAF_ENDPOINTS.token,
        grantType: 'authorization_code',
        redirectUri,
        code: code.substring(0, 10) + '...',
        hasBasicAuth: !!basicAuth
      });

      // Use correct ANAF OAuth token endpoint as per documentation
      const response = await fetch(this.ANAF_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}` // Conform documentației ANAF
        },
        body: requestBody
      });

      const responseText = await response.text();
      console.log('ANAF OAuth Token Exchange Response:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        console.error('ANAF OAuth token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Handle specific ANAF error codes as per official documentation
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        } else if (errorData.error === 'invalid_client') {
          throw new Error('Invalid client credentials. Please check ANAF_CLIENT_ID and ANAF_CLIENT_SECRET.');
        } else if (errorData.error === 'invalid_grant') {
          throw new Error('Invalid authorization code. The code may have expired or been used already.');
        } else if (errorData.error === 'unauthorized_client') {
          throw new Error('Client not authorized for this grant type.');
        } else if (errorData.error === 'invalid_scope') {
          throw new Error('Invalid scope requested. Please check the scope parameter.');
        } else if (errorData.error === 'access_denied') {
          throw new Error('Access denied by user or ANAF authorization server.');
        } else if (errorData.error === 'unsupported_response_type') {
          throw new Error('Unsupported response type. Only "code" is supported.');
        } else if (errorData.error === 'server_error') {
          throw new Error('ANAF server error. Please try again later.');
        } else if (errorData.error === 'temporarily_unavailable') {
          throw new Error('ANAF service temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`OAuth token exchange failed: ${errorData.error || response.statusText}`);
      }

      const tokenData: ANAFTokenResponse = JSON.parse(responseText);
      
      // Validate token response
      if (!tokenData.access_token) {
        throw new Error('Invalid token response from ANAF: missing access_token');
      }
      
      console.log('ANAF OAuth Token Exchange Success:', {
        userId,
        tenantId,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });
      
      // Store tokens in database with proper JWT handling
      await ANAFJWTTokenService.storeTokenWithExpiry(userId, tenantId, tokenData);
      
      return tokenData;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Refresh access token using refresh token
   * Conform documentației ANAF: folosește Basic Auth pentru client credentials
   */
  static async refreshToken(userId: number, tenantId: number): Promise<ANAFTokenResponse> {
    try {
      const credentials = await this.getUserCredentials(userId, tenantId);
      
      if (!credentials?.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Create Basic Auth header conform documentației ANAF
      const basicAuth = Buffer.from(`${this.CONFIG.clientId}:${this.CONFIG.clientSecret}`).toString('base64');
      
      const requestBody = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refreshToken
      });

      console.log('ANAF OAuth Token Refresh Request:', {
        userId,
        tenantId,
        endpoint: this.ANAF_ENDPOINTS.token,
        grantType: 'refresh_token',
        hasRefreshToken: !!credentials.refreshToken,
        hasBasicAuth: !!basicAuth
      });

      // Use correct ANAF OAuth token endpoint as per documentation
      const response = await fetch(this.ANAF_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}` // Conform documentației ANAF
        },
        body: requestBody
      });

      const responseText = await response.text();
      console.log('ANAF OAuth Token Refresh Response:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        
        console.error('ANAF token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Handle specific ANAF error codes as per official documentation
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        } else if (errorData.error === 'invalid_client') {
          throw new Error('Invalid client credentials. Please check ANAF_CLIENT_ID and ANAF_CLIENT_SECRET.');
        } else if (errorData.error === 'invalid_grant') {
          throw new Error('Invalid refresh token. The token may have expired or been revoked.');
        } else if (errorData.error === 'unauthorized_client') {
          throw new Error('Client not authorized for this grant type.');
        } else if (errorData.error === 'invalid_scope') {
          throw new Error('Invalid scope requested. Please check the scope parameter.');
        } else if (errorData.error === 'access_denied') {
          throw new Error('Access denied by user or ANAF authorization server.');
        } else if (errorData.error === 'unsupported_response_type') {
          throw new Error('Unsupported response type. Only "code" is supported.');
        } else if (errorData.error === 'server_error') {
          throw new Error('ANAF server error. Please try again later.');
        } else if (errorData.error === 'temporarily_unavailable') {
          throw new Error('ANAF service temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
      }

      const tokenData: ANAFTokenResponse = JSON.parse(responseText);
      
      // Validate token response
      if (!tokenData.access_token) {
        throw new Error('Invalid refresh token response from ANAF: missing access_token');
      }
      
      console.log('ANAF OAuth Token Refresh Success:', {
        userId,
        tenantId,
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });
      
      // Update stored tokens with proper JWT handling
      await ANAFJWTTokenService.storeTokenWithExpiry(userId, tenantId, tokenData);
      
      return tokenData;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Check if user is authenticated and token is valid
   */
  static async isAuthenticated(userId: number, tenantId: number): Promise<boolean> {
    try {
      const credentials = await this.getUserCredentials(userId, tenantId);
      
      if (!credentials?.accessToken) {
        return false;
      }

      // Check if token is expired using JWT validation
      if (credentials.accessToken && ANAFJWTTokenService.isTokenExpired(credentials.accessToken)) {
        // Try to refresh token
        try {
          await this.refreshToken(userId, tenantId);
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  static async getValidAccessToken(userId: number, tenantId: number): Promise<string> {
    try {
      const credentials = await this.getUserCredentials(userId, tenantId);
      
      if (!credentials?.accessToken) {
        throw new Error('No access token available. Please authenticate first.');
      }

      // Check if token is expired using JWT validation
      if (credentials.accessToken && ANAFJWTTokenService.isTokenExpired(credentials.accessToken)) {
        const refreshedToken = await this.refreshToken(userId, tenantId);
        return refreshedToken.access_token;
      }

      return credentials.accessToken;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw new Error('Failed to get valid access token');
    }
  }

  /**
   * Store user credentials in database
   */
  private static async storeUserCredentials(
    userId: number,
    tenantId: number,
    tokenData: ANAFTokenResponse
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      await prisma.aNAFCredentials.upsert({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          tenantId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Error storing user credentials:', error);
      throw new Error('Failed to store user credentials');
    }
  }

  /**
   * Update user credentials in database
   */
  private static async updateUserCredentials(
    userId: number,
    tenantId: number,
    tokenData: ANAFTokenResponse
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      
      await prisma.aNAFCredentials.update({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating user credentials:', error);
      throw new Error('Failed to update user credentials');
    }
  }

  /**
   * Get user credentials from database
   */
  private static async getUserCredentials(
    userId: number,
    tenantId: number
  ): Promise<ANAFUserCredentials | null> {
    try {
      if (!prisma) {
        console.error('Prisma client is not available');
        return null;
      }
      
      // Check if aNAFCredentials model exists
      if (!prisma.aNAFCredentials) {
        console.error('aNAFCredentials model is not available in Prisma client');
        return null;
      }
      
      const credentials = await prisma.aNAFCredentials.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
      });

      if (!credentials) {
        return null;
      }

      return {
        userId: credentials.userId,
        tenantId: credentials.tenantId,
        accessToken: credentials.accessToken || undefined,
        refreshToken: credentials.refreshToken || undefined,
        tokenExpiresAt: credentials.tokenExpiresAt || undefined,
        isActive: credentials.isActive,
      };
    } catch (error) {
      console.error('Error getting user credentials:', error);
      return null;
    }
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
   * Test ANAF sandbox connectivity using TestOauth service
   * This endpoint doesn't require authentication as per ANAF documentation
   */
  static async testSandboxConnectivity(): Promise<{
    success: boolean;
    status: number;
    statusText: string;
    response: string;
    timestamp: string;
  }> {
    try {
      const testUrl = `${this.ANAF_ENDPOINTS.testOauth}?name=Test%20Connectivity`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      const responseData = await response.text();
      
      // According to ANAF documentation, 401 Unauthorized is expected for TestOauth without authentication
      // This indicates the service is accessible and working correctly
      const isSuccess = response.ok || response.status === 401;
      
      return {
        success: isSuccess,
        status: response.status,
        statusText: response.statusText,
        response: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error testing ANAF sandbox connectivity:', error);
      return {
        success: false,
        status: 0,
        statusText: 'Network Error',
        response: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
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
