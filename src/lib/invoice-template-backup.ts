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

		const formatNumber = (num: number, decimals = 2) => {
			return new Intl.NumberFormat('en-US', {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			}).format(num);
		};

		const currency = data.totals.currency || 'USD';
		const t = data.translations;
		const statusColors = this.getStatusColor(data.invoice.status);
		
		// Check if any item has SKU
		const hasAnySKU = data.items.some(item => item.product_sku);

		return `
<!DOCTYPE html>
<html lang="${data.invoice.language || 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${t.invoice || 'Invoice'} ${data.invoice.invoice_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    /* ========================================
       MODERN INVOICE TEMPLATE - PROFESSIONAL DESIGN
       ======================================== */
    
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .invoice-wrapper {
      padding: 24px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .invoice-container {
      max-width: 850px;
      width: 100%;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    
    /* Header with gradient accent */
    .invoice-header {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 32px;
      border-bottom: 3px solid hsl(var(--primary, 222.2 47.4% 11.2%));
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 32px;
      align-items: start;
    }
    
    .company-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .logo-container {
      margin-bottom: 8px;
    }
    
    .logo {
      max-height: 48px;
      max-width: 180px;
      object-fit: contain;
      display: block;
    }
    
    .company-info h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0;
    }
    
    .company-details {
      font-size: 13px;
      color: #64748b;
      line-height: 1.7;
    }
    
    .company-details p {
      margin: 2px 0;
    }
    
    .company-details strong {
      color: #475569;
      font-weight: 600;
    }
    
    .invoice-title-section {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .invoice-title-section h2 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
    }
    
    .title-accent {
      width: 4px;
      height: 24px;
      background: hsl(var(--primary, 222.2 47.4% 11.2%));
      border-radius: 2px;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1.5px solid;
      background-color: ${statusColors.bg};
      color: ${statusColors.text};
      border-color: ${statusColors.border};
      align-self: flex-end;
    }
    
    .invoice-meta {
      font-size: 13px;
      color: #64748b;
      line-height: 1.8;
      margin-top: 8px;
    }
    
    .invoice-meta p {
      margin: 2px 0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    
    .invoice-meta strong {
      color: #475569;
      font-weight: 600;
      min-width: 90px;
      text-align: right;
    }
    
    /* Billing Section - Modern Cards */
    .billing-section {
      padding: 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      background: #fafbfc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .billing-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .billing-card h3 {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .billing-card h3::before {
      content: '';
      width: 3px;
      height: 14px;
      background: hsl(var(--primary, 222.2 47.4% 11.2%));
      border-radius: 2px;
    }
    
    .billing-card .name {
      font-weight: 700;
      color: #0f172a;
      font-size: 16px;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    
    .billing-card p {
      font-size: 13px;
      color: #475569;
      margin: 3px 0;
      line-height: 1.6;
    }
    
    .billing-card strong {
      color: #64748b;
      font-weight: 600;
      font-size: 12px;
    }
    
    /* Modern Table Design */
    .table-section {
      padding: 32px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-variant-numeric: tabular-nums;
    }
    
    .items-table thead tr {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
    
    .items-table th {
      padding: 14px 12px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid hsl(var(--primary, 222.2 47.4% 11.2%));
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    
    .items-table th:first-child {
      border-top-left-radius: 8px;
      padding-left: 16px;
    }
    
    .items-table th:last-child {
      border-top-right-radius: 8px;
      text-align: right;
      padding-right: 16px;
    }
    
    .items-table td {
      padding: 16px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      color: #334155;
      vertical-align: top;
    }
    
    .items-table td:first-child {
      padding-left: 16px;
    }
    
    .items-table td:last-child {
      text-align: right;
      padding-right: 16px;
    }
    
    .items-table tbody tr {
      transition: background-color 0.15s ease;
    }
    
    .items-table tbody tr:hover {
      background-color: #fafbfc;
    }
    
    .items-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    .items-table tbody tr:nth-child(even):hover {
      background-color: #f1f5f9;
    }
    
    .product-name {
      font-weight: 600;
      color: #0f172a;
      line-height: 1.4;
    }
    
    .product-description {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.5;
    }
    
    .sku-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    
    /* Totals Section - Enhanced */
    .totals-section {
      padding: 24px 32px 32px;
      display: flex;
      justify-content: flex-end;
      background: white;
    }
    
    .totals-container {
      width: 100%;
      max-width: 380px;
      background: #fafbfc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      align-items: center;
    }
    
    .total-line.subtotal {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 8px;
    }
    
    .total-line.grand-total {
      border-top: 2px solid #0f172a;
      padding: 16px 0;
      margin-top: 12px;
      font-weight: 700;
      font-size: 18px;
      color: #0f172a;
      background: white;
      margin-left: -20px;
      margin-right: -20px;
      padding-left: 20px;
      padding-right: 20px;
      border-radius: 0 0 8px 8px;
    }
    
    .total-label {
      color: #64748b;
      font-weight: 500;
    }
    
    .total-amount {
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    
    .grand-total .total-amount {
      font-size: 20px;
      color: hsl(var(--primary, 222.2 47.4% 11.2%));
    }
    
    /* Footer Section - Professional */
    .footer-section {
      padding: 32px;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    .footer-block {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .footer-block h4 {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    
    .footer-block p {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
      margin: 4px 0;
    }
    
    .footer-block strong {
      color: #64748b;
      font-weight: 600;
    }
    
    .footer-notes {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      line-height: 1.7;
    }
    
    .footer-notes p {
      margin: 4px 0;
    }
    
    /* Print Optimization */
    @media print {
      body {
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .invoice-wrapper {
        padding: 0;
        min-height: auto;
      }
      
      .invoice-container {
        box-shadow: none;
        border: none;
        border-radius: 0;
        max-width: none;
      }
      
      .invoice-header,
      .billing-section,
      .table-section,
      .totals-section,
      .footer-section {
        padding: 16px 24px;
      }
      
      .items-table {
        page-break-inside: avoid;
      }
      
      .items-table tbody tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .totals-section {
        page-break-inside: avoid;
      }
      
      .footer-section {
        page-break-inside: avoid;
      }
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .invoice-wrapper {
        padding: 12px;
      }
      
      .invoice-header {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 24px 20px;
      }
      
      .invoice-title-section {
        text-align: left;
      }
      
      .invoice-title-section h2 {
        justify-content: flex-start;
      }
      
      .status-badge {
        align-self: flex-start;
      }
      
      .invoice-meta p {
        justify-content: flex-start;
      }
      
      .billing-section {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 24px 20px;
      }
      
      .table-section {
        padding: 20px 12px;
        overflow-x: auto;
      }
      
      .items-table {
        font-size: 12px;
      }
      
      .items-table th,
      .items-table td {
        padding: 10px 8px;
      }
      
      .totals-section {
        padding: 20px;
      }
      
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .footer-section {
        padding: 24px 20px;
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
  <div class="invoice-wrapper">
    <div class="invoice-container">
      
      <!-- Modern Header -->
      <div class="invoice-header">
        <div class="company-info">
          ${data.company.logo_url ? `
          <div class="logo-container">
            <img src="${data.company.logo_url}" alt="${data.company.company_name}" class="logo" />
          </div>` : ''}
          <h1>${data.company.company_name}</h1>
          <div class="company-details">
            ${data.company.company_street ? `<p>${data.company.company_street}${data.company.company_street_number ? ' ' + data.company.company_street_number : ''}</p>` : ''}
            ${data.company.company_city ? `<p>${data.company.company_city}${data.company.company_country ? ', ' + data.company.company_country : ''}${data.company.company_postal_code ? ' ' + data.company.company_postal_code : ''}</p>` : ''}
            ${data.company.company_tax_id ? `<p><strong>${t.taxId || 'Tax ID'}:</strong> ${data.company.company_tax_id}</p>` : ''}
            ${data.company.company_registration_number ? `<p><strong>${t.registrationNumber || 'Reg. No.'}:</strong> ${data.company.company_registration_number}</p>` : ''}
            ${data.company.company_email ? `<p><strong>${t.email || 'Email'}:</strong> ${data.company.company_email}</p>` : ''}
            ${data.company.company_phone ? `<p><strong>${t.phone || 'Phone'}:</strong> ${data.company.company_phone}</p>` : ''}
          </div>
        </div>
        
        <div class="invoice-title-section">
          <h2>
            ${t.invoice || 'INVOICE'}
            <span class="title-accent"></span>
          </h2>
          <span class="status-badge">${data.invoice.status}</span>
          <div class="invoice-meta">
            <p><strong>${t.invoiceNumber || 'Invoice #'}:</strong> <span>${data.invoice.invoice_series ? `${data.invoice.invoice_series}-` : ''}${data.invoice.invoice_number}</span></p>
            <p><strong>${t.date || 'Date'}:</strong> <span>${formatDate(data.invoice.date)}</span></p>
            ${data.invoice.due_date ? `<p><strong>${t.dueDate || 'Due Date'}:</strong> <span>${formatDate(data.invoice.due_date)}</span></p>` : ''}
            ${data.invoice.payment_terms ? `<p><strong>${t.paymentTerms || 'Terms'}:</strong> <span>${data.invoice.payment_terms}</span></p>` : ''}
          </div>
        </div>
      </div>

      <!-- Billing Cards -->
      <div class="billing-section">
        <div class="billing-card">
          <h3>${t.from || 'From'}</h3>
          <p class="name">${data.company.company_name}</p>
          ${data.company.company_email ? `<p>${data.company.company_email}</p>` : ''}
          ${data.company.company_phone ? `<p>${data.company.company_phone}</p>` : ''}
          ${data.company.company_tax_id ? `<p><strong>${t.taxId || 'Tax ID'}:</strong> ${data.company.company_tax_id}</p>` : ''}
        </div>
        
        <div class="billing-card">
          <h3>${t.billTo || 'Bill To'}</h3>
          <p class="name">${data.customer.customer_name}</p>
          ${data.customer.customer_type ? `<p style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #6b7280; margin-top: 0.25rem;">${data.customer.customer_type}</p>` : ''}
          ${data.customer.customer_type === 'Persoană fizică' && data.customer.customer_cnp ? `<p><strong>CNP:</strong> ${data.customer.customer_cnp}</p>` : ''}
          ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_cui ? `<p><strong>CUI:</strong> ${data.customer.customer_cui}</p>` : ''}
          ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_company_registration_number ? `<p><strong>Nr. Reg.:</strong> ${data.customer.customer_company_registration_number}</p>` : ''}
          ${data.customer.customer_type === 'Persoană juridică' && data.customer.customer_vat_number ? `<p><strong>Nr. TVA:</strong> ${data.customer.customer_vat_number}</p>` : ''}
          ${data.customer.customer_tax_id ? `<p><strong>${t.taxId || 'Tax ID'}:</strong> ${data.customer.customer_tax_id}</p>` : ''}
          ${data.customer.customer_registration_number ? `<p><strong>${t.registrationNumber || 'Reg.'}:</strong> ${data.customer.customer_registration_number}</p>` : ''}
          ${data.customer.customer_street ? `<p>${data.customer.customer_street}${data.customer.customer_street_number ? ' ' + data.customer.customer_street_number : ''}</p>` : ''}
          ${data.customer.customer_city ? `<p>${data.customer.customer_city}${data.customer.customer_country ? ', ' + data.customer.customer_country : ''}${data.customer.customer_postal_code ? ' ' + data.customer.customer_postal_code : ''}</p>` : ''}
          ${data.customer.customer_email ? `<p>${data.customer.customer_email}</p>` : ''}
          ${data.customer.customer_phone ? `<p>${data.customer.customer_phone}</p>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <div class="table-section">
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: ${hasAnySKU ? '35%' : '45%'};">${t.item || 'Item'}</th>
              ${hasAnySKU ? `<th style="width: 12%;">${t.sku || 'SKU'}</th>` : ''}
              <th style="width: 10%; text-align: center;">${t.quantity || 'Qty'}</th>
              <th style="width: 8%; text-align: center;">${t.unit || 'Unit'}</th>
              <th style="width: 12%; text-align: right;">${t.unitPrice || 'Unit Price'}</th>
              <th style="width: 10%; text-align: center;">${t.taxRate || 'Tax %'}</th>
              <th style="width: 13%; text-align: right;">${t.total || 'Total'}</th>
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
                ${hasAnySKU ? `<td>${item.product_sku ? `<span class="sku-badge">${item.product_sku}</span>` : '-'}</td>` : ''}
                <td style="text-align: center;">${formatNumber(item.quantity, 2)}</td>
                <td style="text-align: center;">${item.unit_of_measure || 'pcs'}</td>
                <td style="text-align: right;">${formatCurrency(item.unit_price, item.currency || currency)}</td>
                <td style="text-align: center;">${formatNumber(taxRate, 1)}%</td>
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
            <span class="total-label">${t.discount || 'Discount'}${data.totals.discountRate ? ` (${formatNumber(data.totals.discountRate, 1)}%)` : ''}:</span>
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
            <span class="total-label">${t.grandTotal || 'Total Due'}:</span>
            <span class="total-amount">${formatCurrency(data.totals.grandTotal, currency)}</span>
          </div>
          
          ${data.invoice.exchange_rate && data.invoice.reference_currency ? `
          <div class="total-line" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 12px;">
            <span class="total-label">${t.exchangeRate || 'Exchange Rate'}:</span>
            <span class="total-amount" style="color: #64748b;">1 ${data.invoice.reference_currency} = ${formatNumber(data.invoice.exchange_rate, 4)} ${currency}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div class="footer-grid">
          ${data.invoice.payment_method ? `
          <div class="footer-block">
            <h4>${t.paymentMethod || 'Payment Method'}</h4>
            <p>${data.invoice.payment_method}</p>
          </div>` : ''}
          
          ${data.company.company_iban || data.company.company_bank ? `
          <div class="footer-block">
            <h4>${t.bankDetails || 'Bank Details'}</h4>
            ${data.company.company_bank ? `<p><strong>${t.bank || 'Bank'}:</strong> ${data.company.company_bank}</p>` : ''}
            ${data.company.company_iban ? `<p><strong>${t.iban || 'IBAN'}:</strong> ${data.company.company_iban}</p>` : ''}
            ${data.company.company_swift ? `<p><strong>${t.swift || 'SWIFT'}:</strong> ${data.company.company_swift}</p>` : ''}
          </div>` : ''}
        </div>
        
        ${data.invoice.notes ? `
        <div class="footer-block" style="margin-top: 16px;">
          <h4>${t.notes || 'Notes'}</h4>
          <p>${data.invoice.notes}</p>
        </div>` : ''}
        
        <div class="footer-notes">
          <p><strong>${t.thankYou || 'Thank you for your business!'}</strong></p>
          ${data.company.website ? `<p>${data.company.website}</p>` : ''}
          ${data.company.company_email ? `<p>${data.company.company_email}</p>` : ''}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
	}
}
