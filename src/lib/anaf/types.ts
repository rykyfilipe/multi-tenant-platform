/** @format */

// Core ANAF e-Factura types and interfaces

export interface ANAFTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

export interface ANAFInvoiceSubmissionRequest {
  invoiceId: number;
  tenantId: number;
  xmlContent: string;
  signature: string;
  submissionType: 'automatic' | 'manual';
}

export interface ANAFInvoiceSubmissionResponse {
  success: boolean;
  submissionId?: string;
  message?: string;
  error?: string;
  status?: ANAFSubmissionStatus;
  timestamp: string;
}

export interface ANAFInvoiceStatusResponse {
  submissionId: string;
  status: ANAFSubmissionStatus;
  message?: string;
  error?: string;
  timestamp: string;
  responseXml?: string;
}

export interface ANAFDownloadResponse {
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}

export type ANAFSubmissionStatus = 
  | 'pending'
  | 'processing'
  | 'accepted'
  | 'rejected'
  | 'error'
  | 'timeout';

export interface ANAFConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface ANAFUserCredentials {
  userId: number;
  tenantId: number;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
}

export interface ANAFInvoiceData {
  invoiceId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerTaxId: string;
  customerName: string;
  customerAddress: string;
  companyTaxId: string;
  companyName: string;
  companyAddress: string;
  items: ANAFInvoiceItem[];
  totals: ANAFTotals;
  currency: string;
  language: string;
}

export interface ANAFInvoiceItem {
  productName: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
  currency: string;
}

export interface ANAFTotals {
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  currency: string;
}

export interface ANAFXMLGenerationOptions {
  invoiceData: ANAFInvoiceData;
  companyData: ANAFCompanyData;
  customerData: ANAFCustomerData;
  language: string;
  includeSignature?: boolean;
}

export interface ANAFCompanyData {
  taxId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
}

export interface ANAFCustomerData {
  taxId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
}

export interface ANAFError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

export interface ANAFRetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

export interface ANAFSubmissionLog {
  id: string;
  invoiceId: number;
  tenantId: number;
  submissionId?: string;
  status: ANAFSubmissionStatus;
  message?: string;
  error?: string;
  xmlContent?: string;
  responseXml?: string;
  submittedAt: Date;
  updatedAt: Date;
  retryCount: number;
  submissionType: 'automatic' | 'manual';
}
