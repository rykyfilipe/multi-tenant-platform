/** @format */

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

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ANAFIntegration } from '../../../src/lib/anaf/anaf-integration';
import { ANAFXMLGenerator } from '../../../src/lib/anaf/xml-generator';
import { ANAFSignatureService } from '../../../src/lib/anaf/signature-service';

// Mock fetch
global.fetch = jest.fn();

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

describe('ANAF Integration', () => {
  let anafIntegration: ANAFIntegration;

  beforeEach(() => {
    anafIntegration = new ANAFIntegration();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('XML Generation', () => {
    it('should generate valid XML for invoice', () => {
      const invoiceData = {
        invoiceId: 1,
        invoiceNumber: 'INV-2025-001',
        invoiceDate: '2025-01-15',
        dueDate: '2025-02-15',
        customerTaxId: 'RO12345678',
        customerName: 'Test Customer',
        customerAddress: 'Test Address 123',
        companyTaxId: 'RO87654321',
        companyName: 'Test Company',
        companyAddress: 'Company Address 456',
        items: [
          {
            productName: 'Test Product',
            description: 'Test Description',
            quantity: 2,
            unitOfMeasure: 'pcs',
            unitPrice: 100,
            totalPrice: 200,
            vatRate: 19,
            vatAmount: 38,
            currency: 'RON',
          },
        ],
        totals: {
          subtotal: 200,
          vatTotal: 38,
          grandTotal: 238,
          currency: 'RON',
        },
        currency: 'RON',
        language: 'ro',
      };

      const companyData = {
        taxId: 'RO87654321',
        name: 'Test Company',
        address: 'Company Address 456',
        city: 'Bucharest',
        country: 'RO',
        postalCode: '010001',
        registrationNumber: 'J40/123/2023',
        phone: '+40123456789',
        email: 'test@company.com',
      };

      const customerData = {
        taxId: 'RO12345678',
        name: 'Test Customer',
        address: 'Test Address 123',
        city: 'Bucharest',
        country: 'RO',
        postalCode: '010002',
        registrationNumber: 'J40/456/2023',
        phone: '+40987654321',
        email: 'customer@test.com',
      };

      const xml = ANAFXMLGenerator.generateXML({
        invoiceData,
        companyData,
        customerData,
        language: 'ro',
        includeSignature: false,
      });

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<Invoice xmlns=');
      expect(xml).toContain('<cbc:ID>INV-2025-001</cbc:ID>');
      expect(xml).toContain('<cbc:IssueDate>2025-01-15</cbc:IssueDate>');
      expect(xml).toContain('<cbc:DueDate>2025-02-15</cbc:DueDate>');
      expect(xml).toContain('<cbc:DocumentCurrencyCode listID="ISO4217">RON</cbc:DocumentCurrencyCode>');
      expect(xml).toContain('Test Company');
      expect(xml).toContain('Test Customer');
      expect(xml).toContain('Test Product');
    });

    it('should validate XML content', () => {
      const validXML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>INV-001</cbc:ID>
  <cbc:IssueDate>2025-01-15</cbc:IssueDate>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Test Company</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Test Customer</cbc:Name>
      </cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="RON">100.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

      const validation = ANAFXMLGenerator.validateXML(validXML);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid XML', () => {
      const invalidXML = 'Not XML content';
      const validation = ANAFXMLGenerator.validateXML(invalidXML);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Digital Signature', () => {
    it('should create and verify signature', async () => {
      const xmlContent = '<?xml version="1.0"?><Invoice><cbc:ID>TEST-001</cbc:ID></Invoice>';
      const userId = 1;
      const tenantId = 1;

      // Mock ANAFSignatureService
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      ANAFSignatureService.signXML.mockResolvedValue('<?xml version="1.0"?><Invoice><cbc:ID>TEST-001</cbc:ID><cac:Signature><cbc:URI>data:application/pkcs7-signature;base64,test</cbc:URI></cac:Signature></Invoice>');
      ANAFSignatureService.verifySignature.mockResolvedValue(true);

      const signedXML = await ANAFSignatureService.signXML(xmlContent, userId, tenantId);
      expect(signedXML).toContain('<cac:Signature>');
      expect(signedXML).toContain('<cbc:URI>data:application/pkcs7-signature;base64,');

      const isValid = await ANAFSignatureService.verifySignature(signedXML, userId, tenantId);
      expect(isValid).toBe(true);
    });

    it('should validate signature format', () => {
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      
      // Mock the first call to return valid
      ANAFSignatureService.validateSignatureFormat.mockReturnValueOnce({ isValid: true });
      // Mock the second call to return invalid
      ANAFSignatureService.validateSignatureFormat.mockReturnValueOnce({ isValid: false });

      const validSignature = Buffer.from('test signature that is long enough to pass validation requirements').toString('base64');
      const validation = ANAFSignatureService.validateSignatureFormat(validSignature);
      expect(validation.isValid).toBe(true);

      const invalidSignature = 'not-base64';
      const invalidValidation = ANAFSignatureService.validateSignatureFormat(invalidSignature);
      expect(invalidValidation.isValid).toBe(false);
    });
  });

  describe('Invoice Submission', () => {
    it('should handle submission errors gracefully', async () => {
      // Mock OAuth service to return not authenticated
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.isAuthenticated.mockResolvedValue(false);

      const result = await anafIntegration.submitInvoice(1, 1, { userId: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated with ANAF');
    });

    it('should handle successful submission', async () => {
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
      prisma.row.findMany.mockResolvedValue([]);
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
        submissionId: 'test-submission-123'
      });

      // Mock ANAFSignatureService
      const { ANAFSignatureService } = require('../../../src/lib/anaf/signature-service');
      ANAFSignatureService.signXML.mockResolvedValue('signed-xml');

      // Mock fetch to return success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          submissionId: 'test-submission-123',
          message: 'Invoice submitted successfully',
          status: 'pending',
        }),
      });

      const result = await anafIntegration.submitInvoice(1, 1, { userId: 1 });
      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('test-submission-123');
    });
  });

  describe('Status Checking', () => {
    it('should handle status check errors', async () => {
      // Mock OAuth service to return no token
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getValidAccessToken.mockRejectedValue(new Error('No access token available'));

      const result = await anafIntegration.getInvoiceStatus('test-submission-123', 1);
      expect(result.status).toBe('error');
      expect(result.error).toContain('No access token available');
    });

    it('should handle successful status check', async () => {
      // Mock OAuth service to return token
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getValidAccessToken.mockResolvedValue('mock-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'accepted',
          message: 'Invoice accepted by ANAF',
        }),
      });

      const result = await anafIntegration.getInvoiceStatus('test-submission-123', 1);
      expect(result.status).toBe('accepted');
      expect(result.message).toBe('Invoice accepted by ANAF');
    });
  });

  describe('Response Download', () => {
    it('should handle download errors', async () => {
      // Mock OAuth service to return no token
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getValidAccessToken.mockRejectedValue(new Error('No access token available'));

      const result = await anafIntegration.downloadResponse('test-submission-123', 1);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No access token available');
    });

    it('should handle successful download', async () => {
      // Mock OAuth service to return token
      const { ANAFOAuthService } = require('../../../src/lib/anaf/oauth-service');
      ANAFOAuthService.getValidAccessToken.mockResolvedValue('mock-token');

      const responseContent = '<?xml version="1.0"?><Response>Test Response</Response>';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(responseContent),
      });

      const result = await anafIntegration.downloadResponse('test-submission-123', 1);
      expect(result.success).toBe(true);
      expect(result.content).toBe(responseContent);
      expect(result.filename).toContain('anaf_response_test-submission-123.xml');
    });
  });
});
