<!-- @format -->

# TODO List

## Completed Tasks

- [x] Fix inconsistent invoice calculations between InvoiceForm, InvoiceList,
      and PDF generation
- [x] Implement unified InvoiceCalculationService across all components
- [x] Fix hardcoded exchange rates to use consistent values across
      currency-exchange-client and InvoiceCalculationService
- [x] Fix data type conversion from database strings to numbers for calculations
- [x] Fix hardcoded USD currency in PDF generation to use actual invoice
      currency
- [x] Move useInvoiceSystem hook to page.tsx to prevent re-fetching data on tab
      changes
- [x] Optimize invoice tab switching to avoid unnecessary GET requests and
      loading indicators
- [x] Fix UI loading states to prevent showing "no invoices" message during data
      fetch
- [x] Add tenant information display in invoice list page
- [x] Enhance invoice details modal with comprehensive information

## Pending Tasks

- [ ] Test that switching tabs no longer triggers unnecessary API requests
- [ ] Test the application to verify calculations are now consistent
- [ ] Test the improved UI loading experience (no more placeholder → no invoices
      → invoices sequence)
- [ ] Test the enhanced invoice details modal with tenant and product
      information

## Current Focus

The user requested to display tenant details (company name, email, address, base
currency) in the invoice list page and enhance the invoice details modal with
comprehensive information. This has been implemented by:

1. **Added Tenant Information Section** in `InvoiceList.tsx`:

   - Company Name, Base Currency, Company Email, Company Address
   - Styled with gradient background and organized in a grid layout

2. **Enhanced Invoice Details Modal**:

   - Added Payment Terms, Payment Method, Due Date, Base Currency to invoice
     information
   - Added new "Tenant Information" card with company details
   - Improved product table with SKU, Brand, Category columns
   - Better organization with 3-column layout for invoice header information

3. **Improved Product Details Display**:
   - SKU, Brand, Category columns in the products table
   - Better responsive design with hidden columns on smaller screens
   - More comprehensive product information display

This provides users with a complete overview of both tenant and invoice
information in a well-organized, professional interface.
