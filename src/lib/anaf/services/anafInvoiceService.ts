/**
 * ANAF Invoice Service
 * 
 * Handles invoice submission to ANAF e-Factura API
 * 
 * Endpoints:
 * - POST /test/v1/factura/upload - Upload invoice XML
 * - GET /test/v1/factura/status/{requestId} - Check status
 * - GET /test/v1/factura/download/{requestId} - Download validated invoice
 * 
 * All requests use Bearer token authentication (NOT mTLS)
 * mTLS is only for OAuth2 endpoints (logincert.anaf.ro)
 * 
 * @author MultiTenantPlatform
 * @version 2.0.0 - Professional ANAF Integration
 */

import https from 'https';
import prisma from '@/lib/prisma';
import { ANAFAuthService } from './anafAuthService';
import { ANAFXMLGenerator } from '../xml-generator';
import { ANAFSignatureService } from '../signature-service';

export interface ANAFInvoiceUploadResult {
  success: boolean;
  requestId?: string;
  message?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

export interface ANAFInvoiceStatusResult {
  success: boolean;
  requestId: string;
  status: string;
  message?: string;
  messages?: string[];
  xmlDownloadLink?: string;
  error?: string;
  timestamp: string;
}

export interface ANAFInvoiceDownloadResult {
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}

export class ANAFInvoiceService {
  // ANAF e-Factura API base URLs
  private static readonly TEST_BASE_URL = 'https://api.anaf.ro/test/v1/factura';
  private static readonly PROD_BASE_URL = 'https://api.anaf.ro/prod/v1/factura';

  // Get base URL based on environment
  private static getBaseUrl(): string {
    const environment = process.env.ANAF_ENVIRONMENT || 'sandbox';
    return environment === 'production' ? this.PROD_BASE_URL : this.TEST_BASE_URL;
  }

  /**
   * Upload invoice to ANAF e-Factura
   * 
   * @param invoiceId Internal invoice ID
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Upload result with requestId
   */
  static async uploadInvoice(
    invoiceId: number,
    userId: number,
    tenantId: number
  ): Promise<ANAFInvoiceUploadResult> {
    try {
      console.log('[ANAF Invoice] Starting upload:', { invoiceId, userId, tenantId });

      // Get valid access token
      const accessToken = await ANAFAuthService.getValidAccessToken(userId, tenantId);

      // Get invoice data (implement this based on your data model)
      const invoiceData = await this.getInvoiceData(invoiceId, tenantId);
      
      if (!invoiceData) {
        return {
          success: false,
          error: 'Invoice not found or invalid data',
          timestamp: new Date().toISOString(),
        };
      }

      // Generate XML (UBL 2.1 format)
      const xmlContent = await ANAFXMLGenerator.generateXML({
        invoiceData: invoiceData.invoice,
        companyData: invoiceData.company,
        customerData: invoiceData.customer,
        language: 'ro',
      });

      // Sign XML with digital signature
      const signedXML = await ANAFSignatureService.signXML(xmlContent, userId, tenantId);

      // Upload to ANAF
      const uploadUrl = `${this.getBaseUrl()}/upload`;
      
      const responseData = await this.makeAPIRequest<{
        requestId: string;
        status: string;
        message?: string;
      }>(
        uploadUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/xml; charset=utf-8',
            'Accept': 'application/json',
          },
          body: signedXML,
        }
      );

      // Log submission to database
      await this.logSubmission(
        invoiceId,
        tenantId,
        responseData.requestId,
        responseData.status || 'RECEIVED',
        signedXML
      );

      console.log('[ANAF Invoice] Upload successful:', { 
        invoiceId, 
        requestId: responseData.requestId 
      });

      return {
        success: true,
        requestId: responseData.requestId,
        status: responseData.status || 'RECEIVED',
        message: responseData.message || 'Invoice submitted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[ANAF Invoice] Upload failed:', error);
      
