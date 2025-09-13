/** @format */

import { 
  InvoiceSubmissionProvider, 
  InvoiceSubmissionResult, 
  InvoiceStatusResult, 
  DownloadResult,
  TokenResult 
} from './interfaces';
import { 
  ANAFInvoiceData, 
  ANAFCompanyData, 
  ANAFCustomerData, 
  ANAFSubmissionStatus,
  ANAFRetryOptions 
} from './types';
import { ANAFOAuthService } from './oauth-service';
import { ANAFXMLGenerator } from './xml-generator';
import { ANAFSignatureService } from './signature-service';
import { InvoiceSystemService } from '../invoice-system';
import prisma from '../prisma';

export class ANAFIntegration implements InvoiceSubmissionProvider {
  private static readonly RETRY_OPTIONS: ANAFRetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  };

  /**
   * Submit invoice to ANAF e-Factura system
   */
  async submitInvoice(invoiceId: number, tenantId: number, options?: any): Promise<InvoiceSubmissionResult> {
    try {
      console.log(`Submitting invoice ${invoiceId} to ANAF for tenant ${tenantId}`);
      
      // Check if user is authenticated
      const isAuthenticated = await ANAFOAuthService.isAuthenticated(options?.userId, tenantId);
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'User not authenticated with ANAF. Please authenticate first.',
          timestamp: new Date().toISOString(),
        };
      }

      // Get invoice data
      const invoiceData = await this.getInvoiceData(invoiceId, tenantId);
      if (!invoiceData) {
        return {
          success: false,
          error: 'Invoice not found or invalid data',
          timestamp: new Date().toISOString(),
        };
      }

      // Generate XML
      const xmlContent = await this.generateXML(invoiceData, options);
      
      // Sign XML
      const signedXML = await ANAFSignatureService.signXML(xmlContent, options?.userId, tenantId);
      
      // Submit to ANAF
      const submissionResult = await this.submitToANAF(signedXML, options?.userId, tenantId);
      
      // Log submission
      await this.logSubmission(invoiceId, tenantId, submissionResult, signedXML, options?.submissionType || 'manual');
      
      return submissionResult;
    } catch (error) {
      console.error('Error submitting invoice to ANAF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get invoice status from ANAF
   */
  async getInvoiceStatus(submissionId: string, tenantId: number): Promise<InvoiceStatusResult> {
    try {
      console.log(`Getting status for submission ${submissionId} from ANAF`);
      
      // Get access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(0, tenantId); // Use system user
      
      // Query ANAF API
      const response = await fetch(`${process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest'}/api/v1/invoices/${submissionId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ANAF API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      // Update local status
      await this.updateSubmissionStatus(submissionId, data.status, data.message);
      
      return {
        submissionId,
        status: data.status,
        message: data.message,
        timestamp: new Date().toISOString(),
        responseData: data,
      };
    } catch (error) {
      console.error('Error getting invoice status from ANAF:', error);
      return {
        submissionId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Download response from ANAF
   */
  async downloadResponse(submissionId: string, tenantId: number): Promise<DownloadResult> {
    try {
      console.log(`Downloading response for submission ${submissionId} from ANAF`);
      
      // Get access token
      const accessToken = await ANAFOAuthService.getValidAccessToken(0, tenantId); // Use system user
      
      // Download from ANAF API
      const response = await fetch(`${process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest'}/api/v1/invoices/${submissionId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/xml',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`ANAF API error: ${errorData || response.statusText}`);
      }

      const content = await response.text();
      const filename = `anaf_response_${submissionId}.xml`;
      
      return {
        success: true,
        content,
        filename,
      };
    } catch (error) {
      console.error('Error downloading response from ANAF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get OAuth authorization URL
   */
  async getAuthUrl(userId: number, tenantId: number): Promise<string> {
    return ANAFOAuthService.getAuthUrl(userId, tenantId);
  }

  /**
   * Exchange authorization code for token
   */
  async exchangeCodeForToken(code: string, userId: number, tenantId: number): Promise<TokenResult> {
    try {
      const tokenData = await ANAFOAuthService.exchangeCodeForToken(code, userId, tenantId);
      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: number, tenantId: number): Promise<TokenResult> {
    try {
      const tokenData = await ANAFOAuthService.refreshToken(userId, tenantId);
      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(userId: number, tenantId: number): Promise<boolean> {
    return ANAFOAuthService.isAuthenticated(userId, tenantId);
  }

  /**
   * Generate XML for invoice
   */
  async generateXML(invoiceData: any, options?: any): Promise<string> {
    const xmlOptions = {
      invoiceData: {
        ...invoiceData.invoice,
        items: invoiceData.items
      },
      companyData: invoiceData.company,
      customerData: invoiceData.customer,
      language: options?.language || 'ro',
      includeSignature: options?.includeSignature !== false,
    };

    return ANAFXMLGenerator.generateXML(xmlOptions);
  }

  /**
   * Sign XML content
   */
  async signXML(xmlContent: string, userId: number, tenantId: number): Promise<string> {
    return ANAFSignatureService.signXML(xmlContent, userId, tenantId);
  }

  /**
   * Get invoice data for ANAF submission
   */
  private async getInvoiceData(invoiceId: number, tenantId: number): Promise<any> {
    try {
      // Get invoice tables
      const invoiceTables = await InvoiceSystemService.getInvoiceTables(tenantId, 0); // Use default database
      
      if (!invoiceTables.invoices || !invoiceTables.invoice_items) {
        throw new Error('Invoice system not initialized');
      }

      // Get invoice row
      const invoiceRow = await prisma.row.findFirst({
        where: {
          id: invoiceId,
          tableId: invoiceTables.invoices.id,
        },
        include: {
          cells: {
            include: {
              column: true,
            },
          },
        },
      });

      if (!invoiceRow) {
        throw new Error('Invoice not found');
      }

      // Get invoice items
      const invoiceItems = await prisma.row.findMany({
        where: {
          tableId: invoiceTables.invoice_items.id,
          cells: {
            some: {
              column: { name: 'invoice_id' },
              value: { equals: invoiceId },
            },
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

      // Get customer data
      const customerId = invoiceRow.cells.find((c:any) => c.column.name === 'customer_id')?.value;
      let customer = null;
      if (customerId && invoiceTables.customers) {
        customer = await prisma.row.findFirst({
          where: {
            id: parseInt(customerId),
            tableId: invoiceTables.customers.id,
          },
          include: {
            cells: {
              include: {
                column: true,
              },
            },
          },
        });
      }

      // Get company data
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      // Transform data
      const invoice = this.transformRowToObject(invoiceRow);
      const items = invoiceItems.map((item:any) => this.transformRowToObject(item));
      const customerData = customer ? this.transformRowToObject(customer) : null;
      const companyData = this.transformTenantToCompanyData(tenant);

      // Calculate totals
      const subtotal = invoice.subtotal || 0;
      const vatTotal = invoice.tax_amount || 0;
      const grandTotal = invoice.grand_total || invoice.total_amount || 0;

      return {
        invoice: {
          ...invoice,
          totals: {
            subtotal,
            vatTotal,
            grandTotal,
            currency: invoice.currency || 'RON'
          }
        },
        items,
        customer: customerData,
        company: companyData,
      };
    } catch (error) {
      console.error('Error getting invoice data:', error);
      throw error;
    }
  }

  /**
   * Submit XML to ANAF API
   */
  private async submitToANAF(xmlContent: string, userId: number, tenantId: number): Promise<InvoiceSubmissionResult> {
    try {
      const accessToken = await ANAFOAuthService.getValidAccessToken(userId, tenantId);
      
      const response = await fetch(`${process.env.ANAF_BASE_URL || 'https://api.anaf.ro/test/FCTEL/rest'}/api/v1/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/xml',
        },
        body: xmlContent,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`ANAF API error: ${errorData || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        submissionId: data.submissionId,
        message: data.message || 'Invoice submitted successfully',
        status: data.status || 'pending',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error submitting to ANAF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Log submission to database
   */
  private async logSubmission(
    invoiceId: number,
    tenantId: number,
    result: InvoiceSubmissionResult,
    xmlContent: string,
    submissionType: 'automatic' | 'manual'
  ): Promise<void> {
    try {
      await prisma.anafSubmissionLog.create({
        data: {
          invoiceId,
          tenantId,
          submissionId: result.submissionId,
          status: result.status || 'error',
          message: result.message,
          error: result.error,
          xmlContent: result.success ? xmlContent : undefined,
          submittedAt: new Date(),
          updatedAt: new Date(),
          retryCount: 0,
          submissionType,
        },
      });
    } catch (error) {
      console.error('Error logging submission:', error);
    }
  }

  /**
   * Update submission status
   */
  private async updateSubmissionStatus(
    submissionId: string,
    status: string,
    message?: string
  ): Promise<void> {
    try {
      await prisma.anafSubmissionLog.updateMany({
        where: { submissionId },
        data: {
          status: status as ANAFSubmissionStatus,
          message,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating submission status:', error);
    }
  }

  /**
   * Transform row data to object
   */
  private transformRowToObject(row: any): any {
    const obj: any = {};
    row.cells.forEach((cell: any) => {
      obj[cell.column.name] = cell.value;
    });
    return obj;
  }

  /**
   * Transform tenant data to company data
   */
  private transformTenantToCompanyData(tenant: any): ANAFCompanyData {
    return {
      taxId: tenant?.companyTaxId || '',
      name: tenant?.name || '',
      address: tenant?.address || '',
      city: tenant?.companyCity || '',
      country: tenant?.companyCountry || 'RO',
      postalCode: tenant?.companyPostalCode || '',
      registrationNumber: tenant?.registrationNumber,
      phone: tenant?.phone,
      email: tenant?.companyEmail,
    };
  }
}
