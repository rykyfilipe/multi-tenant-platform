import createPredefinedTables from '@/lib/predefinedTables'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  table: {
    create: jest.fn()
  },
  column: {
    create: jest.fn()
  }
}))

const mockPrisma = require('@/lib/prisma')

describe('createPredefinedTables', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create predefined tables for a database', async () => {
    const databaseId = 1

    // Mock the table creation responses
    mockPrisma.table.create
      .mockResolvedValueOnce({ id: 1, name: 'customers' })
      .mockResolvedValueOnce({ id: 2, name: 'invoices' })
      .mockResolvedValueOnce({ id: 3, name: 'invoice_items' })

    // Mock column creation
    mockPrisma.column.create.mockResolvedValue({})

    await createPredefinedTables(databaseId)

    // Verify that tables were created
    expect(mockPrisma.table.create).toHaveBeenCalledTimes(3)
    
    // Check customers table creation
    expect(mockPrisma.table.create).toHaveBeenNthCalledWith(1, {
      data: {
        name: "customers",
        description: "Customer information",
        databaseId,
        isProtected: true,
        protectedType: "customers",
      }
    })

    // Check invoices table creation
    expect(mockPrisma.table.create).toHaveBeenNthCalledWith(2, {
      data: {
        name: "invoices",
        description: "Invoice headers",
        databaseId,
        isProtected: true,
        protectedType: "invoices",
      }
    })

    // Check invoice_items table creation
    expect(mockPrisma.table.create).toHaveBeenNthCalledWith(3, {
      data: {
        name: "invoice_items",
        description: "Invoice line items",
        databaseId,
        isProtected: true,
        protectedType: "invoice_items",
      }
    })
  })

  it('should handle errors during table creation', async () => {
    const databaseId = 1
    const error = new Error('Database connection failed')

    mockPrisma.table.create.mockRejectedValue(error)

    await expect(createPredefinedTables(databaseId)).rejects.toThrow('Database connection failed')
  })

  it('should create tables with correct protected types', async () => {
    const databaseId = 2

    mockPrisma.table.create
      .mockResolvedValueOnce({ id: 1, name: 'customers' })
      .mockResolvedValueOnce({ id: 2, name: 'invoices' })
      .mockResolvedValueOnce({ id: 3, name: 'invoice_items' })

    mockPrisma.column.create.mockResolvedValue({})

    await createPredefinedTables(databaseId)

    // Verify protected types
    const calls = mockPrisma.table.create.mock.calls
    expect(calls[0][0].data.protectedType).toBe('customers')
    expect(calls[1][0].data.protectedType).toBe('invoices')
    expect(calls[2][0].data.protectedType).toBe('invoice_items')
  })

  it('should mark all tables as protected', async () => {
    const databaseId = 3

    mockPrisma.table.create
      .mockResolvedValueOnce({ id: 1, name: 'customers' })
      .mockResolvedValueOnce({ id: 2, name: 'invoices' })
      .mockResolvedValueOnce({ id: 3, name: 'invoice_items' })

    mockPrisma.column.create.mockResolvedValue({})

    await createPredefinedTables(databaseId)

    // Verify all tables are marked as protected
    const calls = mockPrisma.table.create.mock.calls
    calls.forEach(call => {
      expect(call[0].data.isProtected).toBe(true)
    })
  })

  it('should use the provided databaseId for all tables', async () => {
    const databaseId = 999

    mockPrisma.table.create
      .mockResolvedValueOnce({ id: 1, name: 'customers' })
      .mockResolvedValueOnce({ id: 2, name: 'invoices' })
      .mockResolvedValueOnce({ id: 3, name: 'invoice_items' })

    mockPrisma.column.create.mockResolvedValue({})

    await createPredefinedTables(databaseId)

    // Verify databaseId is used for all tables
    const calls = mockPrisma.table.create.mock.calls
    calls.forEach(call => {
      expect(call[0].data.databaseId).toBe(databaseId)
    })
  })
})