      // Log failed submission
      await this.logSubmission(
        invoiceId,
        tenantId,
        null,
        'ERROR',
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check invoice status on ANAF
   * 
   * @param requestId ANAF request ID
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Status result
   */
  static async checkInvoiceStatus(
    requestId: string,
    userId: number,
    tenantId: number
  ): Promise<ANAFInvoiceStatusResult> {
    try {
      console.log('[ANAF Invoice] Checking status:', { requestId, userId, tenantId });

      // Get valid access token
      const accessToken = await ANAFAuthService.getValidAccessToken(userId, tenantId);

      // Check status on ANAF
      const statusUrl = `${this.getBaseUrl()}/status/${requestId}`;
      
      const responseData = await this.makeAPIRequest<{
        status: string;
        message?: string;
        messages?: string[];
        xml_download_link?: string;
      }>(
        statusUrl,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      // Update local status
      await this.updateSubmissionStatus(
        requestId,
        responseData.status,
        responseData.message || responseData.messages?.join('; ')
      );

      console.log('[ANAF Invoice] Status check successful:', { 
        requestId, 
        status: responseData.status 
      });

      return {
        success: true,
        requestId,
        status: responseData.status,
        message: responseData.message,
        messages: responseData.messages,
        xmlDownloadLink: responseData.xml_download_link,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[ANAF Invoice] Status check failed:', error);

      return {
        success: false,
        requestId,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Status check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Download validated invoice from ANAF
   * 
   * @param requestId ANAF request ID
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Download result with XML content
   */
  static async downloadInvoice(
    requestId: string,
    userId: number,
    tenantId: number
  ): Promise<ANAFInvoiceDownloadResult> {
    try {
      console.log('[ANAF Invoice] Starting download:', { requestId, userId, tenantId });

      // Get valid access token
      const accessToken = await ANAFAuthService.getValidAccessToken(userId, tenantId);

      // Download from ANAF
      const downloadUrl = `${this.getBaseUrl()}/download/${requestId}`;
      
      const xmlContent = await this.makeAPIRequest<string>(
        downloadUrl,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/xml',
          },
        },
        'text' // Response format
      );

      const filename = `anaf_${requestId}.xml`;

      console.log('[ANAF Invoice] Download successful:', { requestId, filename });

      return {
        success: true,
        content: xmlContent,
        filename,
      };
    } catch (error) {
      console.error('[ANAF Invoice] Download failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Make HTTPS API request to ANAF
   * Uses Bearer token authentication (NOT mTLS)
   * 
   * @param url Request URL
   * @param options Request options
   * @param responseFormat Response format ('json' or 'text')
   * @returns Response data
   */
  private static async makeAPIRequest<T>(
    url: string,
    options: {
      method: string;
      headers: Record<string, string>;
      body?: string;
    },
    responseFormat: 'json' | 'text' = 'json'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);

      const requestOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers,
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // Handle different HTTP status codes
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              if (responseFormat === 'json') {
                const jsonData = JSON.parse(data);
                resolve(jsonData as T);
              } else {
                resolve(data as T);
              }
            } catch (error) {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          } else if (res.statusCode === 403) {
            reject(new Error('403 Forbidden - Request neautorizat sau limită de apeluri depășită'));
          } else if (res.statusCode === 429) {
            reject(new Error('429 Too Many Requests - Limită maximă de 1000 apeluri pe minut depășită'));
          } else if (res.statusCode === 401) {
            reject(new Error('401 Unauthorized - Token invalid sau expirat'));
          } else if (res.statusCode === 404) {
            reject(new Error('404 Not Found - Resursa nu a fost găsită'));
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
   * Get invoice data from database
   * 
   * @param invoiceId Invoice ID
   * @param tenantId Tenant ID
   * @returns Invoice data
   */
  private static async getInvoiceData(
    invoiceId: number,
    tenantId: number
  ): Promise<{
    invoice: any;
    company: any;
    customer: any;
  } | null> {
    try {
      // Get invoice
      const invoice = await prisma.row.findFirst({
        where: {
          id: invoiceId,
          table: {
            tenantId,
            name: 'invoices',
          },
        },
        include: {
          cells: {
            include: {
              column: true,
            },
          },
        },
      });

      if (!invoice) {
        return null;
      }

      // Transform row data to object
      const invoiceObj: any = {};
      invoice.cells.forEach((cell: any) => {
        invoiceObj[cell.column.name] = cell.value;
      });

      // Get customer
      const customerId = invoiceObj.customer_id;
      let customer = null;
      
      if (customerId) {
        const customerRow = await prisma.row.findFirst({
          where: {
            id: Array.isArray(customerId) ? customerId[0] : customerId,
            table: {
              tenantId,
              name: 'customers',
            },
          },
          include: {
            cells: {
              include: {
                column: true,
              },
            },
          },
        });

        if (customerRow) {
          customer = {};
          customerRow.cells.forEach((cell: any) => {
            customer[cell.column.name] = cell.value;
          });
        }
      }

      // Get company (tenant) data
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      const company = {
        taxId: tenant?.companyTaxId || '',
        name: tenant?.name || '',
        address: tenant?.address || '',
        city: tenant?.companyCity || '',
        country: tenant?.companyCountry || 'RO',
        postalCode: tenant?.companyPostalCode || '',
        registrationNumber: tenant?.registrationNumber || '',
        phone: tenant?.phone || '',
        email: tenant?.companyEmail || '',
      };

      return {
        invoice: invoiceObj,
        company,
        customer,
      };
    } catch (error) {
      console.error('[ANAF Invoice] Error getting invoice data:', error);
      return null;
    }
  }

  /**
   * Log submission to database
   * 
   * @param invoiceId Invoice ID
   * @param tenantId Tenant ID
   * @param requestId ANAF request ID
   * @param status Submission status
   * @param xmlContent XML content
   * @param errorMessage Error message (if any)
   */
  private static async logSubmission(
    invoiceId: number,
    tenantId: number,
    requestId: string | null,
    status: string,
    xmlContent: string | null,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.aNAFSubmission.create({
        data: {
          tenantId,
          invoiceId,
          requestId: requestId || undefined,
          status,
          message: errorMessage || 'Factura a fost trimisă către ANAF',
          error: errorMessage || undefined,
          xmlContent: xmlContent || undefined,
          submittedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[ANAF Invoice] Error logging submission:', error);
      // Don't throw - logging failure shouldn't stop the operation
    }
  }

  /**
   * Update submission status in database
   * 
   * @param requestId ANAF request ID
   * @param status New status
   * @param message Status message
   */
  private static async updateSubmissionStatus(
    requestId: string,
    status: string,
    message?: string
  ): Promise<void> {
    try {
      await prisma.aNAFSubmission.updateMany({
        where: { requestId },
        data: {
          status,
          message: message || undefined,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[ANAF Invoice] Error updating status:', error);
      // Don't throw - logging failure shouldn't stop the operation
    }
  }
}
