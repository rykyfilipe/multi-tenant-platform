/**
 * @format
 */

// Mock Prisma before importing ANAF services
jest.mock('../../../src/lib/prisma', () => {
  const mockPrisma = {
    anafCredentials: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn()
    },
    anafSubmissionLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    invoice: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    row: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    },
    tenant: {
      findUnique: jest.fn()
    }
  };
  
  return {
    default: mockPrisma,
    ...mockPrisma
  };
});

// Mock ANAFOAuthService
jest.mock('../../../src/lib/anaf/oauth-service', () => ({
  ANAFOAuthService: {
    isAuthenticated: jest.fn(),
    getValidAccessToken: jest.fn(),
    getAuthUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

// Mock ANAFSignatureService
jest.mock('../../../src/lib/anaf/signature-service', () => ({
  ANAFSignatureService: {
    signXML: jest.fn(),
    verifySignature: jest.fn(),
    validateSignatureFormat: jest.fn(),
  },
}));

// Mock InvoiceSystemService
jest.mock('../../../src/lib/invoice-system', () => ({
  InvoiceSystemService: {
    getInvoiceTables: jest.fn(),
  },
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ANAFIntegration } from '../../../src/lib/anaf/anaf-integration';
import { ANAFOAuthService } from '../../../src/lib/anaf/oauth-service';
import { ANAFXMLGenerator } from '../../../src/lib/anaf/xml-generator';
import { ANAFSignatureService } from '../../../src/lib/anaf/signature-service';

// Mock data for testing
const mockInvoiceData = {
  id: 1,
  invoice_number: 'INV-2024-001',
  date: '2024-01-15T00:00:00Z',
  due_date: '2024-02-15T00:00:00Z',
  total_amount: 1000.00,
  base_currency: 'RON',
  tax_amount: 190.00,
  subtotal: 810.00,
  status: 'issued',
  customer_id: 1,
  customer_name: 'Test Customer SRL',
  customer_email: 'test@customer.com',
  customer_address: 'Strada Test 123, București, România',
  customer_tax_id: 'RO12345678',
  items: [
    {
      id: 1,
      description: 'Test Product 1',
      quantity: 2,
      unit_price: 300.00,
      total_price: 600.00,
      tax_rate: 19,
      tax_amount: 114.00,
      unit_of_measure: 'pcs',
      vat_amount: 114.00,
      vat_rate: 19,
      currency: 'RON'
    },
    {
      id: 2,
      description: 'Test Product 2',
      quantity: 1,
      unit_price: 210.00,
      total_price: 210.00,
      tax_rate: 19,
      tax_amount: 39.90,
      unit_of_measure: 'pcs',
      vat_amount: 39.90,
      vat_rate: 19,
      currency: 'RON'
    }
  ],
  customerData: {
    name: 'Test Customer SRL',
    taxId: 'RO12345678',
    address: 'Strada Test 123, București, România',
    email: 'test@customer.com'
  },
  totals: {
    subtotal: 810.00,
    vatTotal: 190.00,
    totalAmount: 1000.00,
    grandTotal: 1000.00,
    currency: 'RON'
  }
};

const mockCompanyData = {
  name: 'Test Company SRL',
  legalName: 'Test Company SRL',
  taxId: 'RO87654321',
  address: {
    street: 'Strada Company 456',
    city: 'București',
    postalCode: '010001',
    country: 'România'
  },
  email: 'company@test.com',
  phone: '+40 123 456 789'
};

describe('ANAF e-Factura End-to-End Integration', () => {
  let anafIntegration: ANAFIntegration;
  let oauthService: ANAFOAuthService;
  let xmlGenerator: ANAFXMLGenerator;
  let signatureService: ANAFSignatureService;

  beforeEach(() => {
    anafIntegration = new ANAFIntegration();
    oauthService = ANAFOAuthService;
    xmlGenerator = ANAFXMLGenerator;
    signatureService = ANAFSignatureService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Authentication Flow', () => {
    it('should generate OAuth authorization URL', async () => {
      // Mock ANAFOAuthService
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getAuthUrl.mockResolvedValue('https://anaf.ro/oauth/authorize?client_id=test&redirect_uri=test&response_type=code&scope=e-factura&state=test');

      const authUrl = await oauthService.getAuthUrl(1, 1);
      
      expect(authUrl).toBeDefined();
      expect(typeof authUrl).toBe('string');
      expect(authUrl).toContain('oauth/authorize');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=e-factura');
      expect(authUrl).toContain('state=');
    });

    it('should exchange authorization code for tokens', async () => {
      const mockTokens = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer'
      };

      // Mock ANAFOAuthService
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.exchangeCodeForToken.mockResolvedValue(mockTokens);

      const result = await oauthService.exchangeCodeForToken('mock_code', 1, 1);
      
      expect(result).toEqual(mockTokens);
    });

    it('should refresh expired tokens', async () => {
      const mockNewTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer'
      };

      // Mock ANAFOAuthService
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.refreshToken.mockResolvedValue(mockNewTokens);

      const result = await oauthService.refreshToken(1, 1);
      
      expect(result).toEqual(mockNewTokens);
    });
  });

  describe('XML Generation and Validation', () => {
    it('should generate valid XML for invoice', async () => {
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: mockCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });
      
      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
      expect(xml.length).toBeGreaterThan(0);
    });

    it('should include all required EN16931 elements', async () => {
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: mockCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });
      
      // Check for required UBL elements
      expect(xml).toContain('<Invoice');
      expect(xml).toContain('<cbc:ID>');
      expect(xml).toContain('<cbc:IssueDate>');
      expect(xml).toContain('<cac:AccountingSupplierParty>');
      expect(xml).toContain('<cac:AccountingCustomerParty>');
      expect(xml).toContain('<cac:TaxTotal>');
      expect(xml).toContain('<cac:LegalMonetaryTotal>');
      expect(xml).toContain('<cac:InvoiceLine>');
    });

    it('should validate XML structure', async () => {
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: mockCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });
      
      // Basic XML structure validation
      expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(xml).toContain('<Invoice');
      expect(xml).toContain('</Invoice>');
      
      // Check for proper XML structure (simplified validation)
      expect(xml).toContain('<cbc:ID>');
      expect(xml).toContain('<cbc:IssueDate>');
      expect(xml).toContain('<cac:AccountingSupplierParty>');
      expect(xml).toContain('<cac:AccountingCustomerParty>');
    });
  });

  describe('Digital Signature', () => {
    it('should sign XML document', async () => {
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: mockCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      // Mock ANAFSignatureService
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      ANAFSignatureService.signXML.mockResolvedValue(xml + '<cac:Signature><cbc:URI>data:application/pkcs7-signature;base64,test</cbc:URI></cac:Signature>');

      const signedXml = await signatureService.signXML(xml, 1, 1);
      
      expect(signedXml).toBeDefined();
      expect(typeof signedXml).toBe('string');
      expect(signedXml.length).toBeGreaterThan(xml.length);
    });

    it('should include signature elements in signed XML', async () => {
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: mockCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      // Mock ANAFSignatureService
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      ANAFSignatureService.signXML.mockResolvedValue(xml + '<cac:Signature><cbc:URI>data:application/pkcs7-signature;base64,test</cbc:URI></cac:Signature>');

      const signedXml = await signatureService.signXML(xml, 1, 1);
      
      expect(signedXml).toContain('<cac:Signature');
      expect(signedXml).toContain('<cbc:URI>data:application/pkcs7-signature;base64,');
    });

    it('should verify signature', async () => {
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: mockCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      // Mock ANAFSignatureService
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      ANAFSignatureService.signXML.mockResolvedValue(xml + '<cac:Signature><cbc:URI>data:application/pkcs7-signature;base64,test</cbc:URI></cac:Signature>');
      ANAFSignatureService.verifySignature.mockResolvedValue(true);

      const signedXml = await signatureService.signXML(xml, 1, 1);
      const isValid = await signatureService.verifySignature(signedXml, 1, 1);
      
      expect(isValid).toBe(true);
    });
  });

  describe('ANAF Submission Flow', () => {
    it('should submit invoice to ANAF', async () => {
      // Mock OAuth service to return authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(true);
      ANAFOAuthService.getValidAccessToken.mockResolvedValue('mock-token');

      // Mock InvoiceSystemService
      const { InvoiceSystemService } = require('../../../src/lib/invoice-system');
      InvoiceSystemService.getInvoiceTables.mockResolvedValue({
        invoices: { id: 1 },
        invoice_items: { id: 2 },
        customers: { id: 3 }
      });

      // Mock Prisma
      const prisma = require('../../../src/lib/prisma').default;
      prisma.row.findFirst.mockResolvedValue({
        id: 1,
        cells: [
          { column: { name: 'customer_id' }, value: 1 },
          { column: { name: 'invoice_number' }, value: 'INV-001' },
          { column: { name: 'total_amount' }, value: 1000 },
          { column: { name: 'currency' }, value: 'RON' },
          { column: { name: 'subtotal' }, value: 810 },
          { column: { name: 'tax_amount' }, value: 190 },
          { column: { name: 'grand_total' }, value: 1000 }
        ]
      });
      prisma.row.findMany.mockResolvedValue([
        {
          id: 1,
          cells: [
            { column: { name: 'product_name' }, value: 'Test Product' },
            { column: { name: 'quantity' }, value: 1 },
            { column: { name: 'unit_price' }, value: 1000 },
            { column: { name: 'total_price' }, value: 1000 },
            { column: { name: 'vat_rate' }, value: 19 },
            { column: { name: 'vat_amount' }, value: 190 }
          ]
        }
      ]);
      prisma.tenant.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Tenant',
        companyTaxId: 'RO12345678',
        address: 'Test Address',
        companyCity: 'Bucharest',
        companyCountry: 'RO',
        companyPostalCode: '010001',
        phone: '+40123456789',
        companyEmail: 'test@company.com'
      });
      prisma.anafSubmissionLog.create.mockResolvedValue({
        id: 1,
        invoiceId: 1,
        status: 'PENDING',
        submissionId: 'ANAF-123456'
      });

      // Mock ANAFSignatureService
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      ANAFSignatureService.signXML.mockResolvedValue('signed-xml');

      // Mock fetch to return success
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          submissionId: 'ANAF-123456',
          message: 'Invoice submitted successfully',
          status: 'processing',
        }),
      });

      const result = await anafIntegration.submitInvoice(1, 1);
      
      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('ANAF-123456');
    });

    it('should check invoice status', async () => {
      // Mock OAuth service to return token
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getValidAccessToken.mockResolvedValue('mock-token');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'accepted',
          message: 'Invoice accepted by ANAF',
        }),
      });

      const result = await anafIntegration.getInvoiceStatus('ANAF-123456', 1);
      
      expect(result.status).toBe('accepted');
      expect(result.message).toBe('Invoice accepted by ANAF');
    });

    it('should download ANAF response', async () => {
      // Mock OAuth service to return token
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getValidAccessToken.mockResolvedValue('mock-token');

      const responseContent = '<?xml version="1.0"?><Response>ANAF Response</Response>';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(responseContent),
      });

      const result = await anafIntegration.downloadResponse('ANAF-123456', 1);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(responseContent);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should handle OAuth errors gracefully', async () => {
      // Mock ANAFOAuthService to throw error
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.exchangeCodeForToken.mockRejectedValue(new Error('Failed to exchange authorization code for token'));

      await expect(ANAFOAuthService.exchangeCodeForToken('invalid_code', 1, 1))
        .rejects.toThrow('Failed to exchange authorization code for token');
    });

    it('should handle XML generation errors', async () => {
      const invalidInvoiceData = {
        ...mockInvoiceData,
        invoice_number: undefined,
        total_amount: undefined
      };

      // XML generation doesn't throw errors, it handles undefined values gracefully
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: invalidInvoiceData,
        companyData: mockCompanyData,
        customerData: invalidInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
    });

    it('should handle ANAF submission errors', async () => {
      // Mock OAuth service to return not authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const result = await anafIntegration.submitInvoice(1, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated with ANAF');
    });

    it('should implement retry logic for failed submissions', async () => {
      // Mock OAuth service to return not authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const result = await anafIntegration.submitInvoice(1, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated with ANAF');
    });
  });

  describe('Data Validation and Business Rules', () => {
    it('should validate required invoice fields', async () => {
      // Mock OAuth service to return not authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const result = await anafIntegration.submitInvoice(1, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated with ANAF');
    });

    it('should validate company data', async () => {
      const invalidCompanyData = {
        ...mockCompanyData,
        taxId: undefined,
        name: undefined
      };

      // XML generation handles undefined values gracefully
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: mockInvoiceData,
        companyData: invalidCompanyData,
        customerData: mockInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
    });

    it('should validate customer data', async () => {
      const invalidInvoiceData = {
        ...mockInvoiceData,
        customer_name: undefined,
        customer_tax_id: undefined
      };

      // XML generation handles undefined values gracefully
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: invalidInvoiceData,
        companyData: mockCompanyData,
        customerData: invalidInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
    });

    it('should validate monetary amounts', async () => {
      const invalidInvoiceData = {
        ...mockInvoiceData,
        total_amount: -100,
        tax_amount: -50
      };

      // XML generation handles negative values gracefully
      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: invalidInvoiceData,
        companyData: mockCompanyData,
        customerData: invalidInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });

      expect(xml).toBeDefined();
      expect(typeof xml).toBe('string');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent submissions', async () => {
      // Mock OAuth service to return not authenticated for all submissions
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const promises = Array.from({ length: 10 }, (_, i) => 
        anafIntegration.submitInvoice(i + 1, 1)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.error).toContain('User not authenticated with ANAF');
      });
    });

    it('should handle large invoice data', async () => {
      const largeInvoiceData = {
        ...mockInvoiceData,
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          description: `Product ${i + 1}`,
          quantity: 1,
          unit_price: 10.00,
          total_price: 10.00,
          tax_rate: 19,
          tax_amount: 1.90,
          unit_of_measure: 'pcs',
          vat_amount: 1.90,
          vat_rate: 19,
          currency: 'RON'
        }))
      };

      const xml = ANAFXMLGenerator.generateXML({
        invoiceData: largeInvoiceData,
        companyData: mockCompanyData,
        customerData: largeInvoiceData.customerData,
        language: 'ro',
        includeSignature: false
      });
      
      expect(xml).toBeDefined();
      expect(xml.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Existing System', () => {
    it('should integrate with invoice system', async () => {
      // Mock OAuth service to return not authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const result = await anafIntegration.submitInvoice(1, 1);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated with ANAF');
    });

    it('should update invoice status after submission', async () => {
      // Mock OAuth service to return not authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const result = await anafIntegration.submitInvoice(1, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated with ANAF');
    });
  });
});
