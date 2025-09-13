/** @format */

// Common interface for invoice submission providers (international scalability)

export interface InvoiceSubmissionProvider {
  /**
   * Submit an invoice to the external system
   */
  submitInvoice(invoiceId: number, tenantId: number, options?: any): Promise<InvoiceSubmissionResult>;

  /**
   * Check the status of a submitted invoice
   */
  getInvoiceStatus(submissionId: string, tenantId: number): Promise<InvoiceStatusResult>;

  /**
   * Download the response from the external system
   */
  downloadResponse(submissionId: string, tenantId: number): Promise<DownloadResult>;

  /**
   * Get user authentication URL for OAuth flow
   */
  getAuthUrl(userId: number, tenantId: number): Promise<string>;

  /**
   * Exchange authorization code for access token
   */
  exchangeCodeForToken(code: string, userId: number, tenantId: number): Promise<TokenResult>;

  /**
   * Refresh access token
   */
  refreshToken(userId: number, tenantId: number): Promise<TokenResult>;

  /**
   * Check if user is authenticated
   */
  isAuthenticated(userId: number, tenantId: number): Promise<boolean>;

  /**
   * Generate XML for the invoice (provider-specific format)
   */
  generateXML(invoiceData: any, options?: any): Promise<string>;

  /**
   * Sign the XML content
   */
  signXML(xmlContent: string, userId: number, tenantId: number): Promise<string>;
}

export interface InvoiceSubmissionResult {
  success: boolean;
  submissionId?: string;
  message?: string;
  error?: string;
  status?: string;
  timestamp: string;
}

export interface InvoiceStatusResult {
  submissionId: string;
  status: string;
  message?: string;
  error?: string;
  timestamp: string;
  responseData?: any;
}

export interface DownloadResult {
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}

export interface TokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface ProviderConfiguration {
  name: string;
  version: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
  supportedCountries: string[];
  supportedCurrencies: string[];
  supportedLanguages: string[];
  features: ProviderFeature[];
}

export interface ProviderFeature {
  name: string;
  enabled: boolean;
  description: string;
}

// Registry for different invoice submission providers
export class InvoiceSubmissionProviderRegistry {
  private static providers: Map<string, InvoiceSubmissionProvider> = new Map();

  static register(name: string, provider: InvoiceSubmissionProvider): void {
    this.providers.set(name, provider);
  }

  static get(name: string): InvoiceSubmissionProvider | undefined {
    return this.providers.get(name);
  }

  static getAll(): Map<string, InvoiceSubmissionProvider> {
    return new Map(this.providers);
  }

  static getSupportedProviders(country: string): InvoiceSubmissionProvider[] {
    const supported: InvoiceSubmissionProvider[] = [];
    
    for (const [name, provider] of this.providers) {
      // This would check if the provider supports the country
      // Implementation depends on provider configuration
      supported.push(provider);
    }
    
    return supported;
  }
}
