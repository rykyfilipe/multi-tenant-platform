import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    // Generate a test invoice XML
    const invoiceNumber = 'TEST-' + Date.now();
    const currentDate = new Date().toISOString().split('T')[0];
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${currentDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>RO12345678</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Test Company SRL</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Strada Test 123</cbc:StreetName>
        <cbc:CityName>București</cbc:CityName>
        <cbc:PostalZone>010001</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO3166-1:Alpha2">RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>test@company.com</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>RO00000000</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Test Customer SRL</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Strada Client 456</cbc:StreetName>
        <cbc:CityName>București</cbc:CityName>
        <cbc:PostalZone>010002</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO3166-1:Alpha2">RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>client@test.com</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity>1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>Produs de test pentru ANAF e-Factura</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount>100.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">19.00</cbc:TaxAmount>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="RON">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="RON">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="RON">119.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="RON">119.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    return NextResponse.json({
      success: true,
      xmlContent,
      invoiceNumber,
      message: 'Test invoice generated successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
