/** @format */

export interface InvoiceData {
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
		discount_amount?: number;
		discount_rate?: number;
		exchange_rate?: number;
		reference_currency?: string;
		language?: string;
		bank_details?: string;
		swift_code?: string;
		iban?: string;
	};
	customer: {
		customer_name: string;
		customer_email?: string;
		customer_phone?: string;
		customer_tax_id?: string;
		customer_registration_number?: string;
		customer_street?: string;
		customer_street_number?: string;
		customer_city?: string;
		customer_country?: string;
		customer_postal_code?: string;
		customer_address?: string;
	};
	company: {
		company_name: string;
		company_email?: string;
		company_phone?: string;
		company_tax_id?: string;
		company_registration_number?: string;
		company_street?: string;
		company_street_number?: string;
		company_city?: string;
		company_country?: string;
		company_postal_code?: string;
		company_iban?: string;
		company_bank?: string;
		company_swift?: string;
		logo_url?: string;
		website?: string;
	};
	items: Array<{
		product_name: string;
		product_description?: string;
		product_sku?: string;
		product_category?: string;
		product_brand?: string;
		quantity: number;
		unit_of_measure?: string;
		unit_price: number;
		total: number;
		tax_rate?: number;
		tax_amount?: number;
		discount_rate?: number;
		discount_amount?: number;
		currency?: string;
		product_weight?: number;
		product_dimensions?: string;
	}>;
	totals: {
		subtotal: number;
		taxTotal: number;
		grandTotal: number;
		discountAmount?: number;
		discountRate?: number;
		shippingCost?: number;
		lateFee?: number;
		currency: string;
	};
	translations: Record<string, string>;
}

