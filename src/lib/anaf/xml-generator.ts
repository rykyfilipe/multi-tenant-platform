import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { ANAFInvoiceData, ANAFCompanyData, ANAFCustomerData, ANAFInvoiceItem, ANAFTotals } from './types';

interface CompanyData {
  name: string;
  taxId: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
  email: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface InvoiceData {
  customer: CompanyData;
  company: CompanyData;
  items: InvoiceItem[];
  invoice: {
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    currency: string;
  };
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

export class ANAFXMLGenerator {
  constructor(private outputDir: string = "./anaf_xml") {}

  /**
   * Generate EN16931/UBL compliant XML for ANAF e-Factura
   */
  static generateXML(options: {
    invoiceData: ANAFInvoiceData;
    companyData: ANAFCompanyData;
    customerData: ANAFCustomerData;
    language: string;
    includeSignature?: boolean;
  }): string {
    const { invoiceData, companyData, customerData, language, includeSignature = true } = options;

    // Generate unique invoice ID
    const invoiceId = this.generateInvoiceId(invoiceData.invoiceNumber);
    
    // Format dates according to EN16931
    const issueDate = this.formatDate(invoiceData.invoiceDate);
    const dueDate = this.formatDate(invoiceData.dueDate);
    
    // Calculate totals
    const totals = this.calculateTotals(invoiceData.items);
    
    // Generate XML content
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd">
  
  <!-- Invoice Header Information -->
  <cbc:ID>${ANAFXMLGenerator.escapeXml(invoiceId)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:DueDate>${dueDate}</cbc:DueDate>
  <cbc:InvoiceTypeCode listID="UNCL1001">380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode listID="ISO4217">${ANAFXMLGenerator.escapeXml(invoiceData.currency)}</cbc:DocumentCurrencyCode>
  <cbc:TaxPointDate>${issueDate}</cbc:TaxPointDate>
  <cbc:AccountingCostCode>${ANAFXMLGenerator.escapeXml(invoiceData.invoiceNumber)}</cbc:AccountingCostCode>
  
  <!-- Additional Document References -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>${ANAFXMLGenerator.escapeXml(invoiceData.invoiceNumber)}</cbc:ID>
    <cbc:DocumentTypeCode>130</cbc:DocumentTypeCode>
  </cac:AdditionalDocumentReference>
  
  <!-- Supplier Party (Company) -->
  ${this.generateSupplierParty(companyData)}
  
  <!-- Customer Party -->
  ${this.generateCustomerParty(customerData)}
  
  <!-- Invoice Lines -->
  ${invoiceData.items.map((item, idx) => this.generateInvoiceLine(item, idx + 1, invoiceData.currency)).join('\n')}
  
  <!-- Tax Totals -->
  ${this.generateTaxTotals(totals, invoiceData.currency)}
  
  <!-- Legal Monetary Totals -->
  ${this.generateLegalMonetaryTotals(totals, invoiceData.currency)}
  
  <!-- Payment Terms -->
  <cac:PaymentTerms>
    <cbc:Note>Payment due within 30 days</cbc:Note>
    <cbc:PaymentDueDate>${dueDate}</cbc:PaymentDueDate>
  </cac:PaymentTerms>
  
</Invoice>`;

    return xmlContent;
  }

  /**
   * Generate XML for legacy InvoiceData format (backward compatibility)
   */
  generateInvoiceXML(invoiceData: InvoiceData): string {
    const { company, customer, items, invoice, totals } = invoiceData;

    const issueDate = new Date(invoice.invoice_date)
      .toISOString()
      .split("T")[0];

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${ANAFXMLGenerator.escapeXml(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${ANAFXMLGenerator.escapeXml(invoice.currency)}</cbc:DocumentCurrencyCode>

  ${this.generateParty("AccountingSupplierParty", company)}
  ${this.generateParty("AccountingCustomerParty", customer)}

  ${items.map((item, idx) => this.generateInvoiceLine(item, idx + 1)).join("\n")}

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${ANAFXMLGenerator.escapeXml(invoice.currency)}">${totals.tax.toFixed(
      2
    )}</cbc:TaxAmount>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${ANAFXMLGenerator.escapeXml(
      invoice.currency
    )}">${totals.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${ANAFXMLGenerator.escapeXml(
      invoice.currency
    )}">${totals.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${ANAFXMLGenerator.escapeXml(
      invoice.currency
    )}">${totals.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${ANAFXMLGenerator.escapeXml(
      invoice.currency
    )}">${totals.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    this.saveToFile(xmlContent, invoice.invoice_number);
    return xmlContent;
  }

  /**
   * Generate unique invoice ID
   */
  private static generateInvoiceId(invoiceNumber: string): string {
    const timestamp = Date.now();
    return `${invoiceNumber}-${timestamp}`;
  }

  /**
   * Format date according to EN16931 (YYYY-MM-DD)
   */
  private static formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Calculate totals for invoice items
   */
  private static calculateTotals(items: ANAFInvoiceItem[]): ANAFTotals {
    let subtotal = 0;
    let vatTotal = 0;

    items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      vatTotal += item.vatAmount || (lineTotal * item.vatRate / 100);
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatTotal: Math.round(vatTotal * 100) / 100,
      grandTotal: Math.round((subtotal + vatTotal) * 100) / 100,
      currency: items[0]?.currency || 'RON'
    };
  }

  /**
   * Generate supplier party section
   */
  private static generateSupplierParty(companyData: ANAFCompanyData): string {
    return `<cac:AccountingSupplierParty>
  <cac:Party>
    <cac:PartyIdentification>
      <cbc:ID schemeID="RO">${ANAFXMLGenerator.escapeXml(companyData.taxId)}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${ANAFXMLGenerator.escapeXml(companyData.name)}</cbc:Name>
    </cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>${ANAFXMLGenerator.escapeXml(companyData.address)}</cbc:StreetName>
      <cbc:CityName>${ANAFXMLGenerator.escapeXml(companyData.city)}</cbc:CityName>
      <cbc:PostalZone>${ANAFXMLGenerator.escapeXml(companyData.postalCode)}</cbc:PostalZone>
      <cac:Country>
        <cbc:IdentificationCode listID="ISO3166-1:Alpha2">${ANAFXMLGenerator.escapeXml(companyData.country)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>
    <cac:Contact>
      <cbc:ElectronicMail>${ANAFXMLGenerator.escapeXml(companyData.email || '')}</cbc:ElectronicMail>
      ${companyData.phone ? `<cbc:Telephone>${ANAFXMLGenerator.escapeXml(companyData.phone)}</cbc:Telephone>` : ''}
    </cac:Contact>
  </cac:Party>
</cac:AccountingSupplierParty>`;
  }

  /**
   * Generate customer party section
   */
  private static generateCustomerParty(customerData: ANAFCustomerData): string {
    return `<cac:AccountingCustomerParty>
  <cac:Party>
    <cac:PartyIdentification>
      <cbc:ID schemeID="RO">${ANAFXMLGenerator.escapeXml(customerData.taxId)}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${ANAFXMLGenerator.escapeXml(customerData.name)}</cbc:Name>
    </cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>${ANAFXMLGenerator.escapeXml(customerData.address)}</cbc:StreetName>
      <cbc:CityName>${ANAFXMLGenerator.escapeXml(customerData.city)}</cbc:CityName>
      <cbc:PostalZone>${ANAFXMLGenerator.escapeXml(customerData.postalCode)}</cbc:PostalZone>
      <cac:Country>
        <cbc:IdentificationCode listID="ISO3166-1:Alpha2">${ANAFXMLGenerator.escapeXml(customerData.country)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>
    <cac:Contact>
      <cbc:ElectronicMail>${ANAFXMLGenerator.escapeXml(customerData.email || '')}</cbc:ElectronicMail>
      ${customerData.phone ? `<cbc:Telephone>${ANAFXMLGenerator.escapeXml(customerData.phone)}</cbc:Telephone>` : ''}
    </cac:Contact>
  </cac:Party>
</cac:AccountingCustomerParty>`;
  }

  /**
   * Generate invoice line for EN16931
   */
  private static generateInvoiceLine(item: ANAFInvoiceItem, lineId: number, currency: string): string {
    const lineExtensionAmount = item.quantity * item.unitPrice;
    const vatAmount = item.vatAmount || (lineExtensionAmount * item.vatRate / 100);
    
    return `<cac:InvoiceLine>
  <cbc:ID>${lineId}</cbc:ID>
  <cbc:InvoicedQuantity unitCode="${this.getUnitCode(item.unitOfMeasure)}">${item.quantity}</cbc:InvoicedQuantity>
  <cbc:LineExtensionAmount currencyID="${currency}">${lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
  <cac:Item>
    <cbc:Description>${ANAFXMLGenerator.escapeXml(item.productName)}</cbc:Description>
    ${item.description ? `<cbc:AdditionalInformation>${ANAFXMLGenerator.escapeXml(item.description)}</cbc:AdditionalInformation>` : ''}
  </cac:Item>
  <cac:Price>
    <cbc:PriceAmount currencyID="${currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
  </cac:Price>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${lineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UNCL5305">S</cbc:ID>
        <cbc:Percent>${item.vatRate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeID="UNCL4461">VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
</cac:InvoiceLine>`;
  }

  /**
   * Generate tax totals section
   */
  private static generateTaxTotals(totals: ANAFTotals, currency: string): string {
    return `<cac:TaxTotal>
  <cbc:TaxAmount currencyID="${currency}">${totals.vatTotal.toFixed(2)}</cbc:TaxAmount>
  <cac:TaxSubtotal>
    <cbc:TaxableAmount currencyID="${currency}">${totals.subtotal.toFixed(2)}</cbc:TaxableAmount>
    <cbc:TaxAmount currencyID="${currency}">${totals.vatTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxCategory>
      <cbc:ID schemeID="UNCL5305">S</cbc:ID>
      <cac:TaxScheme>
        <cbc:ID schemeID="UNCL4461">VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:TaxCategory>
  </cac:TaxSubtotal>
</cac:TaxTotal>`;
  }

  /**
   * Generate legal monetary totals section
   */
  private static generateLegalMonetaryTotals(totals: ANAFTotals, currency: string): string {
    return `<cac:LegalMonetaryTotal>
  <cbc:LineExtensionAmount currencyID="${currency}">${totals.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
  <cbc:TaxExclusiveAmount currencyID="${currency}">${totals.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
  <cbc:TaxInclusiveAmount currencyID="${currency}">${totals.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
  <cbc:PayableAmount currencyID="${currency}">${totals.grandTotal.toFixed(2)}</cbc:PayableAmount>
</cac:LegalMonetaryTotal>`;
  }

  /**
   * Get unit code for quantity
   */
  private static getUnitCode(unitOfMeasure: string): string {
    const unitMap: { [key: string]: string } = {
      'buc': 'C62',
      'bucati': 'C62',
      'pieces': 'C62',
      'kg': 'KGM',
      'kilogram': 'KGM',
      'm': 'MTR',
      'metru': 'MTR',
      'meter': 'MTR',
      'l': 'LTR',
      'litru': 'LTR',
      'liter': 'LTR',
      'h': 'HUR',
      'ora': 'HUR',
      'hour': 'HUR',
      'zile': 'DAY',
      'days': 'DAY',
      'luna': 'MON',
      'month': 'MON',
      'an': 'ANN',
      'year': 'ANN'
    };
    
    return unitMap[unitOfMeasure.toLowerCase()] || 'C62';
  }

  private generateParty(tag: string, data: CompanyData): string {
    return `<cac:${tag}>
  <cac:Party>
    <cac:PartyIdentification>
      <cbc:ID>${ANAFXMLGenerator.escapeXml(data.taxId)}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${ANAFXMLGenerator.escapeXml(data.name)}</cbc:Name>
    </cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>${ANAFXMLGenerator.escapeXml(data.address)}</cbc:StreetName>
      ${data.city ? `<cbc:CityName>${ANAFXMLGenerator.escapeXml(data.city)}</cbc:CityName>` : ""}
      ${data.postalCode ? `<cbc:PostalZone>${ANAFXMLGenerator.escapeXml(data.postalCode)}</cbc:PostalZone>` : ""}
      ${
        data.country
          ? `<cac:Country><cbc:IdentificationCode listID="ISO3166-1:Alpha2">${ANAFXMLGenerator.escapeXml(
              data.country
            )}</cbc:IdentificationCode></cac:Country>`
          : ""
      }
    </cac:PostalAddress>
    <cac:Contact>
      <cbc:ElectronicMail>${ANAFXMLGenerator.escapeXml(data.email)}</cbc:ElectronicMail>
    </cac:Contact>
  </cac:Party>
</cac:${tag}>`;
  }

  private generateInvoiceLine(item: InvoiceItem, lineId: number): string {
    const lineExtensionAmount = item.quantity * item.unitPrice;
    return `<cac:InvoiceLine>
  <cbc:ID>${lineId}</cbc:ID>
  <cbc:InvoicedQuantity>${item.quantity}</cbc:InvoicedQuantity>
  <cbc:LineExtensionAmount>${lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
  <cac:Item>
    <cbc:Description>${ANAFXMLGenerator.escapeXml(item.description)}</cbc:Description>
  </cac:Item>
  <cac:Price>
    <cbc:PriceAmount>${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
  </cac:Price>
</cac:InvoiceLine>`;
  }

  private saveToFile(xmlContent: string, invoiceNumber: string): void {
    const dir = path.resolve(this.outputDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `invoice_${invoiceNumber}.xml`);
    fs.writeFileSync(filePath, xmlContent, "utf-8");
    console.log(`XML salvat la: ${filePath}`);
  }

  private static escapeXml(unsafe: string | undefined): string {
    if (!unsafe) return "";
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /** Validare reală XML */
  validateXML(xmlContent: string): string {
    try {
      const parser = new XMLParser();
      parser.parse(xmlContent);
      return "✅ XML valid (toate tagurile sunt închise corect)";
    } catch (err: any) {
      return `❌ XML invalid: ${err.message}`;
    }
  }
}
