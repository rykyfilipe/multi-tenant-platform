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
		customer_type?: string;
		customer_email?: string;
		customer_phone?: string;
		customer_cnp?: string;
		customer_cui?: string;
		customer_company_registration_number?: string;
		customer_tax_id?: string;
		customer_registration_number?: string;
		customer_vat_number?: string;
		customer_street?: string;
		customer_street_number?: string;
		customer_city?: string;
		customer_country?: string;
		customer_postal_code?: string;
		customer_address?: string;
		customer_bank_account?: string;
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
		totalInItemCurrency?: number;
		conversionRate?: number;
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
		vatRate?: number;
	};
	translations: Record<string, string>;
}

export class InvoiceTemplate {
	/**
	 * Get status badge color based on invoice status
	 */
	private static getStatusColor(status: string): { bg: string; text: string; border: string } {
		const normalizedStatus = status.toLowerCase();
		
		if (normalizedStatus.includes('paid') || normalizedStatus.includes('completed')) {
			return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
		}
		if (normalizedStatus.includes('pending') || normalizedStatus.includes('sent')) {
			return { bg: '#fef3c7', text: '#92400e', border: '#fde047' };
		}
		if (normalizedStatus.includes('overdue') || normalizedStatus.includes('late')) {
			return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
		}
		if (normalizedStatus.includes('draft')) {
			return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
		}
		if (normalizedStatus.includes('cancelled') || normalizedStatus.includes('void')) {
			return { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
		}
		
		// Default
		return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
	}

	/**
	 * Generate HTML template matching the design from the image
	 */
	static generateHTML(data: InvoiceData): string {
		// Debug logging
		console.log('📄 INVOICE TEMPLATE DEBUG:', {
			items: data.items.map(item => ({
				name: item.product_name,
				price: item.unit_price,
				quantity: item.quantity,
				currency: item.currency,
				total: item.total,
				totalInItemCurrency: item.totalInItemCurrency,
			})),
			totals: data.totals,
		});
		
		const formatCurrency = (amount: number, currency = data.totals.currency || 'USD') => {
			if (isNaN(amount) || amount === null || amount === undefined) {
				console.warn('⚠️ Invalid amount for formatting:', { amount, currency });
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

		const currency = data.totals.currency || 'USD';
		const t = data.translations;

		return `
<!DOCTYPE html>
<html lang="${data.invoice.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoice.invoice_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      padding: 15px;
      line-height: 1.3;
      color: #333;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #000;
    }
    
    .company-section {
      flex: 1;
    }
    
    .company-name {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      margin-bottom: 4px;
    }
    
    .company-info {
      font-size: 11px;
      color: #666;
      margin-bottom: 6px;
    }
    
    .company-info span {
      margin-right: 12px;
    }
    
    .company-address {
      font-size: 11px;
      color: #666;
      line-height: 1.4;
      margin-bottom: 6px;
    }
    
    .company-address p {
      margin: 0;
    }
    
    .company-contact {
      font-size: 11px;
      color: #666;
    }
    
    .company-contact span {
      margin-right: 12px;
    }
    
    .invoice-header-right {
      text-align: right;
    }
    
    .invoice-title {
      font-size: 32px;
      font-weight: 900;
      color: #000;
      margin-bottom: 8px;
      letter-spacing: -1px;
    }
    
    .invoice-meta {
      font-size: 11px;
      color: #666;
      line-height: 1.5;
    }
    
    .invoice-meta p {
      margin: 2px 0;
    }
    
    .customer-section {
      margin-bottom: 20px;
    }
    
    .invoice-to {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-weight: 600;
    }
    
    .customer-name {
      font-size: 14px;
      font-weight: 700;
      color: #000;
      margin-bottom: 3px;
    }
    
    .customer-title {
      font-size: 10px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    
    .customer-address {
      font-size: 11px;
      color: #666;
      line-height: 1.5;
    }
    
    .customer-address p {
      margin: 2px 0;
    }
    
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .services-table th {
      background-color: #000;
      color: #fff;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .services-table td {
      padding: 8px 6px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
    }
    
    .services-table tr:last-child td {
      border-bottom: 2px solid #000;
    }
    
    .item-number {
      width: 35px;
      text-align: center;
      font-weight: 600;
      color: #666;
    }
    
    .item-name {
      font-weight: 600;
      color: #000;
      font-size: 12px;
    }
    
    .item-description {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
      line-height: 1.3;
    }
    
    .item-sku {
      font-size: 9px;
      color: #999;
      margin-top: 1px;
      font-style: italic;
    }
    
    .amount-column {
      text-align: right;
      font-weight: 700;
      color: #000;
    }
    
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }
    
    .summary-table {
      width: 220px;
      border-collapse: collapse;
    }
    
    .summary-table td {
      padding: 5px 0;
      font-size: 11px;
    }
    
    .summary-table .summary-label {
      text-align: right;
      padding-right: 15px;
      color: #666;
    }
    
    .summary-table .summary-value {
      text-align: right;
      font-weight: 600;
      color: #000;
    }
    
    .grand-total {
      border-top: 2px solid #000;
      padding-top: 6px;
      margin-top: 6px;
    }
    
    .grand-total .summary-label {
      font-size: 13px;
      font-weight: 700;
    }
    
    .grand-total .summary-value {
      font-size: 15px;
      font-weight: 700;
    }
    
    .payment-contact-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }
    
    .payment-method h3,
    .contact-info h3 {
      font-size: 11px;
      font-weight: 700;
      color: #000;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .payment-method p,
    .contact-info p {
      font-size: 10px;
      color: #666;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .contact-icon {
      margin-right: 6px;
      font-size: 12px;
    }
    
    .footer {
      text-align: center;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer-message {
      font-size: 11px;
      font-weight: 600;
      color: #000;
      margin-bottom: 3px;
    }
    
    .footer-subtitle {
      font-size: 10px;
      color: #666;
    }
    
    .signature-section {
      text-align: right;
      margin-top: 20px;
    }
    
    .signature-line {
      width: 120px;
      height: 1px;
      background-color: #000;
      margin-bottom: 6px;
      margin-left: auto;
    }
    
    .signature-name {
      font-size: 11px;
      font-weight: 600;
      color: #000;
    }
    
    .signature-title {
      font-size: 10px;
      color: #666;
    }
    
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    
    <!-- Header -->
    <div class="header">
      <div class="company-section">
        <h2 class="company-name">${data.company.company_name || 'Company Name'}</h2>
        <div class="company-info">
          ${data.company.company_tax_id ? `<span>CUI: ${data.company.company_tax_id}</span>` : ''}
          ${data.company.company_registration_number ? `<span>Nr. Reg: ${data.company.company_registration_number}</span>` : ''}
        </div>
        <div class="company-address">
          ${data.company.company_street && data.company.company_street_number ? `<p>${data.company.company_street} ${data.company.company_street_number}</p>` : ''}
          ${data.company.company_city && data.company.company_postal_code ? `<p>${data.company.company_city}, ${data.company.company_postal_code}, ${data.company.company_country || ''}</p>` : ''}
        </div>
        <div class="company-contact">
          ${data.company.company_phone ? `<span>Tel: ${data.company.company_phone}</span>` : ''}
          ${data.company.company_email ? `<span>Email: ${data.company.company_email}</span>` : ''}
        </div>
      </div>
      
      <div class="invoice-header-right">
        <h1 class="invoice-title">INVOICE</h1>
        <div class="invoice-meta">
          <p><strong>No:</strong> ${data.invoice.invoice_series ? data.invoice.invoice_series + '-' : ''}${data.invoice.invoice_number}</p>
          <p><strong>Date:</strong> ${formatDate(data.invoice.date)}</p>
          ${data.invoice.due_date ? `<p><strong>Due:</strong> ${formatDate(data.invoice.due_date)}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Customer Information -->
    <div class="customer-section">
      <div class="invoice-to">Invoice to:</div>
      <div class="customer-name">${data.customer.customer_name}</div>
      ${data.customer.customer_type ? `<div class="customer-title">${data.customer.customer_type}</div>` : ''}
      <div class="customer-address">
        ${data.customer.customer_type === 'Persoană fizică' && data.customer.customer_cnp ? `<p>CNP: ${data.customer.customer_cnp}</p>` : ''}
        ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_cui ? `<p>CUI: ${data.customer.customer_cui} ${data.customer.customer_company_registration_number ? `• Nr. Reg: ${data.customer.customer_company_registration_number}` : ''} ${data.customer.customer_vat_number ? `• Nr. TVA: ${data.customer.customer_vat_number}` : ''}</p>` : ''}
        ${data.customer.customer_street && data.customer.customer_street_number ? `<p>${data.customer.customer_street} ${data.customer.customer_street_number}, ${data.customer.customer_city || ''} ${data.customer.customer_postal_code || ''}</p>` : ''}
        ${data.customer.customer_country ? `<p>${data.customer.customer_country}</p>` : ''}
        ${data.customer.customer_email || data.customer.customer_phone ? `<p>${data.customer.customer_email || ''} ${data.customer.customer_email && data.customer.customer_phone ? '•' : ''} ${data.customer.customer_phone || ''}</p>` : ''}
      </div>
    </div>

    <!-- Services Table -->
    <table class="services-table">
      <thead>
        <tr>
          <th class="item-number">#</th>
          <th>NAME DESCRIPTION</th>
          <th style="text-align: right;">PRICE</th>
          <th style="text-align: right;">QUANTITY</th>
          <th style="text-align: right;">UNIT</th>
          <th style="text-align: right;">CURRENCY</th>
          <th style="text-align: right;">VAT %</th>
          <th style="text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, index) => {
          const itemCurrency = item.currency || currency;
          const baseCurrency = currency;
          const needsConversion = itemCurrency !== baseCurrency;
          
          return `
          <tr>
            <td class="item-number">${String(index + 1).padStart(2, '0')}</td>
            <td class="item-name">
              ${item.product_name}
              ${item.product_description ? `<div class="item-description">${item.product_description}</div>` : ''}
              ${item.product_sku ? `<div class="item-sku">SKU: ${item.product_sku}</div>` : ''}
            </td>
            <td style="text-align: right;">${formatCurrency(item.unit_price, itemCurrency)}</td>
            <td style="text-align: right;">${item.quantity}</td>
            <td style="text-align: right;">${item.unit_of_measure || 'pcs'}</td>
            <td style="text-align: right;">${itemCurrency}</td>
            <td style="text-align: right;">${item.tax_rate || 0}%</td>
            <td class="amount-column">
              ${formatCurrency(item.total, baseCurrency)}
              ${needsConversion && item.totalInItemCurrency ? `<div class="item-description">(${formatCurrency(item.totalInItemCurrency, itemCurrency)})</div>` : ''}
            </td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary-section">
      <table class="summary-table">
        <tr>
          <td class="summary-label">Subtotal:</td>
          <td class="summary-value">${formatCurrency(data.totals.subtotal, currency)}</td>
        </tr>
        ${data.totals.taxTotal > 0 ? `
        <tr>
          <td class="summary-label">VAT:</td>
          <td class="summary-value">${formatCurrency(data.totals.taxTotal, currency)}</td>
        </tr>
        ` : ''}
        ${(data.totals.discountAmount || 0) > 0 ? `
        <tr>
          <td class="summary-label">Discount:</td>
          <td class="summary-value">-${formatCurrency(data.totals.discountAmount || 0, currency)}</td>
        </tr>
        ` : ''}
        ${(data.totals.shippingCost || 0) > 0 ? `
        <tr>
          <td class="summary-label">Shipping:</td>
          <td class="summary-value">${formatCurrency(data.totals.shippingCost || 0, currency)}</td>
        </tr>
        ` : ''}
        ${(data.totals.lateFee || 0) > 0 ? `
        <tr>
          <td class="summary-label">Late Fee:</td>
          <td class="summary-value">${formatCurrency(data.totals.lateFee || 0, currency)}</td>
        </tr>
        ` : ''}
        <tr class="grand-total">
          <td class="summary-label">TOTAL:</td>
          <td class="summary-value">${formatCurrency(data.totals.grandTotal, currency)}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Method and Contact -->
    <div class="payment-contact-section">
      <div class="payment-method">
        <h3>Payment Information</h3>
        ${data.company.company_iban ? `<p><strong>IBAN:</strong> ${data.company.company_iban}</p>` : ''}
        ${data.company.company_swift ? `<p><strong>SWIFT:</strong> ${data.company.company_swift}</p>` : ''}
        ${data.company.company_bank ? `<p><strong>Bank:</strong> ${data.company.company_bank}</p>` : ''}
        ${data.company.company_name ? `<p><strong>Account Name:</strong> ${data.company.company_name}</p>` : ''}
        ${data.invoice.payment_method ? `<p><strong>Payment Method:</strong> ${data.invoice.payment_method}</p>` : ''}
        ${data.invoice.payment_terms ? `<p><strong>Payment Terms:</strong> ${data.invoice.payment_terms}</p>` : ''}
      </div>
      
      <div class="contact-info">
        <h3>Contact Information</h3>
        ${data.company.company_phone ? `
          <div class="contact-item">
            <span class="contact-icon">📞</span>
            <span>${data.company.company_phone}</span>
          </div>
        ` : ''}
        ${data.company.company_email ? `
          <div class="contact-item">
            <span class="contact-icon">✉️</span>
            <span>${data.company.company_email}</span>
          </div>
        ` : ''}
        ${data.company.website ? `
          <div class="contact-item">
            <span class="contact-icon">🌐</span>
            <span>${data.company.website}</span>
          </div>
        ` : ''}
        ${data.company.company_street && data.company.company_street_number ? `
          <div class="contact-item">
            <span class="contact-icon">📍</span>
            <span>${data.company.company_street} ${data.company.company_street_number}</span>
          </div>
        ` : ''}
        ${data.company.company_city && data.company.company_postal_code ? `<p>${data.company.company_city}, ${data.company.company_postal_code}</p>` : ''}
        ${data.company.company_country ? `<p>${data.company.company_country}</p>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-message">Thank You For Our Business.</div>
      <div class="footer-subtitle">We make it easy for your problems</div>
    </div>

    <!-- Signature -->
    <div class="signature-section">
      <div class="signature-line"></div>
      <div class="signature-name">${data.company.company_name || 'Company Name'}</div>
      <div class="signature-title">Director</div>
    </div>

  </div>
</body>
</html>`;
	}

	/**
	 * Format currency with proper symbol
	 */
	private static formatCurrency(amount: number, currency = 'USD'): string {
		if (isNaN(amount) || amount === null || amount === undefined) {
			return '$0.00';
		}
		
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	}
}
