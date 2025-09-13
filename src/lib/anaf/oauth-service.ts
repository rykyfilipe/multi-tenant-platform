/** @format */

import { ANAFTokenResponse, ANAFConfiguration, ANAFUserCredentials, ANAFError } from './types';
import prisma from '../prisma';

export class ANAFOAuthService {
  private static readonly CONFIG: ANAFConfiguration = {
    clientId: process.env.ANAF_CLIENT_ID || '',
    clientSecret: process.env.ANAF_CLIENT_SECRET || '',
    redirectUri: process.env.ANAF_REDIRECT_URI || '',
    baseUrl: process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest',
    environment: (process.env.ANAF_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };

  /**
   * Generate OAuth authorization URL for ANAF
   */
  static async getAuthUrl(userId: number, tenantId: number): Promise<string> {
    try {
      const state = this.generateState(userId, tenantId);
      const scopes = 'e-factura';
      
      // Get redirect URI from environment or use default
      const redirectUri = process.env.ANAF_REDIRECT_URI || this.CONFIG.redirectUri;
      
      const params = new URLSearchParams({
        client_id: this.CONFIG.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        state: state,
      });

      return `${this.CONFIG.baseUrl}/oauth/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Error generating ANAF auth URL:', error);
      throw new Error('Failed to generate authorization URL');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    userId: number,
    tenantId: number
  ): Promise<ANAFTokenResponse> {
    try {
      // Get redirect URI from environment or use default
      const redirectUri = process.env.ANAF_REDIRECT_URI || this.CONFIG.redirectUri;
      
      const response = await fetch(`${this.CONFIG.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.CONFIG.clientId,
          client_secret: this.CONFIG.clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OAuth token exchange failed: ${errorData.error || response.statusText}`);
      }

      const tokenData: ANAFTokenResponse = await response.json();
      
      // Store tokens in database
      await this.storeUserCredentials(userId, tenantId, tokenData);
      
      return tokenData;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(userId: number, tenantId: number): Promise<ANAFTokenResponse> {
    try {
      const credentials = await this.getUserCredentials(userId, tenantId);
      
      if (!credentials?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.CONFIG.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.CONFIG.clientId,
          client_secret: this.CONFIG.clientSecret,
          refresh_token: credentials.refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
      }

      const tokenData: ANAFTokenResponse = await response.json();
      
      // Update stored tokens
      await this.updateUserCredentials(userId, tenantId, tokenData);
      
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

      // Check if token is expired
      if (credentials.tokenExpiresAt && credentials.tokenExpiresAt <= new Date()) {
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

      // Check if token is expired
      if (credentials.tokenExpiresAt && credentials.tokenExpiresAt <= new Date()) {
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
      
      await prisma.anafCredentials.upsert({
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
      
      await prisma.anafCredentials.update({
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
      const credentials = await prisma.anafCredentials.findUnique({
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
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        tokenExpiresAt: credentials.tokenExpiresAt,
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
   * Revoke user access (logout)
   */
  static async revokeAccess(userId: number, tenantId: number): Promise<void> {
    try {
      await prisma.anafCredentials.update({
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
