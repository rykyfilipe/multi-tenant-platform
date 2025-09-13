/** @format */

import { ANAFOAuthService } from './oauth-service';
import { ANAFRateLimiter } from './rate-limiter';
import { ANAFTokenResponse, ANAFError } from './types';

/**
 * ANAF API Service
 * Implements all ANAF API services as per official documentation:
 * - TestOauth service
 * - e-Factura API (test and production)
 * - e-Transport API (test and production)
 */

export class ANAFAPIService {
  private static readonly ANAF_ENDPOINTS = {
    // Test services
    testOauth: 'https://api.anaf.ro/TestOauth/jaxrs/hello',
    
    // e-Factura API endpoints
    eFacturaTest: 'https://api.anaf.ro/test/FCTEL/rest',
    eFacturaProd: 'https://api.anaf.ro/prod/FCTEL/rest',
    
    // e-Transport API endpoints
    eTransportTest: 'https://api.anaf.ro/test/ETRANSPORT/ws/v1',
    eTransportProd: 'https://api.anaf.ro/prod/ETRANSPORT/ws/v1'
  };

  /**
   * Test ANAF connectivity using TestOauth service
   * This service doesn't require authentication as per ANAF documentation
   */
  static async testConnectivity(name: string = 'Test Connectivity'): Promise<{
    success: boolean;
    status: number;
    statusText: string;
    response: any;
    timestamp: string;
  }> {
    try {
      const testUrl = `${this.ANAF_ENDPOINTS.testOauth}?name=${encodeURIComponent(name)}`;
      
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
      console.error('Error testing ANAF connectivity:', error);
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
   * Test ANAF connectivity with authentication
   * Uses valid access token to test authenticated endpoints
   */
  static async testAuthenticatedConnectivity(
    userId: number,
    tenantId: number,
    name: string = 'Test Authenticated Connectivity'
  ): Promise<{
    success: boolean;
    status: number;
    statusText: string;
    response: any;
    timestamp: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = ANAFRateLimiter.checkRateLimit(`user_${userId}_${tenantId}`);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Get valid access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const testUrl = `${this.ANAF_ENDPOINTS.testOauth}?name=${encodeURIComponent(name)}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      const responseData = await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error testing authenticated ANAF connectivity:', error);
      return {
        success: false,
        status: 0,
        statusText: 'Error',
        response: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Submit invoice to e-Factura API
   */
  static async submitInvoice(
    userId: number,
    tenantId: number,
    invoiceData: any,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    success: boolean;
    submissionId?: string;
    message?: string;
    error?: string;
    status?: number;
    response?: any;
    timestamp: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = ANAFRateLimiter.checkRateLimit(`user_${userId}_${tenantId}`);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Get valid access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const baseUrl = environment === 'production' 
        ? this.ANAF_ENDPOINTS.eFacturaProd 
        : this.ANAF_ENDPOINTS.eFacturaTest;
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        },
        body: invoiceData
      });

      const responseData = await response.text();
      
      if (!response.ok) {
        // Handle ANAF error codes
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        }
        
        throw new Error(`e-Factura API error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        submissionId: this.extractSubmissionId(responseData),
        message: 'Invoice submitted successfully',
        status: response.status,
        response: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error submitting invoice to e-Factura:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Upload document to e-Transport API
   */
  static async uploadToETransport(
    userId: number,
    tenantId: number,
    documentData: any,
    cif: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    success: boolean;
    uploadId?: string;
    message?: string;
    error?: string;
    status?: number;
    response?: any;
    timestamp: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = ANAFRateLimiter.checkRateLimit(`user_${userId}_${tenantId}`);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Get valid access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const baseUrl = environment === 'production' 
        ? this.ANAF_ENDPOINTS.eTransportProd 
        : this.ANAF_ENDPOINTS.eTransportTest;
      
      const uploadUrl = `${baseUrl}/upload/ETRANSPORT/${cif}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        },
        body: documentData
      });

      const responseData = await response.text();
      
      if (!response.ok) {
        // Handle ANAF error codes
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        }
        
        throw new Error(`e-Transport API error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        uploadId: this.extractUploadId(responseData),
        message: 'Document uploaded successfully',
        status: response.status,
        response: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading to e-Transport:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check message status in e-Transport API
   */
  static async checkETransportStatus(
    userId: number,
    tenantId: number,
    uploadId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    success: boolean;
    status?: string;
    message?: string;
    error?: string;
    statusCode?: number;
    response?: any;
    timestamp: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = ANAFRateLimiter.checkRateLimit(`user_${userId}_${tenantId}`);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Get valid access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const baseUrl = environment === 'production' 
        ? this.ANAF_ENDPOINTS.eTransportProd 
        : this.ANAF_ENDPOINTS.eTransportTest;
      
      const statusUrl = `${baseUrl}/stareMesaj/${uploadId}`;
      
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      const responseData = await response.text();
      
      if (!response.ok) {
        // Handle ANAF error codes
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        }
        
        throw new Error(`e-Transport status check error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        status: this.extractStatus(responseData),
        message: 'Status retrieved successfully',
        statusCode: response.status,
        response: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking e-Transport status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get document list from e-Transport API
   */
  static async getETransportList(
    userId: number,
    tenantId: number,
    days: number = 7,
    cif: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    success: boolean;
    documents?: any[];
    message?: string;
    error?: string;
    statusCode?: number;
    response?: any;
    timestamp: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = ANAFRateLimiter.checkRateLimit(`user_${userId}_${tenantId}`);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Validate days parameter (1-60 as per ANAF documentation)
      if (days < 1 || days > 60) {
        throw new Error('Days parameter must be between 1 and 60');
      }

      // Get valid access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const baseUrl = environment === 'production' 
        ? this.ANAF_ENDPOINTS.eTransportProd 
        : this.ANAF_ENDPOINTS.eTransportTest;
      
      const listUrl = `${baseUrl}/lista/${days}/${cif}`;
      
      const response = await fetch(listUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      const responseData = await response.text();
      
      if (!response.ok) {
        // Handle ANAF error codes
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        }
        
        throw new Error(`e-Transport list error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        documents: this.parseDocumentList(responseData),
        message: 'Document list retrieved successfully',
        statusCode: response.status,
        response: responseData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting e-Transport list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Download document from e-Transport API
   */
  static async downloadETransportDocument(
    userId: number,
    tenantId: number,
    documentId: string,
    environment: 'test' | 'production' = 'test'
  ): Promise<{
    success: boolean;
    content?: string;
    filename?: string;
    message?: string;
    error?: string;
    statusCode?: number;
    timestamp: string;
  }> {
    try {
      // Check rate limit
      const rateLimitCheck = ANAFRateLimiter.checkRateLimit(`user_${userId}_${tenantId}`);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      // Get valid access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const baseUrl = environment === 'production' 
        ? this.ANAF_ENDPOINTS.eTransportProd 
        : this.ANAF_ENDPOINTS.eTransportTest;
      
      const downloadUrl = `${baseUrl}/descarcare/${documentId}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'MultiTenantPlatform/1.0'
        }
      });

      if (!response.ok) {
        // Handle ANAF error codes
        if (response.status === 403) {
          throw new Error('403 Forbidden - Request neautorizat la URL-urile aferente serviciului web de factură');
        } else if (response.status === 429) {
          throw new Error('429 Too Many Requests - Limita maximă de apeluri depășită (1000 apeluri pe minut)');
        }
        
        throw new Error(`e-Transport download error: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      const filename = this.extractFilename(response.headers.get('content-disposition'));

      return {
        success: true,
        content,
        filename,
        message: 'Document downloaded successfully',
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error downloading e-Transport document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper methods for parsing responses
  private static extractSubmissionId(responseData: string): string | undefined {
    // Parse XML response to extract submission ID
    // This is a simplified implementation - adjust based on actual ANAF response format
    const match = responseData.match(/<submissionId>([^<]+)<\/submissionId>/i);
    return match ? match[1] : undefined;
  }

  private static extractUploadId(responseData: string): string | undefined {
    // Parse XML response to extract upload ID
    const match = responseData.match(/<uploadId>([^<]+)<\/uploadId>/i);
    return match ? match[1] : undefined;
  }

  private static extractStatus(responseData: string): string | undefined {
    // Parse XML response to extract status
    const match = responseData.match(/<status>([^<]+)<\/status>/i);
    return match ? match[1] : undefined;
  }

  private static parseDocumentList(responseData: string): any[] {
    // Parse XML response to extract document list
    // This is a simplified implementation - adjust based on actual ANAF response format
    const documents: any[] = [];
    const docMatches = responseData.match(/<document>([\s\S]*?)<\/document>/gi);
    
    if (docMatches) {
      docMatches.forEach(doc => {
        const idMatch = doc.match(/<id>([^<]+)<\/id>/i);
        const nameMatch = doc.match(/<name>([^<]+)<\/name>/i);
        const dateMatch = doc.match(/<date>([^<]+)<\/date>/i);
        
        documents.push({
          id: idMatch ? idMatch[1] : undefined,
          name: nameMatch ? nameMatch[1] : undefined,
          date: dateMatch ? dateMatch[1] : undefined
        });
      });
    }
    
    return documents;
  }

  private static extractFilename(contentDisposition: string | null): string | undefined {
    if (!contentDisposition) return undefined;
    
    const match = contentDisposition.match(/filename="([^"]+)"/i);
    return match ? match[1] : undefined;
  }
}
