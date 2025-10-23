# ANAF e-Factura Integration

The ANAF e-Factura integration provides seamless compliance with Romanian government requirements for electronic invoicing, enabling automatic invoice submission and validation through the official ANAF (Agenția Națională de Administrare Fiscală) system.

## Overview

The ANAF integration enables Romanian businesses to:

- **Submit Invoices Electronically**: Direct submission to ANAF e-Factura system
- **Validate Invoice Data**: Automatic validation against Romanian tax requirements
- **Generate XML Documents**: Compliant XML generation for invoice submission
- **Track Submission Status**: Real-time status tracking of submitted invoices
- **Handle Authentication**: OAuth2 flow for secure ANAF API access
- **Manage Digital Signatures**: Digital signature generation for invoice authenticity

## Architecture Components

### 1. ANAF API Integration

#### Core Services
```typescript
// ANAF API service for invoice submission
export class ANAFApiService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.anaf.ro/ws'
      : 'https://api.anaf.ro/test/ws';
    this.clientId = process.env.ANAF_CLIENT_ID!;
    this.clientSecret = process.env.ANAF_CLIENT_SECRET!;
  }
  
  async submitInvoice(invoiceXml: string, accessToken: string): Promise<ANAFResponse> {
    const response = await fetch(`${this.baseUrl}/efactura`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'YDV-Platform/1.0'
      },
      body: invoiceXml
    });
    
    if (!response.ok) {
      throw new ANAFError(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async checkInvoiceStatus(invoiceId: string, accessToken: string): Promise<InvoiceStatus> {
    const response = await fetch(`${this.baseUrl}/efactura/status/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return await response.json();
  }
}
```

### 2. OAuth2 Authentication

#### Authentication Flow
```typescript
// OAuth2 service for ANAF authentication
export class ANAFOAuthService {
  private redirectUri: string;
  private scope: string = 'efactura';
  
