// Mock the entire Prisma module before importing auth functions
jest.mock('../../../src/lib/prisma', () => ({
  findUniqueWithCache: jest.fn(),
  findFirstWithCache: jest.fn(),
  DEFAULT_CACHE_STRATEGIES: {
    user: { ttl: 300, swr: 60 },
    tenant: { ttl: 300, swr: 60 },
    table: { ttl: 300, swr: 60 },
    column: { ttl: 300, swr: 60 }
  }
}))

// Mock Response for Jest environment
global.Response = class MockResponse {
  public status: number
  public statusText: string
  public headers: Headers
  
  constructor(public body: any, public init?: any) {
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Headers(init?.headers || {})
  }
  
  static json = jest.fn()
  static error = jest.fn()
  static redirect = jest.fn()
} as any

import {
  generateToken,
  hashPassword,
  verifyPassword,
  isAdmin,
  verifyLogin,
  getUserId,
  getUserRole,
  getUserFromRequest,
  checkUserTenantAccess,
  verifyToken,
  checkTableEditPermission,
  checkColumnEditPermission,
  canUserWrite,
  canUserRead,
  validatePublicApiAccess,
} from '../../../src/lib/auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Mock Prisma - will be mocked in individual tests as needed

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('Auth Utilities', () => {
  const mockJwtSecret = process.env.JWT_SECRET || 'test-secret'
  const mockPublicJwtSecret = process.env.PUBLIC_JWT_SECRET || 'public-test-secret'
  
  // Mock Request object - create a proper mock that matches the Request interface
  const createMockRequest = (headers: Record<string, string> = {}) => {
    const mockHeaders = new Headers()
    Object.entries(headers).forEach(([key, value]) => {
      mockHeaders.set(key, value)
    })
    
    return {
      headers: mockHeaders,
      url: 'http://localhost',
      method: 'GET',
      // Add other required Request properties as needed
      cache: 'default' as RequestCache,
      credentials: 'same-origin' as RequestCredentials,
      destination: '' as RequestDestination,
      integrity: '',
      keepalive: false,
      mode: 'cors' as RequestMode,
      redirect: 'follow' as RequestRedirect,
      referrer: '',
      referrerPolicy: 'no-referrer' as ReferrerPolicy,
      signal: {} as AbortSignal,
      body: null,
      bodyUsed: false,
      arrayBuffer: jest.fn(),
      blob: jest.fn(),
      formData: jest.fn(),
      json: jest.fn(),
      text: jest.fn(),
      clone: jest.fn(),
    } as any // Use 'any' to avoid TypeScript issues with the full Request interface
  }
  
  beforeEach(() => {
    process.env.JWT_SECRET = mockJwtSecret
    process.env.PUBLIC_JWT_SECRET = mockPublicJwtSecret
    jest.clearAllMocks()
  })
  
  beforeAll(() => {
    process.env.JWT_SECRET = mockJwtSecret
    process.env.PUBLIC_JWT_SECRET = mockPublicJwtSecret
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: 1, role: 'ADMIN' }
      const token = generateToken(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      
      const decoded = jwt.verify(token, mockJwtSecret) as any
      expect(decoded.userId).toBe(1)
      expect(decoded.role).toBe('ADMIN')
    })

    it('should generate token with custom expiration', () => {
      const payload = { userId: 1, role: 'ADMIN' }
      const token = generateToken(payload, '1h')
      
      const decoded = jwt.verify(token, mockJwtSecret) as any
      expect(decoded.exp).toBeDefined()
    })

    it('should generate token with custom JWT secret', () => {
      const payload = { userId: 1, role: 'ADMIN' }
      const customSecret = 'custom-secret'
      const token = generateToken(payload, undefined, customSecret)
      
      const decoded = jwt.verify(token, customSecret) as any
      expect(decoded.userId).toBe(1)
    })
  })

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testpassword'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)
      
      const result = await hashPassword(password)
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 14)
      expect(result).toBe(hashedPassword)
    })

    it('should handle hashing errors', async () => {
      const password = 'testpassword'
      
      ;(bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'))
      
      await expect(hashPassword(password)).rejects.toThrow('Hashing failed')
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const inputPassword = 'testpassword'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      
      const result = await verifyPassword(inputPassword, hashedPassword)
      
      expect(bcrypt.compare).toHaveBeenCalledWith(inputPassword, hashedPassword)
      expect(result).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const inputPassword = 'wrongpassword'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      
      const result = await verifyPassword(inputPassword, hashedPassword)
      
      expect(result).toBe(false)
    })

    it('should handle verification errors gracefully', async () => {
      const inputPassword = 'testpassword'
      const hashedPassword = 'hashedpassword'
      
      ;(bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Verification failed'))
      
      const result = await verifyPassword(inputPassword, hashedPassword)
      
      expect(result).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin role', async () => {
      const token = jwt.sign({ role: 'ADMIN' }, mockJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` }) 
      
      const result = await isAdmin(request)
      expect(result).toBe(true)
    })

    it('should return false for non-admin role', async () => {
      const token = jwt.sign({ role: 'USER' }, mockJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      const result = await isAdmin(request)
      expect(result).toBe(false)
    })

    it('should return false for missing token', async () => {
      const request = createMockRequest()
      
      const result = await isAdmin(request)
      expect(result).toBe(false)
    })

    it('should return false for invalid token', async () => {
      const request = createMockRequest({ Authorization: 'Bearer invalid-token' })
      
      const result = await isAdmin(request)
      expect(result).toBe(false)
    })
  })

  describe('verifyLogin', () => {
    it('should return true for valid token', () => {
      const token = jwt.sign({ userId: 1 }, mockJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      const result = verifyLogin(request)
      expect(result).toBe(true)
    })

    it('should return false for missing token', () => {
      const request = createMockRequest()
      
      const result = verifyLogin(request)
      expect(result).toBe(false)
    })

    it('should return false for invalid token', () => {
      const request = createMockRequest({ Authorization: 'Bearer invalid-token' })
      
      const result = verifyLogin(request)
      expect(result).toBe(false)
    })
  })

  describe('getUserId', () => {
    it('should extract user ID from valid token', () => {
      const token = jwt.sign({ userId: 123 }, mockJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      const result = getUserId(request)
      expect(result).toBe(123)
    })

    it('should return null for missing token', () => {
      const request = createMockRequest()
      
      const result = getUserId(request)
      expect(result).toBeNull()
    })

    it('should return null for invalid token', () => {
      const request = createMockRequest({ Authorization: 'Bearer invalid-token' })
      
      const result = getUserId(request)
      expect(result).toBeNull()
    })

    it('should use custom JWT secret', () => {
      const token = jwt.sign({ userId: 456 }, mockPublicJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      const result = getUserId(request, mockPublicJwtSecret)
      expect(result).toBe(456)
    })
  })

  describe('getUserRole', () => {
    it('should extract user role from valid token', () => {
      const token = jwt.sign({ role: 'ADMIN' }, mockJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      const result = getUserRole(request)
      expect(result).toBe('ADMIN')
    })

    it('should return null for missing token', () => {
      const request = createMockRequest()
      
      const result = getUserRole(request)
      expect(result).toBeNull()
    })

    it('should return null for invalid token', () => {
      const request = createMockRequest({ Authorization: 'Bearer invalid-token' })
      
      const result = getUserRole(request)
      expect(result).toBeNull()
    })
  })

  describe('getUserFromRequest', () => {
    it('should return user data for valid request', async () => {
      const token = jwt.sign({ userId: 1, role: 'ADMIN' }, mockJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      const result = await getUserFromRequest(request)
      
      expect(result).toEqual({ userId: 1, role: 'ADMIN' })
    })

    it('should return 401 response for missing token', async () => {
      const request = createMockRequest()
      
      const result = await getUserFromRequest(request)
      
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(401)
    })

    it('should return 401 response for invalid token', async () => {
      const request = createMockRequest({ Authorization: 'Bearer invalid-token' })
      
      const result = await getUserFromRequest(request)
      
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).status).toBe(401)
    })
  })

  describe('checkUserTenantAccess', () => {
    // Import the mocked Prisma functions
    const { findFirstWithCache } = require('../../../src/lib/prisma')
    
    it('should return true if user is member of tenant', async () => {
      findFirstWithCache.mockResolvedValue({ id: 1, tenantId: 1 })
      
      const result = await checkUserTenantAccess(1, 1)
      
      expect(result).toBe(true)
      expect(findFirstWithCache).toHaveBeenCalledWith(
        undefined,
        { where: { id: 1, tenantId: 1 } },
        expect.anything()
      )
    })

    it('should return false if user is not member of tenant', async () => {
      findFirstWithCache.mockResolvedValue(null)
      
      const result = await checkUserTenantAccess(1, 2)
      
      expect(result).toBe(false)
    })
  })

  describe('verifyToken', () => {
    it('should return true for valid token', () => {
      const token = jwt.sign({ userId: 1 }, mockJwtSecret)
      
      const result = verifyToken(token)
      expect(result).toBe(true)
    })

    it('should return false for invalid token', () => {
      const result = verifyToken('invalid-token')
      expect(result).toBe(false)
    })
  })

  describe('checkTableEditPermission', () => {
    // Import the mocked Prisma functions
    const { findUniqueWithCache, findFirstWithCache } = require('../../../src/lib/prisma')
    
    beforeEach(() => {
      jest.clearAllMocks()
    })
    
    it('should return true for admin user', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'ADMIN' })
      
      const result = await checkTableEditPermission(1, 1, 1)
      
      expect(result).toBe(true)
    })

    it('should return true for user with table edit permission', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'USER' })
      findFirstWithCache.mockResolvedValue({ canEdit: true })
      
      const result = await checkTableEditPermission(1, 1, 1)
      
      expect(result).toBe(true)
    })

    it('should return false for user without permission', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'USER' })
      findFirstWithCache.mockResolvedValue(null)
      
      const result = await checkTableEditPermission(1, 1, 1)
      
      expect(result).toBe(false)
    })

    it('should return false for non-existent user', async () => {
      findUniqueWithCache.mockResolvedValue(null)
      
      const result = await checkTableEditPermission(1, 1, 1)
      
      expect(result).toBe(false)
    })
  })

  describe('checkColumnEditPermission', () => {
    // Import the mocked Prisma functions
    const { findUniqueWithCache, findFirstWithCache } = require('../../../src/lib/prisma')
    
    it('should return true for admin user', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'ADMIN' })
      
      const result = await checkColumnEditPermission(1, 1, 1, 1)
      
      expect(result).toBe(true)
    })

    it('should return true for user with column edit permission', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'USER' })
      findFirstWithCache.mockResolvedValueOnce({ canEdit: true })
      
      const result = await checkColumnEditPermission(1, 1, 1, 1)
      
      expect(result).toBe(true)
    })

    it('should fallback to table permission check', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'USER' })
      findFirstWithCache.mockResolvedValueOnce(null) // No column permission
      findFirstWithCache.mockResolvedValueOnce({ canEdit: true }) // Table permission
      
      const result = await checkColumnEditPermission(1, 1, 1, 1)
      
      expect(result).toBe(true)
    })

    it('should return false for user without any permission', async () => {
      findUniqueWithCache.mockResolvedValue({ role: 'USER' })
      findFirstWithCache.mockResolvedValue(null)
      
      const result = await checkColumnEditPermission(1, 1, 1, 1)
      
      expect(result).toBe(false)
    })
  })

  describe('canUserWrite', () => {
    it('should return true for ADMIN role', () => {
      expect(canUserWrite('ADMIN')).toBe(true)
    })

    it('should return true for EDITOR role', () => {
      expect(canUserWrite('EDITOR')).toBe(true)
    })

    it('should return false for VIEWER role', () => {
      expect(canUserWrite('VIEWER')).toBe(false)
    })

    it('should return false for unknown role', () => {
      expect(canUserWrite('UNKNOWN')).toBe(false)
    })
  })

  describe('canUserRead', () => {
    it('should return true for ADMIN role', () => {
      expect(canUserRead('ADMIN')).toBe(true)
    })

    it('should return true for EDITOR role', () => {
      expect(canUserRead('EDITOR')).toBe(true)
    })

    it('should return true for VIEWER role', () => {
      expect(canUserRead('VIEWER')).toBe(true)
    })

    it('should return false for unknown role', () => {
      expect(canUserRead('UNKNOWN')).toBe(false)
    })
  })

  describe('validatePublicApiAccess', () => {
    // Import the mocked Prisma functions
    const { findUniqueWithCache } = require('../../../src/lib/prisma')
    

    
    it('should return valid access for authenticated user', async () => {
      const token = jwt.sign({ userId: 1, role: 'ADMIN' }, mockPublicJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      findUniqueWithCache.mockResolvedValue({ tenantId: 1, role: 'ADMIN' })
      
      const result = await validatePublicApiAccess(request)
      
      expect(result).toEqual({
        isValid: true,
        userId: 1,
        role: 'ADMIN',
        tenantId: 1,
      })
    })

    it('should return error for missing authorization header', async () => {
      const request = createMockRequest()
      
      const result = await validatePublicApiAccess(request)
      
      expect(result).toEqual({
        isValid: false,
        error: 'Missing or invalid authorization header',
        status: 401,
      })
    })

    it('should return error for invalid authorization format', async () => {
      const request = createMockRequest({ Authorization: 'InvalidFormat token' })
      
      const result = await validatePublicApiAccess(request)
      
      expect(result).toEqual({
        isValid: false,
        error: 'Missing or invalid authorization header',
        status: 401,
      })
    })

    it('should return error for invalid token', async () => {
      const request = createMockRequest({ Authorization: 'Bearer invalid-token' })
      
      const result = await validatePublicApiAccess(request)
      
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid token data',
        status: 401,
      })
    })

    it('should return error for user without tenant', async () => {
      const token = jwt.sign({ userId: 1, role: 'ADMIN' }, mockPublicJwtSecret)
      const request = createMockRequest({ Authorization: `Bearer ${token}` })
      
      findUniqueWithCache.mockResolvedValue(null)
      
      const result = await validatePublicApiAccess(request)
      
      expect(result).toEqual({
        isValid: false,
        error: 'User not associated with any tenant',
        status: 403,
      })
    })
  })
})
