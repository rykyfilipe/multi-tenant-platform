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
      className="bg-white shadow-2xl rounded-lg overflow-hidden"
      style={{ 
        width: `${zoom}%`,
        maxWidth: '100%',
        transition: 'width 0.3s ease',
        minHeight: 'calc(100vh - 200px)'
      }}
    >
      {/* Invoice Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {translations.invoice || 'INVOICE'}
            </h1>
            <div className="flex items-center gap-4 text-blue-100">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span className="font-medium">
                  {invoiceData.invoice.invoice_series && `${invoiceData.invoice.invoice_series}-`}
                  {invoiceData.invoice.invoice_number}
                </span>
              </div>
              <Badge variant="secondary" className="bg-blue-500 text-white">
                {invoiceData.invoice.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(invoiceData.invoice.total_amount)}
            </div>
            <div className="text-blue-100 text-sm">
              {translations.grandTotal || 'Total Amount'}
            </div>
          </div>
        </div>
      </div>

      {/* Company and Customer Info */}
      <div className="p-8 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {translations.company || 'From'}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-gray-900">{tenantBranding.name}</div>
              {tenantBranding.address && (
                <div className="text-gray-600">{tenantBranding.address}</div>
              )}
              {tenantBranding.companyEmail && (
                <div className="text-gray-600">{tenantBranding.companyEmail}</div>
              )}
              {tenantBranding.phone && (
                <div className="text-gray-600">{tenantBranding.phone}</div>
              )}
              {tenantBranding.companyTaxId && (
                <div className="text-sm text-gray-500">
                  Tax ID: {tenantBranding.companyTaxId}
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {translations.customer || 'Bill To'}
              </h3>
            </div>
            <div className="space-y-2">
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {translations.item || 'Item'}
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {translations.description || 'Description'}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  {translations.quantity || 'Qty'}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  {translations.unitPrice || 'Unit Price'}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  {translations.total || 'Total'}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {item.description || '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <div className="w-80 space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">
                {translations.subtotal || 'Subtotal'}:
              </span>
              <span className="font-medium">
                {formatCurrency(invoiceData.totals.subtotal)}
              </span>
            </div>
            
            {invoiceData.totals.vatTotal > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">
                  {translations.tax || 'VAT'}:
                </span>
                <span className="font-medium">
                  {formatCurrency(invoiceData.totals.vatTotal)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between py-3 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">
                {translations.grandTotal || 'Total'}:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(invoiceData.totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-8 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">
              {translations.thankYou || 'Thank you for your business!'}
            </span>
          </div>
          
          {tenantBranding.website && (
            <div className="text-gray-600 mb-4">
              {tenantBranding.website}
            </div>
          )}

          {onDownload && (
            <Button 
              onClick={onDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {translations.download || 'Download PDF'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
