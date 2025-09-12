/** @format */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InvoiceTemplate, InvoiceData as TemplateInvoiceData } from '@/lib/invoice-template';
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
    payment_method?: string;
    base_currency?: string;
    notes?: string;
    late_fee?: number;
    shipping_cost?: number;
    exchange_rate?: number;
    reference_currency?: string;
    language?: string;
    bank_details?: string;
    swift_code?: string;
    iban?: string;
  };
  customer: {
    customer_name: string;
    customer_address?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_tax_id?: string;
    customer_registration_number?: string;
    customer_street?: string;
    customer_street_number?: string;
    customer_city?: string;
    customer_country?: string;
    customer_postal_code?: string;
  };
  items: Array<{
    product_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total: number;
    vat_rate?: number;
    tax_rate?: number;
    tax_amount?: number;
    discount_rate?: number;
    discount_amount?: number;
    currency?: string;
    unit_of_measure?: string;
    unit?: string;
    product_unit?: string;
    product_sku?: string;
    product_category?: string;
    product_brand?: string;
    product_weight?: number;
    product_dimensions?: string;
  }>;
  totals: {
    subtotal: number;
    vatTotal: number;
    grandTotal: number;
    discountAmount?: number;
    discountRate?: number;
    shippingCost?: number;
    lateFee?: number;
    currency?: string;
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
  companySwift?: string;
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
  // Transform data to template format
  const templateData: TemplateInvoiceData = {
    invoice: {
      invoice_number: invoiceData.invoice.invoice_number,
      invoice_series: invoiceData.invoice.invoice_series,
      date: invoiceData.invoice.date,
      due_date: invoiceData.invoice.due_date,
      status: invoiceData.invoice.status,
      total_amount: invoiceData.invoice.total_amount,
      payment_terms: invoiceData.invoice.payment_terms,
      payment_method: invoiceData.invoice.payment_method,
      base_currency: invoiceData.invoice.base_currency,
      notes: invoiceData.invoice.notes,
      late_fee: invoiceData.invoice.late_fee,
      shipping_cost: invoiceData.invoice.shipping_cost,
      discount_amount: invoiceData.totals.discountAmount,
      discount_rate: invoiceData.totals.discountRate,
      exchange_rate: invoiceData.invoice.exchange_rate,
      reference_currency: invoiceData.invoice.reference_currency,
      language: invoiceData.invoice.language,
      bank_details: invoiceData.invoice.bank_details,
      swift_code: invoiceData.invoice.swift_code,
      iban: invoiceData.invoice.iban,
    },
    customer: {
      customer_name: invoiceData.customer.customer_name,
      customer_email: invoiceData.customer.customer_email,
      customer_phone: invoiceData.customer.customer_phone,
      customer_tax_id: invoiceData.customer.customer_tax_id,
      customer_registration_number: invoiceData.customer.customer_registration_number,
      customer_street: invoiceData.customer.customer_street,
      customer_street_number: invoiceData.customer.customer_street_number,
      customer_city: invoiceData.customer.customer_city,
      customer_country: invoiceData.customer.customer_country,
      customer_postal_code: invoiceData.customer.customer_postal_code,
      customer_address: invoiceData.customer.customer_address,
    },
    company: {
      company_name: tenantBranding.name,
      company_email: tenantBranding.companyEmail,
      company_phone: tenantBranding.phone,
      company_tax_id: tenantBranding.companyTaxId,
      company_registration_number: tenantBranding.registrationNumber,
      company_street: tenantBranding.companyStreet,
      company_street_number: tenantBranding.companyStreetNumber,
      company_city: tenantBranding.companyCity,
      company_country: tenantBranding.companyCountry,
      company_postal_code: tenantBranding.companyPostalCode,
      company_iban: tenantBranding.companyIban,
      company_bank: tenantBranding.companyBank,
      company_swift: tenantBranding.companySwift,
      logo_url: tenantBranding.logoUrl,
      website: tenantBranding.website,
    },
    items: invoiceData.items.map(item => ({
      product_name: item.product_name,
      product_description: item.description,
      product_sku: item.product_sku,
      product_category: item.product_category,
      product_brand: item.product_brand,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure || item.unit || item.product_unit,
      unit_price: item.unit_price,
      total: item.total,
      tax_rate: item.vat_rate || item.tax_rate,
      tax_amount: item.tax_amount,
      discount_rate: item.discount_rate,
      discount_amount: item.discount_amount,
      currency: item.currency,
      product_weight: item.product_weight,
      product_dimensions: item.product_dimensions,
    })),
    totals: {
      subtotal: invoiceData.totals.subtotal,
      taxTotal: invoiceData.totals.vatTotal,
      grandTotal: invoiceData.totals.grandTotal,
      discountAmount: invoiceData.totals.discountAmount,
      discountRate: invoiceData.totals.discountRate,
      shippingCost: invoiceData.totals.shippingCost,
      lateFee: invoiceData.totals.lateFee,
      currency: invoiceData.totals.currency || invoiceData.invoice.base_currency || 'USD',
    },
    translations,
  };

  // Generate HTML using unified template
  const htmlContent = InvoiceTemplate.generateHTML(templateData);

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
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ 
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      />
    </div>
  );
}