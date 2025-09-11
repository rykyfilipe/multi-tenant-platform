/** @format */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  FileText, 
  Building2, 
  User, 
  Calendar,
  DollarSign,
  Hash
} from 'lucide-react';

interface InvoiceData {
  invoice: {
    invoice_number: string;
    invoice_series?: string;
    date: string;
    due_date?: string;
    status: string;
    total_amount: number;
    payment_terms?: string;
  };
  customer: {
    customer_name: string;
    customer_address?: string;
    customer_email?: string;
    customer_phone?: string;
  };
  items: Array<{
    product_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total: number;
    vat_rate?: number;
  }>;
  totals: {
    subtotal: number;
    vatTotal: number;
    grandTotal: number;
    discountAmount?: number;
    discountRate?: number;
    vatRate?: number;
  };
}

interface TenantBranding {
  name: string;
  companyEmail?: string;
  address?: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  companyTaxId?: string;
  registrationNumber?: string;
  companyCity?: string;
  companyCountry?: string;
  companyPostalCode?: string;
  companyIban?: string;
  companyBank?: string;
  companyStreet?: string;
  companyStreetNumber?: string;
}

interface InvoiceHTMLPreviewProps {
  invoiceData: InvoiceData;
  tenantBranding: TenantBranding;
  translations: Record<string, string>;
  zoom: number;
  onDownload?: () => void;
}

export function InvoiceHTMLPreview({ 
  invoiceData, 
  tenantBranding, 
  translations, 
  zoom,
  onDownload 
}: InvoiceHTMLPreviewProps) {
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div 
      className="bg-white shadow-2xl border border-gray-200 mx-auto"
      style={{ 
        width: `${zoom}%`,
        maxWidth: '100%',
        transition: 'width 0.3s ease',
        // A4 aspect ratio: 210mm x 297mm = 0.707 (width/height)
        aspectRatio: '210/297',
        minHeight: '600px',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Invoice Header */}
      <div className="border-b-2 border-gray-300 p-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {tenantBranding.name || 'Company Name'}
              </h1>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{translations.invoice || 'INVOICE'}</h2>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">
                {translations.invoiceNumber || 'Invoice#'} {invoiceData.invoice.invoice_series && `${invoiceData.invoice.invoice_series}-`}{invoiceData.invoice.invoice_number}
              </div>
              <div>{translations.date || 'Date'}: {formatDate(invoiceData.invoice.date)}</div>
              <div className="text-lg font-bold text-gray-900 mt-2">
                Total Due: {formatCurrency(invoiceData.invoice.total_amount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="p-8 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Info - Left side */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{translations.company || 'From'}:</h3>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-gray-900">{tenantBranding.name}</div>
              {/* Build address from tenant data */}
              {(tenantBranding.companyStreet || tenantBranding.address) && (
                <div className="text-gray-600">
                  {tenantBranding.companyStreet && tenantBranding.companyStreetNumber
                    ? `${tenantBranding.companyStreet} ${tenantBranding.companyStreetNumber}`
                    : tenantBranding.address || tenantBranding.companyStreet}
                </div>
              )}
              {(tenantBranding.companyCity || tenantBranding.companyPostalCode) && (
                <div className="text-gray-600">
                  {[tenantBranding.companyPostalCode, tenantBranding.companyCity, tenantBranding.companyCountry]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              )}
              {tenantBranding.companyEmail && (
                <div className="text-gray-600">{tenantBranding.companyEmail}</div>
              )}
              {tenantBranding.phone && (
                <div className="text-gray-600">{tenantBranding.phone}</div>
              )}
              {tenantBranding.website && (
                <div className="text-gray-600">{tenantBranding.website}</div>
              )}
              {tenantBranding.companyTaxId && (
                <div className="text-gray-600">
                  Tax ID: {tenantBranding.companyTaxId}
                </div>
              )}
              {tenantBranding.registrationNumber && (
                <div className="text-gray-600">
                  Reg. No: {tenantBranding.registrationNumber}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info - Right side */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{translations.customer || 'Bill To'}:</h3>
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-gray-900">
                {invoiceData.customer.customer_name}
              </div>
              {invoiceData.customer.customer_address && (
                <div className="text-gray-600">{invoiceData.customer.customer_address}</div>
              )}
              {invoiceData.customer.customer_email && (
                <div className="text-gray-600">{invoiceData.customer.customer_email}</div>
              )}
              {invoiceData.customer.customer_phone && (
                <div className="text-gray-600">{invoiceData.customer.customer_phone}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="p-8 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {translations.date || 'Invoice Date'}
              </span>
            </div>
            <div className="text-gray-900">{formatDate(invoiceData.invoice.date)}</div>
          </div>
          
          {invoiceData.invoice.due_date && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {translations.dueDate || 'Due Date'}
                </span>
              </div>
              <div className="text-gray-900">{formatDate(invoiceData.invoice.due_date)}</div>
            </div>
          )}

          {invoiceData.invoice.payment_terms && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {translations.paymentTerms || 'Payment Terms'}
                </span>
              </div>
              <div className="text-gray-900">{invoiceData.invoice.payment_terms}</div>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="p-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider border-b border-gray-300">
                  {translations.item || 'ITEM'} {translations.description || 'DESCRIPTION'}
                </th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider border-b border-gray-300">
                  {translations.unitPrice || 'PRICE'}
                </th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider border-b border-gray-300">
                  {translations.quantity || 'QTY'}
                </th>
                <th className="text-right py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider border-b border-gray-300">
                  {translations.total || 'TOTAL'}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900 text-sm">
                      {item.product_name}
                    </div>
                    {item.description && (
                      <div className="text-gray-600 text-xs mt-1">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900 text-sm">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-4 px-4 text-right text-gray-900 text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-gray-900 text-sm">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-80 space-y-1">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-700 font-semibold">
                {translations.subtotal || 'SUB TOTAL'}:
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoiceData.totals.subtotal)}
              </span>
            </div>
            
            {invoiceData.totals.vatTotal > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700 font-semibold">
                  {translations.tax || 'Tax VAT'}:
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoiceData.totals.vatTotal)}
                </span>
              </div>
            )}
            
            {(invoiceData.totals.discountAmount || 0) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700 font-semibold">
                  {translations.discount || 'Discount'}:
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(invoiceData.totals.discountAmount || 0)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-4">
              <span className="text-lg font-bold text-gray-900">
                {translations.grandTotal || 'GRAND TOTAL'}:
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(invoiceData.totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer removed - no signature, payment method, contact, or terms */}
    </div>
  );
}

