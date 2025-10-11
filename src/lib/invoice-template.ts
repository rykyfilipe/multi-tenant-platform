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
      padding: 20px;
      line-height: 1.4;
      color: #333;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .invoice-title {
      font-size: 42px;
      font-weight: 900;
      color: #000;
      margin-bottom: 15px;
      letter-spacing: -1px;
    }
    
    .invoice-details {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .invoice-details p {
      margin-bottom: 5px;
    }
    
    .logo-section {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .logo-circle {
      width: 50px;
      height: 50px;
      background-color: #000;
      border-radius: 50%;
      margin-bottom: 10px;
    }
    
    .company-name {
      font-size: 18px;
      font-weight: 600;
      color: #000;
      margin-bottom: 15px;
    }
    
    .total-due {
      text-align: right;
    }
    
    .total-due-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .total-due-amount {
      font-size: 24px;
      font-weight: 700;
      color: #000;
    }
    
    .customer-section {
      margin-bottom: 40px;
    }
    
    .invoice-to {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .customer-name {
      font-size: 18px;
      font-weight: 600;
      color: #000;
      margin-bottom: 5px;
    }
    
    .customer-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 15px;
    }
    
    .customer-address {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      max-width: 300px;
    }
    
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .services-table th {
      background-color: #f8f8f8;
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      color: #333;
      font-size: 14px;
      border-bottom: 1px solid #ddd;
    }
    
    .services-table td {
      padding: 15px 10px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 14px;
    }
    
    .services-table tr:hover {
      background-color: #f9f9f9;
    }
    
    .item-number {
      width: 50px;
      text-align: center;
      font-weight: 600;
    }
    
    .item-name {
      font-weight: 600;
      color: #000;
    }
    
    .item-description {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    
    .amount-column {
      text-align: right;
      font-weight: 600;
    }
    
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    
    .summary-table {
      width: 250px;
      border-collapse: collapse;
    }
    
    .summary-table td {
      padding: 8px 0;
      font-size: 14px;
    }
    
    .summary-table .summary-label {
      text-align: right;
      padding-right: 20px;
      color: #666;
    }
    
    .summary-table .summary-value {
      text-align: right;
      font-weight: 600;
      color: #000;
    }
    
    .grand-total {
      border-top: 2px solid #000;
      padding-top: 10px;
      margin-top: 10px;
    }
    
    .grand-total .summary-label {
      font-size: 16px;
      font-weight: 700;
    }
    
    .grand-total .summary-value {
      font-size: 18px;
      font-weight: 700;
    }
    
    .payment-contact-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .payment-method h3,
    .contact-info h3 {
      font-size: 14px;
      font-weight: 600;
      color: #000;
      margin-bottom: 15px;
    }
    
    .payment-method p,
    .contact-info p {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .contact-icon {
      margin-right: 10px;
      font-size: 14px;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
    }
    
    .footer-message {
      font-size: 14px;
      font-weight: 600;
      color: #000;
      margin-bottom: 5px;
    }
    
    .footer-subtitle {
      font-size: 12px;
      color: #666;
    }
    
    .signature-section {
      text-align: right;
      margin-top: 40px;
    }
    
    .signature-line {
      width: 150px;
      height: 2px;
      background-color: #000;
      margin-bottom: 10px;
      margin-left: auto;
    }
    
    .signature-name {
      font-size: 14px;
      font-weight: 600;
      color: #000;
    }
    
    .signature-title {
      font-size: 12px;
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
      <div class="invoice-info">
        <h1 class="invoice-title">INVOICE</h1>
        <div class="invoice-details">
          <p><strong>Invoice Date:</strong> ${formatDate(data.invoice.date)}</p>
          <p><strong>Invoice No:</strong> ${data.invoice.invoice_series ? data.invoice.invoice_series + '-' : ''}${data.invoice.invoice_number}</p>
        </div>
      </div>
      
      <div class="logo-section">
        <div class="logo-circle"></div>
        <div class="company-name">${data.company.company_name || 'Logo Company'}</div>
        <div class="total-due">
          <div class="total-due-label">Total Due :</div>
          <div class="total-due-amount">${formatCurrency(data.totals.grandTotal, currency)}</div>
        </div>
      </div>
    </div>

    <!-- Customer Information -->
    <div class="customer-section">
      <div class="invoice-to">Invoice to:</div>
      <div class="customer-name">${data.customer.customer_name}</div>
      ${data.customer.customer_type ? `<div class="customer-title">${data.customer.customer_type === 'Persoană fizică' ? 'Individual Customer' : 'Business Customer'}</div>` : ''}
      <div class="customer-address">
        ${data.customer.customer_type === 'Persoană fizică' && data.customer.customer_cnp ? `CNP: ${data.customer.customer_cnp}<br>` : ''}
        ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_cui ? `CUI: ${data.customer.customer_cui}<br>` : ''}
        ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_company_registration_number ? `Nr. Reg: ${data.customer.customer_company_registration_number}<br>` : ''}
        ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_vat_number ? `Nr. TVA: ${data.customer.customer_vat_number}<br>` : ''}
        ${data.customer.customer_street && data.customer.customer_street_number ? `${data.customer.customer_street} ${data.customer.customer_street_number}<br>` : ''}
        ${data.customer.customer_city && data.customer.customer_postal_code ? `${data.customer.customer_city}, ${data.customer.customer_postal_code}<br>` : ''}
        ${data.customer.customer_country || ''}
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
          <th style="text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, index) => `
          <tr>
            <td class="item-number">${String(index + 1).padStart(2, '0')}</td>
            <td class="item-name">
              ${item.product_name}
              ${item.product_description ? `<div class="item-description">${item.product_description}</div>` : ''}
            </td>
            <td style="text-align: right;">${formatCurrency(item.unit_price, currency)}</td>
            <td style="text-align: right;">${item.quantity}</td>
            <td class="amount-column">${formatCurrency(item.total, currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary-section">
      <table class="summary-table">
        <tr>
          <td class="summary-label">Sub Total:</td>
          <td class="summary-value">${formatCurrency(data.totals.subtotal, currency)}</td>
        </tr>
        ${data.totals.taxTotal > 0 ? `
        <tr>
          <td class="summary-label">Tax:</td>
          <td class="summary-value">${formatCurrency(data.totals.taxTotal, currency)}</td>
        </tr>
        ` : ''}
        ${(data.totals.discountAmount || 0) > 0 ? `
        <tr>
          <td class="summary-label">Discount:</td>
          <td class="summary-value">-${formatCurrency(data.totals.discountAmount || 0, currency)}</td>
        </tr>
        ` : ''}
        <tr class="grand-total">
          <td class="summary-label">GRAND TOTAL:</td>
          <td class="summary-value">${formatCurrency(data.totals.grandTotal, currency)}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Method and Contact -->
    <div class="payment-contact-section">
      <div class="payment-method">
        <h3>Payment Method</h3>
        ${data.company.company_iban ? `<p><strong>Account ID:</strong> ${data.company.company_iban}</p>` : ''}
        ${data.company.company_name ? `<p><strong>Account Name:</strong> ${data.company.company_name}</p>` : ''}
        ${data.invoice.payment_method ? `<p>${data.invoice.payment_method}</p>` : ''}
      </div>
      
      <div class="contact-info">
        <h3>Contact Information</h3>
        ${data.company.company_phone ? `
          <div class="contact-item">
            <span class="contact-icon">📞</span>
            <span>${data.company.company_phone}</span>
          </div>
        ` : ''}
        ${data.company.company_street && data.company.company_street_number ? `
          <div class="contact-item">
            <span class="contact-icon">📍</span>
            <span>${data.company.company_street} ${data.company.company_street_number}</span>
          </div>
        ` : ''}
        ${data.company.company_city ? `<p>${data.company.company_city}</p>` : ''}
        ${data.company.company_email ? `
          <div class="contact-item">
            <span class="contact-icon">✉️</span>
            <span>${data.company.company_email}</span>
          </div>
        ` : ''}
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