export class InvoiceTemplate {
	/**
	 * Generate unified HTML template for both preview and PDF
	 */
	static generateHTML(data: InvoiceData): string {
		const formatCurrency = (amount: number, currency = data.totals.currency || 'USD') => {
			if (isNaN(amount) || amount === null || amount === undefined) {
				return '$0.00';
			}
			
			return new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: currency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(amount);
		};

		const formatDate = (dateString: string) => {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		};

		const formatNumber = (num: number, decimals = 2) => {
			return new Intl.NumberFormat('en-US', {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			}).format(num);
		};

		const currency = data.totals.currency || 'USD';
		const t = data.translations;

		return `
<!DOCTYPE html>
<html lang="${data.invoice.language || 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t.invoice || 'Invoice'} ${data.invoice.invoice_number}</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8f9fa;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
      min-height: 1123px; /* A4 height in pixels at 96 DPI */
    }
    
    .invoice-header {
      padding: 40px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .company-info h1 {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .company-details {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h2 {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .invoice-details {
      font-size: 14px;
      color: #6b7280;
    }
    
    .invoice-details p {
      margin-bottom: 4px;
    }
    
    .billing-section {
      padding: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .billing-block h3 {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .billing-block p {
      font-size: 14px;
      color: #4b5563;
      margin-bottom: 4px;
    }
    
    .billing-block .name {
      font-weight: 600;
      color: #1f2937;
      font-size: 16px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 40px 0;
    }
    
    .items-table th {
      background-color: #f9fafb;
      padding: 16px 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      font-size: 14px;
    }
    
    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }
    
    .items-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 14px;
      color: #4b5563;
    }
    
    .items-table tr:nth-child(even) {
      background-color: #fafbfc;
    }
    
    .product-name {
      font-weight: 500;
      color: #1f2937;
    }
    
    .product-description {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .totals-section {
      padding: 0 40px 40px;
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-container {
      width: 300px;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .total-line.subtotal {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 8px;
    }
    
    .total-line.grand-total {
      border-top: 2px solid #1f2937;
      padding-top: 16px;
      margin-top: 16px;
      font-weight: bold;
      font-size: 16px;
      color: #1f2937;
    }
    
    .total-label {
      color: #6b7280;
    }
    
    .total-amount {
      font-weight: 500;
      color: #1f2937;
    }
    
    .footer-section {
      padding: 40px;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }
    
    .payment-terms {
      margin-bottom: 20px;
    }
    
    .payment-terms h4 {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .payment-terms p {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .bank-details {
      margin-bottom: 20px;
    }
    
    .bank-details h4 {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .bank-details p {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .footer-notes {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .logo {
      max-height: 60px;
      max-width: 200px;
      object-fit: contain;
    }
    
    /* Print styles */
    @media print {
      body {
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .invoice-container {
        box-shadow: none;
        border: none;
        margin: 0;
        max-width: none;
        width: 100%;
      }
      
      .invoice-header,
      .billing-section,
      .totals-section,
      .footer-section {
        padding: 20px;
      }
      
      .items-table {
        page-break-inside: avoid;
      }
      
      .items-table tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .totals-section {
        page-break-inside: avoid;
      }
    }
    
    /* Page break handling */
    .page-break {
      page-break-before: always;
    }
    
    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        ${data.company.logo_url ? `<img src="${data.company.logo_url}" alt="Logo" class="logo" />` : ''}
        <h1>${data.company.company_name}</h1>
        <div class="company-details">
          ${data.company.company_street ? `<p>${data.company.company_street} ${data.company.company_street_number || ''}</p>` : ''}
          ${data.company.company_city ? `<p>${data.company.company_city}, ${data.company.company_country || ''} ${data.company.company_postal_code || ''}</p>` : ''}
          ${data.company.company_tax_id ? `<p><strong>${t.taxId || 'Tax ID'}:</strong> ${data.company.company_tax_id}</p>` : ''}
          ${data.company.company_registration_number ? `<p><strong>${t.registrationNumber || 'Reg. No.'}:</strong> ${data.company.company_registration_number}</p>` : ''}
          ${data.company.company_email ? `<p><strong>${t.email || 'Email'}:</strong> ${data.company.company_email}</p>` : ''}
          ${data.company.company_phone ? `<p><strong>${t.phone || 'Phone'}:</strong> ${data.company.company_phone}</p>` : ''}
          ${data.company.website ? `<p><strong>${t.website || 'Website'}:</strong> ${data.company.website}</p>` : ''}
        </div>
      </div>
      
      <div class="invoice-title">
        <h2>${t.invoice || 'INVOICE'}</h2>
        <div class="invoice-details">
          <p><strong>${t.invoiceNumber || 'Invoice #'}:</strong> ${data.invoice.invoice_series ? `${data.invoice.invoice_series}-` : ''}${data.invoice.invoice_number}</p>
          <p><strong>${t.date || 'Date'}:</strong> ${formatDate(data.invoice.date)}</p>
          ${data.invoice.due_date ? `<p><strong>${t.dueDate || 'Due Date'}:</strong> ${formatDate(data.invoice.due_date)}</p>` : ''}
          <p><strong>${t.status || 'Status'}:</strong> ${data.invoice.status}</p>
          ${data.invoice.payment_terms ? `<p><strong>${t.paymentTerms || 'Payment Terms'}:</strong> ${data.invoice.payment_terms}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Billing Information -->
    <div class="billing-section">
      <div class="billing-block">
        <h3>${t.from || 'From'}</h3>
        <p class="name">${data.company.company_name}</p>
        ${data.company.company_email ? `<p>${data.company.company_email}</p>` : ''}
        ${data.company.company_phone ? `<p>${data.company.company_phone}</p>` : ''}
      </div>
      
      <div class="billing-block">
        <h3>${t.billTo || 'Bill To'}</h3>
        <p class="name">${data.customer.customer_name}</p>
        ${data.customer.customer_tax_id ? `<p><strong>${t.taxId || 'Tax ID'}:</strong> ${data.customer.customer_tax_id}</p>` : ''}
        ${data.customer.customer_registration_number ? `<p><strong>${t.registrationNumber || 'Reg. No.'}:</strong> ${data.customer.customer_registration_number}</p>` : ''}
        ${data.customer.customer_street ? `<p>${data.customer.customer_street} ${data.customer.customer_street_number || ''}</p>` : ''}
        ${data.customer.customer_city ? `<p>${data.customer.customer_city}, ${data.customer.customer_country || ''} ${data.customer.customer_postal_code || ''}</p>` : ''}
        ${data.customer.customer_email ? `<p>${data.customer.customer_email}</p>` : ''}
        ${data.customer.customer_phone ? `<p>${data.customer.customer_phone}</p>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <div style="padding: 0 40px;">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 25%;">${t.item || 'Item'}</th>
            <th style="width: 10%;">${t.sku || 'SKU'}</th>
            <th style="width: 8%;">${t.quantity || 'Qty'}</th>
            <th style="width: 7%;">${t.unit || 'Unit'}</th>
            <th style="width: 12%;">${t.unitPrice || 'Unit Price'}</th>
            <th style="width: 6%;">${t.currency || 'Curr.'}</th>
            <th style="width: 8%;">${t.taxRate || 'Tax %'}</th>
            <th style="width: 12%;">${t.taxAmount || 'Tax Amt'}</th>
            <th style="width: 12%;">${t.total || 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => {
            const itemTotal = item.total || 0;
            const taxRate = item.tax_rate || 0;
            const taxAmount = item.tax_amount || (itemTotal * taxRate / 100);
            const totalWithTax = itemTotal + taxAmount;
            
            return `
            <tr>
              <td>
                <div class="product-name">${item.product_name || 'N/A'}</div>
                ${item.product_description ? `<div class="product-description">${item.product_description}</div>` : ''}
              </td>
              <td>${item.product_sku || '-'}</td>
              <td style="text-align: center;">${formatNumber(item.quantity, 2)}</td>
              <td style="text-align: center;">${item.unit_of_measure || 'pcs'}</td>
              <td style="text-align: right;">${formatCurrency(item.unit_price, item.currency || currency)}</td>
              <td style="text-align: center; font-weight: 600;">${item.currency || currency}</td>
              <td style="text-align: center;">${formatNumber(taxRate, 1)}%</td>
              <td style="text-align: right;">${formatCurrency(taxAmount, item.currency || currency)}</td>
              <td style="text-align: right; font-weight: 600;">${formatCurrency(totalWithTax, item.currency || currency)}</td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-container">
        <div class="total-line subtotal">
          <span class="total-label">${t.subtotal || 'Subtotal'}:</span>
          <span class="total-amount">${formatCurrency(data.totals.subtotal, currency)}</span>
        </div>
        
        ${(data.totals.discountAmount || 0) > 0 ? `
        <div class="total-line">
          <span class="total-label">${t.discount || 'Discount'} ${data.totals.discountRate ? `(${formatNumber(data.totals.discountRate, 1)}%)` : ''}:</span>
          <span class="total-amount" style="color: #dc2626;">-${formatCurrency(data.totals.discountAmount || 0, currency)}</span>
        </div>` : ''}
        
        ${(data.totals.shippingCost || 0) > 0 ? `
        <div class="total-line">
          <span class="total-label">${t.shipping || 'Shipping'}:</span>
          <span class="total-amount">${formatCurrency(data.totals.shippingCost || 0, currency)}</span>
        </div>` : ''}
        
        ${(data.totals.taxTotal || 0) > 0 ? `
        <div class="total-line">
          <span class="total-label">${t.tax || 'Tax'}:</span>
          <span class="total-amount">${formatCurrency(data.totals.taxTotal, currency)}</span>
        </div>` : ''}
        
        ${(data.totals.lateFee || 0) > 0 ? `
        <div class="total-line">
          <span class="total-label">${t.lateFee || 'Late Fee'}:</span>
          <span class="total-amount">${formatCurrency(data.totals.lateFee || 0, currency)}</span>
        </div>` : ''}
        
        <div class="total-line grand-total">
          <span class="total-label">${t.grandTotal || 'Grand Total'}:</span>
          <span class="total-amount">${formatCurrency(data.totals.grandTotal, currency)}</span>
        </div>
        
        ${data.invoice.exchange_rate && data.invoice.reference_currency ? `
        <div class="total-line" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <span class="total-label" style="font-size: 12px; color: #6b7280;">${t.exchangeRate || 'Exchange Rate'}:</span>
          <span class="total-amount" style="font-size: 12px; color: #6b7280;">1 ${data.invoice.reference_currency} = ${formatNumber(data.invoice.exchange_rate, 4)} ${currency}</span>
        </div>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-section">
      ${data.invoice.payment_method ? `
      <div class="payment-terms">
        <h4>${t.paymentMethod || 'Payment Method'}</h4>
        <p>${data.invoice.payment_method}</p>
      </div>` : ''}
      
      ${data.company.company_iban || data.company.company_bank ? `
      <div class="bank-details">
        <h4>${t.bankDetails || 'Bank Details'}</h4>
        ${data.company.company_bank ? `<p><strong>${t.bank || 'Bank'}:</strong> ${data.company.company_bank}</p>` : ''}
        ${data.company.company_iban ? `<p><strong>${t.iban || 'IBAN'}:</strong> ${data.company.company_iban}</p>` : ''}
        ${data.company.company_swift ? `<p><strong>${t.swift || 'SWIFT'}:</strong> ${data.company.company_swift}</p>` : ''}
      </div>` : ''}
      
      ${data.invoice.notes ? `
      <div class="payment-terms">
        <h4>${t.notes || 'Notes'}</h4>
        <p>${data.invoice.notes}</p>
      </div>` : ''}
      
      <div class="footer-notes">
        <p>${t.thankYou || 'Thank you for your business!'}</p>
        ${data.company.website ? `<p>${data.company.website}</p>` : ''}
        ${data.company.company_email ? `<p>${data.company.company_email}</p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
	}
}
