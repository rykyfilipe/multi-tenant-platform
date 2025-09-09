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
      className="bg-white shadow-2xl border border-gray-200"
      style={{ 
        width: `${zoom}%`,
        maxWidth: '100%',
        transition: 'width 0.3s ease',
        minHeight: 'calc(100vh - 200px)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Invoice Header */}
      <div className="border-b-2 border-gray-300 p-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {tenantBranding.name?.charAt(0) || 'C'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {tenantBranding.name || 'Company Name'}
                </h1>
                <p className="text-sm text-gray-600">Private Limited</p>
              </div>
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
                <div className="text-gray-600">
                  Tax ID: {tenantBranding.companyTaxId}
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
                  {translations.tax || 'Tax VAT 18%'}:
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(invoiceData.totals.vatTotal)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-700 font-semibold">
                Discount 10%:
              </span>
              <span className="font-medium text-red-600">
                -{formatCurrency(invoiceData.totals.subtotal * 0.1)}
              </span>
            </div>
            
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

      {/* Footer */}
      <div className="p-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side - Payment and Contact */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Method:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Payment: Visa, Master Card</div>
                <div>We accept Cheque</div>
                <div>Paypal: {tenantBranding.companyEmail || 'paypal@company.com'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{tenantBranding.address || '123 Street, Town Postal, County'}</div>
                <div>{tenantBranding.phone || '+999 123 456 789'}</div>
                <div>{tenantBranding.companyEmail || 'info@yourname'}</div>
                <div>{tenantBranding.website || 'www.domainname.com'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Terms & Condition:</h4>
              <div className="text-sm text-gray-600">
                Contrary to popular belief Lorem Ipsum not ipsum simply lorem ispum dolor ipsum.
              </div>
            </div>
          </div>

          {/* Right side - Signature and Download */}
          <div className="flex flex-col items-end justify-end">
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Signature:</div>
              <div className="w-32 h-16 border-b-2 border-gray-400 mb-2"></div>
              <div className="text-sm font-semibold text-gray-900">Manager</div>
            </div>
            
            {onDownload && (
              <Button 
                onClick={onDownload}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2"
              >
                <Download className="w-4 h-4 mr-2" />
                {translations.download || 'Download PDF'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