  constructor() {
    this.redirectUri = process.env.ANAF_REDIRECT_URI!;
  }
  
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.ANAF_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
      state: state
    });
    
    return `https://api.anaf.ro/oauth/authorize?${params.toString()}`;
  }
  
  async exchangeCodeForToken(code: string): Promise<ANAFTokenResponse> {
    const response = await fetch('https://api.anaf.ro/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ANAF_CLIENT_ID!,
        client_secret: process.env.ANAF_CLIENT_SECRET!,
        redirect_uri: this.redirectUri,
        code: code
      })
    });
    
    if (!response.ok) {
      throw new ANAFError('Failed to exchange code for token');
    }
    
    return await response.json();
  }
  
  async refreshToken(refreshToken: string): Promise<ANAFTokenResponse> {
    const response = await fetch('https://api.anaf.ro/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ANAF_CLIENT_ID!,
        client_secret: process.env.ANAF_CLIENT_SECRET!,
        refresh_token: refreshToken
      })
    });
    
    return await response.json();
  }
}
```

### 3. XML Generation

#### Invoice XML Structure
```typescript
// XML generator for ANAF-compliant invoices
export class ANAFXMLGenerator {
  static generateInvoiceXML(invoice: InvoiceWithDetails): string {
    const builder = new XMLBuilder({
      version: '1.0',
      encoding: 'UTF-8',
      standalone: true
    });
    
    const invoiceXml = builder.create({
      Invoice: {
        '@xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        '@xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        '@xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        
        // Invoice identification
        'cbc:ID': invoice.invoiceNumber,
        'cbc:IssueDate': this.formatDate(invoice.issueDate),
        'cbc:DueDate': this.formatDate(invoice.dueDate),
        'cbc:InvoiceTypeCode': '380', // Commercial invoice
        
        // Currency
        'cbc:DocumentCurrencyCode': invoice.baseCurrency,
        
        // Supplier information
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cac:PartyIdentification': {
              'cbc:ID': invoice.tenant.companyTaxId
            },
            'cac:PartyName': {
              'cbc:Name': invoice.tenant.name
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.tenant.companyStreet,
              'cbc:CityName': invoice.tenant.companyCity,
              'cbc:PostalZone': invoice.tenant.companyPostalCode,
              'cac:Country': {
                'cbc:IdentificationCode': invoice.tenant.companyCountry
              }
            }
          }
        },
        
        // Customer information
        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cac:PartyIdentification': {
              'cbc:ID': invoice.customer.taxId || invoice.customer.id.toString()
            },
            'cac:PartyName': {
              'cbc:Name': invoice.customer.name
            },
            'cac:PostalAddress': {
              'cbc:StreetName': invoice.customer.address || '',
              'cbc:CityName': invoice.customer.city || '',
              'cbc:PostalZone': invoice.customer.postalCode || '',
              'cac:Country': {
                'cbc:IdentificationCode': invoice.customer.country || 'RO'
              }
            }
          }
        },
        
        // Invoice lines
        'cac:InvoiceLine': invoice.items.map((item, index) => ({
          'cbc:ID': (index + 1).toString(),
          'cbc:InvoicedQuantity': {
            '@unitCode': item.unitOfMeasure || 'C62',
            '#': item.quantity.toString()
          },
          'cbc:LineExtensionAmount': {
            '@currencyID': item.currency,
            '#': item.lineTotal.toFixed(2)
          },
          'cac:Item': {
            'cbc:Description': item.description || '',
            'cac:SellersItemIdentification': {
              'cbc:ID': item.productRefId.toString()
            }
          },
          'cac:Price': {
            'cbc:PriceAmount': {
              '@currencyID': item.currency,
              '#': item.price.toFixed(2)
            },
            'cbc:BaseQuantity': {
              '@unitCode': item.unitOfMeasure || 'C62',
              '#': '1'
            }
          }
        })),
        
        // Tax totals
        'cac:TaxTotal': {
          'cbc:TaxAmount': {
            '@currencyID': invoice.baseCurrency,
            '#': invoice.taxTotal.toFixed(2)
          }
        },
        
        // Legal monetary totals
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': {
            '@currencyID': invoice.baseCurrency,
            '#': invoice.subtotal.toFixed(2)
          },
          'cbc:TaxExclusiveAmount': {
            '@currencyID': invoice.baseCurrency,
            '#': invoice.subtotal.toFixed(2)
          },
          'cbc:TaxInclusiveAmount': {
            '@currencyID': invoice.baseCurrency,
            '#': invoice.totalAmount.toFixed(2)
          },
          'cbc:PayableAmount': {
            '@currencyID': invoice.baseCurrency,
            '#': invoice.totalAmount.toFixed(2)
          }
        }
      }
    });
    
    return invoiceXml.end({ prettyPrint: true });
  }
  
  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
```

### 4. Digital Signature

#### Signature Service
```typescript
// Digital signature service for ANAF compliance
export class ANAFSignatureService {
  private privateKey: string;
  private certificate: string;
  
  constructor() {
    this.privateKey = process.env.ANAF_PRIVATE_KEY!;
    this.certificate = process.env.ANAF_CERTIFICATE!;
  }
  
  async signInvoiceXML(xmlContent: string): Promise<string> {
    try {
      // Load private key
      const privateKey = forge.pki.privateKeyFromPem(this.privateKey);
      
      // Create digest
      const digest = forge.md.sha256.create();
      digest.update(xmlContent, 'utf8');
      const digestValue = forge.util.encode64(digest.digest().bytes());
      
      // Create signature
      const signature = privateKey.sign(digest);
      const signatureValue = forge.util.encode64(signature);
      
      // Generate signature XML
      const signatureXml = this.generateSignatureXML(digestValue, signatureValue);
      
      // Append signature to invoice XML
      return xmlContent.replace('</Invoice>', `${signatureXml}</Invoice>`);
      
    } catch (error) {
      throw new ANAFError(`Failed to sign XML: ${error.message}`);
    }
  }
  
