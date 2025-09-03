import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { AppContextProvider } from '@/contexts/AppContext'
import { DatabaseContextProvider } from '@/contexts/DatabaseContext'
import { LanguageContextProvider } from '@/contexts/LanguageContext'
import { ThemeContextProvider } from '@/contexts/ThemeContext'
import { TourProvider } from '@/contexts/TourProvider'
import { UsersContextProvider } from '@/contexts/UsersContext'

// Mock data for testing
export const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN' as const,
  tenantId: 1,
  profileImage: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockTenant = {
  id: 1,
  name: 'Test Tenant',
  adminId: 1,
  address: '123 Test St',
  companyEmail: 'admin@testtenant.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  language: 'en',
  logoUrl: null,
  phone: '+1234567890',
  theme: 'light',
  timezone: 'UTC',
  website: 'https://testtenant.com',
  lastMemoryUpdate: new Date().toISOString(),
  memoryLimitGB: 10,
  memoryUsedGB: 2.5,
  defaultCurrency: 'USD',
  companyBank: 'Test Bank',
  companyCity: 'Test City',
  companyCountry: 'Test Country',
  companyIban: 'TEST123456789',
  companyPostalCode: '12345',
  companyStreet: 'Test Street',
  companyStreetNumber: '123',
  companyTaxId: 'TAX123456',
  registrationNumber: 'REG123456',
  enabledModules: ['user', 'inventory', 'analytics'],
}

export const mockDatabase = {
  id: 1,
  tenantId: 1,
  name: 'Main Database',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockTable = {
  id: 1,
  databaseId: 1,
  name: 'users',
  description: 'User table',
  isPublic: false,
  isProtected: false,
  protectedType: null,
  moduleType: 'user',
  isModuleTable: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockColumn = {
  id: 1,
  tableId: 1,
  name: 'email',
  type: 'VARCHAR',
  required: true,
  isPrimaryKey: false,
  isForeignKey: false,
  referencedTableId: null,
  referencedColumnId: null,
  description: 'User email address',
  showInInvoice: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockRow = {
  id: 1,
  tableId: 1,
  data: {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// Custom render function with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AppContextProvider>
          <DatabaseContextProvider>
            <LanguageContextProvider>
              <ThemeContextProvider>
                <TourProvider>
                  <UsersContextProvider>
                    {children}
                  </UsersContextProvider>
                </TourProvider>
              </ThemeContextProvider>
            </LanguageContextProvider>
          </DatabaseContextProvider>
        </AppContextProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for common test scenarios
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {},
})

export const createMockError = (message: string, status = 500) => ({
  message,
  status,
  response: {
    data: { error: message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
})

export const waitForApiCall = () => new Promise(resolve => setTimeout(resolve, 100))

export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
  })
}

export const mockFetchError = (message: string, status = 500) => {
  global.fetch = jest.fn().mockRejectedValue(new Error(message))
}

// Mock router functions
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

// Mock navigation functions
export const mockNavigation = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

// Mock search params
export const mockSearchParams = new URLSearchParams()

// Mock pathname
export const mockPathname = '/'

// Test data factories
export const createMockUser = (overrides: Partial<typeof mockUser> = {}) => ({
  ...mockUser,
  ...overrides,
})

export const createMockTenant = (overrides: Partial<typeof mockTenant> = {}) => ({
  ...mockTenant,
  ...overrides,
})

export const createMockDatabase = (overrides: Partial<typeof mockDatabase> = {}) => ({
  ...mockDatabase,
  ...overrides,
})

export const createMockTable = (overrides: Partial<typeof mockTable> = {}) => ({
  ...mockTable,
  ...overrides,
})

export const createMockColumn = (overrides: Partial<typeof mockColumn> = {}) => ({
  ...mockColumn,
  ...overrides,
})

export const createMockRow = (overrides: Partial<typeof mockRow> = {}) => ({
  ...mockRow,
  ...overrides,
})

// Common test assertions
export const expectElementToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectElementNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectElementToBeDisabled = (element: HTMLElement | null) => {
  expect(element).toBeDisabled()
}

export const expectElementToBeEnabled = (element: HTMLElement | null) => {
  expect(element).toBeEnabled()
}

export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeVisible()
}

export const expectElementToBeHidden = (element: HTMLElement | null) => {
  expect(element).not.toBeVisible()
}
