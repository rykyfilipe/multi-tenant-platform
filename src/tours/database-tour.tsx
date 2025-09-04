/** @format */

import React from 'react';
import { Database, Plus, Table, Columns, Rows, Settings, Search, Filter } from 'lucide-react';

export const databaseTour = [
  {
    target: '[data-tour-id="database-header"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Management</h3>
            <p className="text-sm text-gray-600">Organize your data efficiently</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Welcome to the database management system! Create and manage multiple databases 
          to organize your data by project, department, or any other logical grouping.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>🗂️ Organization:</strong> Each database can contain multiple tables, 
            perfect for organizing related data together.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="create-database-button"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Database</h3>
            <p className="text-sm text-gray-600">Start organizing your data</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Click here to create a new database. Give it a descriptive name and description 
          to help your team understand its purpose.
        </p>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>💡 Naming:</strong> Use clear, descriptive names like "Customer Data" 
            or "Project Management" to make databases easy to identify.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="database-selector"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Selector</h3>
            <p className="text-sm text-gray-600">Switch between databases</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Use this dropdown to switch between different databases. Each database is isolated 
          and contains its own tables and data.
        </p>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>🔄 Switching:</strong> All tables and data shown below will update 
            when you select a different database.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="create-table-button"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Table className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create New Table</h3>
            <p className="text-sm text-gray-600">Add structure to your data</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Tables are where you store your actual data. Click here to create a new table 
          and define its structure with columns and data types.
        </p>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>📊 Structure:</strong> Define columns with different data types 
            (text, numbers, dates, etc.) to match your data needs.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="tables-grid"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Table className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tables Overview</h3>
            <p className="text-sm text-gray-600">Manage all your tables</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          This grid shows all tables in your selected database. Each table card displays 
          key information and provides quick access to manage columns, rows, and settings.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Columns className="w-4 h-4" />
            <span>Columns - Define table structure</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Rows className="w-4 h-4" />
            <span>Rows - Manage your data</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Settings className="w-4 h-4" />
            <span>Settings - Configure table options</span>
          </div>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="table-search"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <Search className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Search Tables</h3>
            <p className="text-sm text-gray-600">Find tables quickly</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Use the search bar to quickly find specific tables by name or description. 
          This is especially useful when you have many tables in your database.
        </p>
        <div className="bg-teal-50 p-4 rounded-lg">
          <p className="text-sm text-teal-800">
            <strong>🔍 Search:</strong> Type any part of the table name or description 
            to filter the results instantly.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  }
];

export const databaseTourConfig = {
  id: 'database',
  name: 'Database Management Tour',
  description: 'Learn how to create and manage databases and tables',
  steps: databaseTour,
  roles: ['ADMIN', 'EDITOR', 'VIEWER'],
  features: [],
  autoStart: true,
  priority: 9
};