  private generateSignatureXML(digestValue: string, signatureValue: string): string {
    return `
      <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:SignedInfo>
          <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
          <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
          <ds:Reference URI="">
            <ds:Transforms>
              <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
            </ds:Transforms>
            <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
            <ds:DigestValue>${digestValue}</ds:DigestValue>
          </ds:Reference>
        </ds:SignedInfo>
        <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>${this.certificate}</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      </ds:Signature>
    `;
  }
}
```

## Implementation Details

### 1. Invoice Submission Flow

#### Complete Submission Process
```typescript
// API: POST /api/anaf/send-invoice
export async function POST(request: NextRequest) {
  try {
    const { invoiceId, tenantId } = await request.json();
    
    // Get invoice with all details
    const invoice = await getInvoiceWithDetails(invoiceId, tenantId);
    
    // Validate invoice for ANAF submission
    const validationResult = await validateInvoiceForANAF(invoice);
    if (!validationResult.valid) {
      return NextResponse.json({
        error: 'Invoice validation failed',
        details: validationResult.errors
      }, { status: 400 });
    }
    
    // Get tenant ANAF credentials
    const credentials = await getTenantANAFCredentials(tenantId);
    if (!credentials) {
      return NextResponse.json({
        error: 'ANAF credentials not configured'
      }, { status: 400 });
    }
    
    // Generate XML
    const xmlContent = ANAFXMLGenerator.generateInvoiceXML(invoice);
    
    // Sign XML
    const signedXml = await ANAFSignatureService.signInvoiceXML(xmlContent);
    
    // Submit to ANAF
    const anafResponse = await ANAFApiService.submitInvoice(
      signedXml, 
      credentials.accessToken
    );
    
    // Log submission
    await logANAFSubmission(invoiceId, anafResponse);
    
    // Update invoice status
    await updateInvoiceANAFStatus(invoiceId, anafResponse.status);
    
    return NextResponse.json({
      success: true,
      anafResponse,
      submissionId: anafResponse.id
    });
    
  } catch (error) {
    console.error('ANAF submission error:', error);
    return NextResponse.json({
      error: 'Failed to submit invoice to ANAF',
      details: error.message
    }, { status: 500 });
  }
}
```

### 2. Status Tracking

#### Real-Time Status Updates
```typescript
// API: GET /api/anaf/invoice-status/[invoiceId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    
    // Get invoice ANAF submission record
    const submission = await prisma.aNAFSubmissionLog.findFirst({
      where: { invoiceId: parseInt(invoiceId) },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!submission) {
      return NextResponse.json({
        error: 'Invoice not submitted to ANAF'
      }, { status: 404 });
    }
    
    // Get current status from ANAF
    const credentials = await getTenantANAFCredentials(submission.tenantId);
    const status = await ANAFApiService.checkInvoiceStatus(
      submission.anafInvoiceId,
      credentials.accessToken
    );
    
    // Update local status if changed
    if (status.status !== submission.status) {
      await prisma.aNAFSubmissionLog.update({
        where: { id: submission.id },
        data: { 
          status: status.status,
          lastChecked: new Date()
        }
      });
    }
    
    return NextResponse.json({
      invoiceId: parseInt(invoiceId),
      anafInvoiceId: submission.anafInvoiceId,
      status: status.status,
      lastChecked: submission.lastChecked,
      submissionDate: submission.createdAt
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check invoice status',
      details: error.message
    }, { status: 500 });
  }
}
```

### 3. Error Handling

#### Comprehensive Error Management
```typescript
// ANAF error handler
export class ANAFErrorHandler {
  static handleError(error: any): ANAFErrorResponse {
    if (error instanceof ANAFError) {
      return {
        code: error.code,
        message: error.message,
        details: error.details,
        retryable: error.retryable
      };
    }
    
    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to ANAF servers',
        retryable: true
      };
    }
    
    // HTTP errors
    if (error.status) {
      return this.handleHTTPError(error);
    }
    
    // Unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      retryable: false
    };
  }
  
  private static handleHTTPError(error: any): ANAFErrorResponse {
    const status = error.status;
    
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: 'Invalid request format',
          details: error.body,
          retryable: false
        };
      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired credentials',
          retryable: false
        };
      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          retryable: false
        };
      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded',
          retryable: true
        };
      case 500:
        return {
          code: 'SERVER_ERROR',
          message: 'ANAF server error',
          retryable: true
        };
      default:
        return {
          code: 'HTTP_ERROR',
          message: `HTTP ${status} error`,
          retryable: status >= 500
        };
    }
  }
}
```

## Advanced Features

### 1. Silent Authentication

#### Background Authentication
```typescript
// Silent ANAF authentication service
export class SilentANAFService {
  static async authenticateTenant(tenantId: number): Promise<boolean> {
    try {
      // Check if tenant has valid credentials
      const credentials = await getTenantANAFCredentials(tenantId);
      
      if (!credentials || !credentials.refreshToken) {
        return false;
      }
      
      // Try to refresh token
      const tokenResponse = await ANAFOAuthService.refreshToken(
        credentials.refreshToken
      );
      
      // Update credentials
      await updateTenantANAFCredentials(tenantId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000)
      });
      
