/** @format */

import { Step } from 'react-joyride';
import { FileText, Plus, Download, Search, Filter, Settings, Users, DollarSign } from 'lucide-react';

export const invoiceTour: Step[] = [
  {
    target: '[data-tour-id="invoice-header"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoice Management</h3>
            <p className="text-sm text-gray-600">Professional billing made easy</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Welcome to the invoice management system! Create, manage, and track professional 
          invoices with ease. All invoices are automatically formatted for Romanian fiscal compliance.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🇷🇴 Compliance:</strong> All invoices are automatically formatted to meet 
            Romanian fiscal requirements and can be exported as PDF.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="create-invoice-button"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Invoice</h3>
            <p className="text-sm text-gray-600">Start billing your clients</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Click here to create a new invoice. You'll be guided through the process of 
          adding customer details, line items, and payment terms.
        </p>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✨ Features:</strong> Automatic numbering, VAT calculations, 
            multi-currency support, and professional PDF generation.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="invoice-search"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Search className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
            <p className="text-sm text-gray-600">Find invoices quickly</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Use the search bar to find specific invoices by number, customer name, or amount. 
          The filter options help you narrow down results by status, date, or customer.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Search className="w-4 h-4" />
            <span>Search by invoice number or customer</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Filter by status, date, or amount</span>
          </div>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="invoice-list"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoice List</h3>
            <p className="text-sm text-gray-600">Manage all your invoices</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          This is where all your invoices are displayed. Each invoice shows key information 
          like number, customer, amount, status, and due date. Click on any invoice to view or edit it.
        </p>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>📊 Status Colors:</strong> Green for paid, yellow for pending, 
            red for overdue invoices.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="invoice-actions"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invoice Actions</h3>
            <p className="text-sm text-gray-600">Quick actions for each invoice</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Each invoice has quick action buttons for common tasks. View details, 
          generate PDF, edit, or delete invoices with just one click.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>View - See full invoice details</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Download className="w-4 h-4" />
            <span>PDF - Download as PDF</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings className="w-4 h-4" />
            <span>Edit - Modify invoice details</span>
          </div>
        </div>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour-id="series-management"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Series Management</h3>
            <p className="text-sm text-gray-600">Organize your invoice numbering</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Configure how your invoices are numbered. Create different series for different 
          types of invoices (e.g., regular invoices, credit notes, proforma invoices).
        </p>
        <div className="bg-teal-50 p-4 rounded-lg">
          <p className="text-sm text-teal-800">
            <strong>🔢 Numbering:</strong> Automatic sequential numbering with customizable 
            prefixes, suffixes, and yearly reset options.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  }
];

export const invoiceTourConfig = {
  id: 'invoice',
  name: 'Invoice Management Tour',
  description: 'Learn how to create and manage professional invoices',
  steps: invoiceTour,
  roles: ['ADMIN', 'EDITOR'],
  features: ['billing'],
  autoStart: true,
  priority: 8
};
