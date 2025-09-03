import { NextRequest } from 'next/server'
import { GET as getCustomTablesHandler } from '@/app/api/custom-tables/route'
import { getServerSession } from 'next-auth'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  table: {
    findMany: jest.fn(),
  },
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrisma = require('@/lib/prisma')

describe('Custom Tables API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/custom-tables', () => {
    const mockSession = {
      user: {
        email: 'test@example.com',
        id: '1',
        name: 'Test User',
      },
    }

    const mockUser = {
      id: 1,
      tenantId: 1,
    }

    const mockTables = [
      {
        id: 1,
        name: 'users',
        description: 'User table',
        columns: [
          {
            id: 1,
            name: 'id',
            type: 'INTEGER',
            required: true,
            primary: true,
            semanticType: 'id',
            order: 1,
          },
          {
            id: 2,
            name: 'email',
            type: 'VARCHAR',
            required: true,
            primary: false,
            semanticType: 'email',
            order: 2,
          },
        ],
      },
      {
        id: 2,
        name: 'products',
        description: 'Product table',
        columns: [
          {
            id: 3,
            name: 'id',
            type: 'INTEGER',
            required: true,
            primary: true,
            semanticType: 'id',
            order: 1,
          },
          {
            id: 4,
            name: 'name',
            type: 'VARCHAR',
            required: true,
            primary: false,
            semanticType: 'text',
            order: 2,
          },
        ],
      },
    ]

    it('should return custom tables for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.table.findMany.mockResolvedValue(mockTables)

      const request = new NextRequest('http://localhost/api/custom-tables')
      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toEqual({
        id: 1,
        name: 'users',
        description: 'User table',
        columns: [
          {
            id: 1,
            name: 'id',
            type: 'INTEGER',
            required: true,
            primary: true,
            semanticType: 'id',
          },
          {
            id: 2,
            name: 'email',
            type: 'VARCHAR',
            required: true,
            primary: false,
            semanticType: 'email',
          },
        ],
      })

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, tenantId: true },
      })

      expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
        where: {
          database: {
            tenantId: 1,
          },
          isPublic: true,
        },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              type: true,
              required: true,
              primary: true,
              semanticType: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(mockPrisma.table.findMany).not.toHaveBeenCalled()
    })

    it('should return 401 for user without email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: '1',
          name: 'Test User',
          // No email
        },
      })

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(mockPrisma.table.findMany).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, tenantId: true },
      })

      expect(mockPrisma.table.findMany).not.toHaveBeenCalled()
    })

    it('should return empty array for user without tenant', async () => {
      const userWithoutTenant = {
        id: 1,
        tenantId: null,
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutTenant)

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, tenantId: true },
      })

      expect(mockPrisma.table.findMany).not.toHaveBeenCalled()
    })

    it('should return empty array when no public tables exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.table.findMany.mockResolvedValue([])

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])

      expect(mockPrisma.table.findMany).toHaveBeenCalledWith({
        where: {
          database: {
            tenantId: 1,
          },
          isPublic: true,
        },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              type: true,
              required: true,
              primary: true,
              semanticType: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      })
    })

    it('should handle tables with no columns', async () => {
      const tablesWithoutColumns = [
        {
          id: 1,
          name: 'empty_table',
          description: 'Empty table',
          columns: [],
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.table.findMany.mockResolvedValue(tablesWithoutColumns)

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0]).toEqual({
        id: 1,
        name: 'empty_table',
        description: 'Empty table',
        columns: [],
      })
    })

    it('should handle tables with null description', async () => {
      const tablesWithNullDescription = [
        {
          id: 1,
          name: 'table_without_description',
          description: null,
          columns: [],
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.table.findMany.mockResolvedValue(tablesWithNullDescription)

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0]).toEqual({
        id: 1,
        name: 'table_without_description',
        description: '',
        columns: [],
      })
    })

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle table query errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.table.findMany.mockRejectedValue(new Error('Table query failed'))

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle session errors gracefully', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Session error'))

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should properly transform table data structure', async () => {
      const complexTable = {
        id: 3,
        name: 'complex_table',
        description: 'Complex table with various column types',
        columns: [
          {
            id: 5,
            name: 'id',
            type: 'INTEGER',
            required: true,
            primary: true,
            semanticType: 'id',
            order: 1,
          },
          {
            id: 6,
            name: 'created_at',
            type: 'TIMESTAMP',
            required: false,
            primary: false,
            semanticType: 'datetime',
            order: 2,
          },
          {
            id: 7,
            name: 'is_active',
            type: 'BOOLEAN',
            required: false,
            primary: false,
            semanticType: 'boolean',
            order: 3,
          },
        ],
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.table.findMany.mockResolvedValue([complexTable])

      const response = await getCustomTablesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].columns).toHaveLength(3)
      expect(data[0].columns[0]).toEqual({
        id: 5,
        name: 'id',
        type: 'INTEGER',
        required: true,
        primary: true,
        semanticType: 'id',
      })
      expect(data[0].columns[1]).toEqual({
        id: 6,
        name: 'created_at',
        type: 'TIMESTAMP',
        required: false,
        primary: false,
        semanticType: 'datetime',
      })
      expect(data[0].columns[2]).toEqual({
        id: 7,
        name: 'is_active',
        type: 'BOOLEAN',
        required: false,
        primary: false,
        semanticType: 'boolean',
      })
    })
  })
})