      return true;
      
    } catch (error) {
      console.error('Silent authentication failed:', error);
      return false;
    }
  }
  
  static async schedulePeriodicAuth(): Promise<void> {
    // Run every hour to refresh tokens
    setInterval(async () => {
      const tenants = await getActiveANAFTenants();
      
      for (const tenant of tenants) {
        await this.authenticateTenant(tenant.id);
      }
    }, 3600000); // 1 hour
  }
}
```

### 2. Batch Processing

#### Bulk Invoice Submission
```typescript
// Batch invoice submission service
export class ANAFBatchService {
  static async submitBatchInvoices(
    invoiceIds: number[],
    tenantId: number
  ): Promise<BatchSubmissionResult> {
    const results: BatchSubmissionResult[] = [];
    
    // Process invoices in batches of 10
    const batches = this.chunkArray(invoiceIds, 10);
    
    for (const batch of batches) {
      const batchPromises = batch.map(invoiceId => 
        this.submitSingleInvoice(invoiceId, tenantId)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      results.push(...batchResults.map((result, index) => ({
        invoiceId: batch[index],
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason : null
      })));
      
      // Rate limiting - wait between batches
      await this.delay(1000);
    }
    
    return {
      total: invoiceIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
  
  private static async submitSingleInvoice(
    invoiceId: number,
    tenantId: number
  ): Promise<void> {
    const invoice = await getInvoiceWithDetails(invoiceId, tenantId);
    const xmlContent = ANAFXMLGenerator.generateInvoiceXML(invoice);
    const signedXml = await ANAFSignatureService.signInvoiceXML(xmlContent);
    
    const credentials = await getTenantANAFCredentials(tenantId);
    await ANAFApiService.submitInvoice(signedXml, credentials.accessToken);
  }
}
```

## Common Issues & Solutions

### 1. Authentication Failures

**Problem**: OAuth2 authentication fails or tokens expire
**Solution**:
- Implement automatic token refresh
- Add retry logic with exponential backoff
- Provide clear error messages for credential issues

### 2. XML Validation Errors

**Problem**: Generated XML doesn't pass ANAF validation
**Solution**:
- Implement comprehensive XML validation
- Add schema validation before submission
- Provide detailed error reporting

### 3. Network Connectivity Issues

**Problem**: Intermittent connection failures to ANAF servers
**Solution**:
- Implement retry mechanisms
- Add circuit breaker pattern
- Cache responses for offline scenarios

## Future Enhancements

### 1. Advanced Features
- **Automated Reconciliation**: Sync ANAF data with local invoices
- **Bulk Operations**: Mass invoice submission and status updates
- **Compliance Reporting**: Generate compliance reports for audits

### 2. Integration Improvements
- **Real-Time Webhooks**: Receive status updates via webhooks
- **Enhanced Error Handling**: More detailed error reporting and recovery
- **Performance Optimization**: Caching and batch processing improvements

### 3. Additional Compliance
- **e-Transport Integration**: Integration with Romanian e-Transport system
- **VAT Reporting**: Automated VAT return generation
- **Audit Trail**: Comprehensive audit logging for compliance
