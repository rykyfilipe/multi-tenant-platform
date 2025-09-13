/** @format */

import jwt from 'jsonwebtoken';
import { ANAFTokenResponse, ANAFUserCredentials } from './types';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export class ANAFJWTTokenService {
  private static readonly JWT_SECRET = process.env.ANAF_JWT_SECRET || 'anaf-jwt-secret-key';
  private static readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  /**
   * Decode and validate JWT token from ANAF
   */
  static decodeToken(token: string): any {
    try {
      // ANAF tokens are typically not signed with our secret, so we decode without verification
      // In production, you should verify with ANAF's public key
      const decoded = jwt.decode(token, { complete: true });
      return decoded;
    } catch (error) {
      console.error('Error decoding ANAF JWT token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload || !decoded.payload.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiry = decoded.payload.exp;
      
      // Consider token expired if it expires within the refresh threshold
      return (expiry - now) < (this.TOKEN_REFRESH_THRESHOLD / 1000);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Get token expiry date
   */
  static getTokenExpiry(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload || !decoded.payload.exp) {
        return null;
      }

      return new Date(decoded.payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiry:', error);
      return null;
    }
  }

  /**
   * Validate token structure and content
   */
  static validateToken(token: string): { isValid: boolean; error?: string } {
    try {
      if (!token || typeof token !== 'string') {
        return { isValid: false, error: 'Token is not a valid string' };
      }

      const decoded = this.decodeToken(token);
      if (!decoded) {
        return { isValid: false, error: 'Token cannot be decoded' };
      }

      if (!decoded.payload) {
        return { isValid: false, error: 'Token payload is missing' };
      }

      // Check for required claims
      const requiredClaims = ['exp', 'iat'];
      for (const claim of requiredClaims) {
        if (!decoded.payload[claim]) {
          return { isValid: false, error: `Required claim '${claim}' is missing` };
        }
      }

      // Check if token is expired
      if (this.isTokenExpired(token)) {
        return { isValid: false, error: 'Token is expired or will expire soon' };
      }

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Extract user information from token
   */
  static extractUserInfo(token: string): { userId?: string; tenantId?: string; email?: string } {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload) {
        return {};
      }

      return {
        userId: decoded.payload.sub || decoded.payload.user_id,
        tenantId: decoded.payload.tenant_id,
        email: decoded.payload.email
      };
    } catch (error) {
      console.error('Error extracting user info from token:', error);
      return {};
    }
  }

  /**
   * Create a secure token for internal use
   */
  static createInternalToken(payload: any, expiresIn: string = '1h'): string {
    try {
      return jwt.sign(payload, this.JWT_SECRET as any, { 
        expiresIn: Number(expiresIn) || 3600,
        issuer: 'anaf-integration',
        audience: 'anaf-api'
      });
    } catch (error) {
      console.error('Error creating internal token:', error);
      throw new Error('Failed to create internal token');
    }
  }

  /**
   * Verify internal token
   */
  static verifyInternalToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'anaf-integration',
        audience: 'anaf-api'
      });
    } catch (error) {
      console.error('Error verifying internal token:', error);
      return null;
    }
  }

  /**
   * Store token with proper expiry calculation
   */
  static async storeTokenWithExpiry(
    userId: number,
    tenantId: number,
    tokenData: ANAFTokenResponse
  ): Promise<void> {
    try {
      if (!prisma) {
        console.error('Prisma client is not available');
        throw new Error('Database connection not available');
      }
      
      // Calculate expiry from token if available, otherwise use expires_in
      let expiresAt: Date;
      
      if (tokenData.access_token) {
        const tokenExpiry = this.getTokenExpiry(tokenData.access_token);
        if (tokenExpiry) {
          expiresAt = tokenExpiry;
        } else {
          // Fallback to expires_in
          expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        }
      } else {
        expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      }

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
      console.error('Error storing token with expiry:', error);
      throw new Error('Failed to store token with expiry');
    }
  }

  /**
   * Get token info for debugging
   */
  static getTokenInfo(token: string): {
    isValid: boolean;
    isExpired: boolean;
    expiry?: Date;
    userInfo?: any;
    error?: string;
  } {
    const validation = this.validateToken(token);
    const isExpired = this.isTokenExpired(token);
    const expiry = this.getTokenExpiry(token);
    const userInfo = this.extractUserInfo(token);

    return {
      isValid: validation.isValid,
      isExpired,
      expiry: expiry || new Date(),
      userInfo,
      error: validation.error
    };
  }

  /**
   * Clean up expired tokens from database
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      if (!prisma) {
        console.error('Prisma client is not available');
        return 0;
      }
      
      const result = await prisma.anafCredentials.updateMany({
        where: {
          tokenExpiresAt: {
            lt: new Date()
          },
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Get all active tokens for a user
   */
  static async getActiveTokens(userId: number, tenantId: number): Promise<ANAFUserCredentials[]> {
    try {
      if (!prisma) {
        console.error('Prisma client is not available');
        return [];
      }
      
      const credentials = await prisma.anafCredentials.findMany({
        where: {
          userId,
          tenantId,
          isActive: true,
          tokenExpiresAt: {
            gt: new Date()
          }
        }
      });

      return credentials.map((cred: any) => ({
        userId: cred.userId,
        tenantId: cred.tenantId,
        accessToken: cred.accessToken,
        refreshToken: cred.refreshToken,
        tokenExpiresAt: cred.tokenExpiresAt,
        isActive: cred.isActive
      }));
    } catch (error) {
      console.error('Error getting active tokens:', error);
      return [];
    }
  }

  /**
   * Revoke all tokens for a user
   */
  static async revokeAllTokens(userId: number, tenantId: number): Promise<void> {
    try {
      if (!prisma) {
        console.error('Prisma client is not available');
        return;
      }
      
      await prisma.anafCredentials.updateMany({
        where: {
          userId,
          tenantId,
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error revoking all tokens:', error);
      throw new Error('Failed to revoke all tokens');
    }
  }
}
