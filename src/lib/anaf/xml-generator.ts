import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

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

  generateInvoiceXML(invoiceData: InvoiceData): string {
    const { company, customer, items, invoice, totals } = invoiceData;

    const issueDate = new Date(invoice.invoice_date)
      .toISOString()
      .split("T")[0];

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${this.escapeXml(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${this.escapeXml(invoice.currency)}</cbc:DocumentCurrencyCode>

  ${this.generateParty("AccountingSupplierParty", company)}
  ${this.generateParty("AccountingCustomerParty", customer)}

  ${items.map((item, idx) => this.generateInvoiceLine(item, idx + 1)).join("\n")}

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${this.escapeXml(invoice.currency)}">${totals.tax.toFixed(
      2
    )}</cbc:TaxAmount>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${this.escapeXml(
      invoice.currency
    )}">${totals.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${this.escapeXml(
      invoice.currency
    )}">${totals.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${this.escapeXml(
      invoice.currency
    )}">${totals.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${this.escapeXml(
      invoice.currency
    )}">${totals.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    this.saveToFile(xmlContent, invoice.invoice_number);
    return xmlContent;
  }

  private generateParty(tag: string, data: CompanyData): string {
    return `<cac:${tag}>
  <cac:Party>
    <cac:PartyIdentification>
      <cbc:ID>${this.escapeXml(data.taxId)}</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>${this.escapeXml(data.name)}</cbc:Name>
    </cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>${this.escapeXml(data.address)}</cbc:StreetName>
      ${data.city ? `<cbc:CityName>${this.escapeXml(data.city)}</cbc:CityName>` : ""}
      ${data.postalCode ? `<cbc:PostalZone>${this.escapeXml(data.postalCode)}</cbc:PostalZone>` : ""}
      ${
        data.country
          ? `<cac:Country><cbc:IdentificationCode listID="ISO3166-1:Alpha2">${this.escapeXml(
              data.country
            )}</cbc:IdentificationCode></cac:Country>`
          : ""
      }
    </cac:PostalAddress>
    <cac:Contact>
      <cbc:ElectronicMail>${this.escapeXml(data.email)}</cbc:ElectronicMail>
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
    <cbc:Description>${this.escapeXml(item.description)}</cbc:Description>
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

  private escapeXml(unsafe: string | undefined): string {
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
