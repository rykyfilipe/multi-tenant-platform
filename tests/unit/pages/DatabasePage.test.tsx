/** @format */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DatabaseContent } from '@/app/home/database/page';

// Mock all dependencies
jest.mock('@/contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    tables: [],
    selectedDatabase: null,
    showAddTableModal: false,
    setShowAddTableModal: jest.fn(),
    name: '',
    setName: jest.fn(),
    description: '',
    setDescription: jest.fn(),
    handleAddTable: jest.fn(),
    loading: false,
  }),
}));

jest.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    user: { id: '1', role: 'ADMIN' },
  }),
}));

jest.mock('@reactour/tour', () => ({
  useTour: () => ({
    setIsOpen: jest.fn(),
    setCurrentStep: jest.fn(),
  }),
}));

jest.mock('@/lib/tour-config', () => ({
  tourUtils: {
    isTourSeen: jest.fn(() => false),
    getDatabaseTourSteps: jest.fn(() => []),
    markTourSeen: jest.fn(),
  },
}));

// Mock all components
jest.mock('@/components/database/AddTableModal', () => {
  return function MockAddTableModal() {
    return <div data-testid="add-table-modal">Add Table Modal</div>;
  };
});

jest.mock('@/components/ui/loading-states', () => ({
  DatabaseLoadingState: () => <div data-testid="database-loading">Loading...</div>
}));

jest.mock('@/components/database/TableGrid', () => {
  return function MockTableGrid() {
    return <div data-testid="table-grid">Table Grid</div>;
  };
});

jest.mock('@/components/database/DatabaseSelector', () => {
  return function MockDatabaseSelector() {
    return <div data-testid="database-selector">Database Selector</div>;
  };
});

jest.mock('@/components/database/TableTemplateSelector', () => {
  return function MockTableTemplateSelector() {
    return <div data-testid="table-template-selector">Table Template Selector</div>;
  };
});

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

jest.mock('@/contexts/TourProvider', () => {
  return function MockTourProvider({ children }: { children: React.ReactNode }) {
    return <div data-testid="tour-provider">{children}</div>;
  };
});

describe('DatabasePage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Basic Rendering', () => {
    it('renders database page without crashing', () => {
      render(<DatabaseContent />);
      
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Manage your data tables and schemas')).toBeInTheDocument();
    });

    it('renders database selector', () => {
      render(<DatabaseContent />);
      
      expect(screen.getByTestId('database-selector')).toBeInTheDocument();
    });

    it('renders tour provider', () => {
      render(<DatabaseContent />);
      
      expect(screen.getByTestId('tour-provider')).toBeInTheDocument();
    });
  });

  describe('No Database Selected', () => {
    it('shows no database selected message', () => {
      render(<DatabaseContent />);
      
      expect(screen.getByText('Select a Database')).toBeInTheDocument();
      expect(screen.getByText('Choose a database from the dropdown above to start managing your tables')).toBeInTheDocument();
    });
  });
});
