import { NextRequest } from 'next/server'
import { POST as registerHandler } from '@/app/api/(auth)/register/route'
import { generateToken, hashPassword } from '@/lib/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  findUniqueWithCache: jest.fn(),
  user: {
    create: jest.fn(),
  },
  tenant: {
    create: jest.fn(),
  },
  database: {
    create: jest.fn(),
  },
}))

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  generateToken: jest.fn(),
  hashPassword: jest.fn(),
}))

const mockPrisma = require('@/lib/prisma')

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/(auth)/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN',
    }

    it('should register a new user successfully', async () => {
      // Mock successful registration flow
      mockPrisma.findUniqueWithCache.mockResolvedValue(null) // No existing user
      ;(hashPassword as jest.Mock).mockResolvedValue('hashedpassword')
      ;(generateToken as jest.Mock).mockReturnValue('jwt-token')

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      }

      const mockTenant = {
        id: 1,
        name: "John's tenant",
        adminId: 1,
      }

      const mockDatabase = {
        id: 1,
        tenantId: 1,
      }

      mockPrisma.user.create.mockResolvedValue(mockUser)
      mockPrisma.tenant.create.mockResolvedValue(mockTenant)
      mockPrisma.database.create.mockResolvedValue(mockDatabase)

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('User registered successfully')
      expect(data.user).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      })
      expect(data.tenant).toEqual(mockTenant)
      expect(data.token).toBe('jwt-token')

      // Verify function calls
      expect(mockPrisma.findUniqueWithCache).toHaveBeenCalledWith(
        expect.anything(),
        { where: { email: 'test@example.com' } },
        expect.anything()
      )
      expect(hashPassword).toHaveBeenCalledWith('password123')
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
          subscriptionStatus: 'active',
          subscriptionPlan: 'Free',
          subscriptionCurrentPeriodEnd: expect.any(Date),
        },
      })
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: {
          name: "John's tenant",
          adminId: 1,
          users: { connect: { id: 1 } },
        },
      })
      expect(mockPrisma.database.create).toHaveBeenCalledWith({
        data: {
          tenantId: 1,
        },
      })
      expect(generateToken).toHaveBeenCalledWith(
        { userId: 1, role: 'ADMIN' },
        '7d'
      )
    })

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Existing',
        lastName: 'User',
        role: 'ADMIN',
      }

      mockPrisma.findUniqueWithCache.mockResolvedValue(existingUser)

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User with this email already exists')

      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect(mockPrisma.tenant.create).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      }

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for weak password', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: '123',
      }

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(weakPasswordData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing password, firstName, lastName, role
      }

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should return 409 if admin already has a tenant', async () => {
      const existingTenant = {
        id: 1,
        name: "John's tenant",
        adminId: 1,
      }

      mockPrisma.findUniqueWithCache
        .mockResolvedValueOnce(null) // No existing user
        .mockResolvedValueOnce(existingTenant) // Existing tenant

      ;(hashPassword as jest.Mock).mockResolvedValue('hashedpassword')

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      }

      mockPrisma.user.create.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.message).toBe('Admin already has a tenant')

      expect(mockPrisma.tenant.create).not.toHaveBeenCalled()
      expect(mockPrisma.database.create).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.findUniqueWithCache.mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashedpassword')
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should handle different user roles', async () => {
      const userRoleData = {
        ...validRegistrationData,
        role: 'USER',
      }

      mockPrisma.findUniqueWithCache.mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashedpassword')
      ;(generateToken as jest.Mock).mockReturnValue('jwt-token')

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
      }

      const mockTenant = {
        id: 1,
        name: "John's tenant",
        adminId: 1,
      }

      const mockDatabase = {
        id: 1,
        tenantId: 1,
      }

      mockPrisma.user.create.mockResolvedValue(mockUser)
      mockPrisma.tenant.create.mockResolvedValue(mockTenant)
      mockPrisma.database.create.mockResolvedValue(mockDatabase)

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(userRoleData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role).toBe('USER')
      expect(generateToken).toHaveBeenCalledWith(
        { userId: 1, role: 'USER' },
        '7d'
      )
    })

    it('should handle password hashing errors', async () => {
      mockPrisma.findUniqueWithCache.mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'))

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle tenant creation errors', async () => {
      mockPrisma.findUniqueWithCache.mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashedpassword')

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      }

      mockPrisma.user.create.mockResolvedValue(mockUser)
      mockPrisma.tenant.create.mockRejectedValue(new Error('Tenant creation failed'))

      const request = new NextRequest('http://localhost/api/(auth)/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
