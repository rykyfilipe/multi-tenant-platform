import { NextRequest, NextResponse } from 'next/server';
import { requireAuthResponse, getUserId } from '@/lib/session';
import prisma, { withRetry } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireAuthResponse();
    if (sessionResult instanceof NextResponse) {
      return sessionResult;
    }
    
    const userId = getUserId(sessionResult);
    if (!sessionResult.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId } = body;

    let invoiceData: any = {};
    let invoiceNumber = 'TEST-' + Date.now();
    let currentDate = new Date().toISOString().split('T')[0];

    // If invoiceId is provided, fetch real invoice data
    if (invoiceId) {
      const userResult = await withRetry(() => 
        prisma.user.findFirst({
          where: { email: sessionResult.user.email },
        })
      ) as any;

      if (!userResult) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get user's tenants
      const userTenants = await withRetry(() =>
        prisma.userTenant.findMany({
          where: { userId: userResult.id },
          include: { tenant: true }
        })
      ) as any[];

      // Find the invoice across all tenants
      for (const userTenant of userTenants) {
        const tenantId = userTenant.tenantId;
        
        const database = await withRetry(() =>
          prisma.database.findFirst({
            where: { tenantId: tenantId }
          })
        ) as any;

        if (!database) continue;

        const invoiceTables = await withRetry(() =>
          prisma.table.findMany({
            where: { 
              databaseId: database.id,
              name: { in: ['invoices', 'invoice'] }
            },
            include: {
              columns: true,
              rows: {
                where: { id: invoiceId },
                include: {
                  cells: {
                    include: {
                      column: true
                    }
                  }
                }
              }
            }
          })
        ) as any[];

        for (const table of invoiceTables) {
          if (table.rows.length > 0) {
            const row = table.rows[0];
            
            // Extract data from cells
            for (const cell of row.cells) {
              const columnName = cell.column.name;
              let value = cell.value;
              
              if (cell.column.dataType === 'number' && value !== null) {
                value = parseFloat(value);
              }
              
              invoiceData[columnName] = value;
            }
            
            // Get customer data
            if (invoiceData.customer_id) {
              const customerTable = await withRetry(() =>
                prisma.table.findFirst({
                  where: { 
                    databaseId: database.id,
                    name: { in: ['customers', 'customer'] }
                  },
                  include: {
                    rows: {
                      where: { id: invoiceData.customer_id },
                      include: {
                        cells: {
                          include: {
                            column: true
                          }
                        }
                      }
                    }
                  }
                })
              ) as any;

              if (customerTable && customerTable.rows && customerTable.rows.length > 0) {
                const customerRow = customerTable.rows[0];
                const customerData: any = {};
                
                for (const cell of customerRow.cells) {
                  const columnName = cell.column.name;
                  customerData[columnName] = cell.value;
                }
                
                invoiceData.customer = customerData;
              }
            }
            
            // Get invoice items
            const itemsTable = await withRetry(() =>
              prisma.table.findFirst({
                where: { 
                  databaseId: database.id,
                  name: { in: ['invoice_items', 'invoiceitem'] }
                },
                include: {
                  columns: true,
                  rows: {
                    where: { 
                      cells: {
                        some: {
                          column: { name: 'invoice_id' },
                          value: invoiceId.toString()
                        }
                      }
                    },
                    include: {
                      cells: {
                        include: {
                          column: true
                        }
                      }
                    }
                  }
                }
              })
            ) as any;

            if (itemsTable && itemsTable.rows) {
              invoiceData.items = [];
              for (const itemRow of itemsTable.rows) {
                const itemData: any = {};
                for (const cell of itemRow.cells) {
                  const columnName = cell.column.name;
                  let value = cell.value;
                  
                  if (cell.column.dataType === 'number' && value !== null) {
                    value = parseFloat(value);
                  }
                  
                  itemData[columnName] = value;
                }
                invoiceData.items.push(itemData);
              }
            }
            
            break; // Found the invoice, exit loops
          }
        }
        
        if (Object.keys(invoiceData).length > 0) break; // Found invoice data
      }
    }

    // Use real data if available, otherwise use defaults
    if (Object.keys(invoiceData).length > 0) {
      invoiceNumber = invoiceData.invoice_number || invoiceNumber;
      currentDate = invoiceData.date ? new Date(invoiceData.date).toISOString().split('T')[0] : currentDate;
    }
    
    // Generate XML using real or test data
    const supplierName = invoiceData.company_name || 'Test Company SRL';
    const supplierTaxId = invoiceData.company_tax_id || 'RO12345678';
    const supplierEmail = invoiceData.company_email || 'test@company.com';
    const supplierAddress = invoiceData.company_address || 'Strada Test 123, București, 010001';
    
    const customerName = invoiceData.customer?.customer_name || invoiceData.customer_name || 'Test Customer SRL';
    const customerTaxId = invoiceData.customer?.customer_tax_id || 'RO00000000';
    const customerEmail = invoiceData.customer?.customer_email || 'client@test.com';
    const customerAddress = invoiceData.customer?.customer_address || 'Strada Client 456, București, 010002';
    
    const currency = invoiceData.base_currency || 'RON';
    const totalAmount = invoiceData.total_amount || 100.00;
    const taxAmount = totalAmount * 0.19; // 19% VAT
    const taxExclusiveAmount = totalAmount - taxAmount;
    
    // Generate invoice lines from items or use default
    let invoiceLines = '';
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item: any, index: number) => {
        const quantity = item.quantity || 1;
        const price = item.price || item.converted_price || 100.00;
        const lineTotal = quantity * price;
        const description = item.description || item.product_details?.name || 'Produs';
        
        invoiceLines += `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity>${quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${description}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount>${price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
      });
    } else {
      // Default line if no items
      invoiceLines = `
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity>1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>${taxExclusiveAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>Servicii</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount>${taxExclusiveAmount.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
    }

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${currentDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${supplierTaxId}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${supplierName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${supplierAddress}</cbc:StreetName>
        <cbc:CityName>București</cbc:CityName>
        <cbc:PostalZone>010001</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO3166-1:Alpha2">RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>${supplierEmail}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${customerTaxId}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${customerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${customerAddress}</cbc:StreetName>
        <cbc:CityName>București</cbc:CityName>
        <cbc:PostalZone>010002</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO3166-1:Alpha2">RO</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:ElectronicMail>${customerEmail}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  ${invoiceLines}
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${taxAmount.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${taxExclusiveAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${currency}">${taxExclusiveAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    return NextResponse.json({
      success: true,
      xmlContent,
      invoiceNumber,
      invoiceData: Object.keys(invoiceData).length > 0 ? invoiceData : null,
      message: Object.keys(invoiceData).length > 0 ? 'Invoice XML generated from real data' : 'Test invoice generated successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
