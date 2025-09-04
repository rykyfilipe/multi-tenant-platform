/** @format */

import { NextRequest } from 'next/server';
import { GET as getRealDataHandler } from '@/app/api/tenants/[tenantId]/analytics/real-data/route';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  userActivity: {
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  databaseActivity: {
    findMany: jest.fn(),
  },
  systemMetrics: {
    findMany: jest.fn(),
  },
  apiUsage: {
    findMany: jest.fn(),
  },
  errorLog: {
    findMany: jest.fn(),
  },
}));

// Mock session functions
jest.mock('@/lib/session', () => ({
  requireAuthResponse: jest.fn(),
  requireTenantAccess: jest.fn(),
  getUserId: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuthResponse = require('@/lib/session').requireAuthResponse as jest.MockedFunction<any>;
const mockRequireTenantAccess = require('@/lib/session').requireTenantAccess as jest.MockedFunction<any>;
const mockGetUserId = require('@/lib/session').getUserId as jest.MockedFunction<any>;

describe('Analytics Real Data API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockRequireAuthResponse.mockResolvedValue({
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(401);
  });

  it('returns 403 when user does not have tenant access', async () => {
    mockRequireAuthResponse.mockResolvedValue({
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
    });
    mockGetUserId.mockReturnValue(1);
    mockRequireTenantAccess.mockReturnValue({
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(403);
  });

  it('returns real-time analytics data successfully', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
    };

    mockRequireAuthResponse.mockResolvedValue(mockSession);
    mockGetUserId.mockReturnValue(1);
    mockRequireTenantAccess.mockReturnValue(null);

    // Mock Prisma responses
    mockPrisma.userActivity.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        userId: 1,
        action: 'USER_CREATED',
      },
      {
        createdAt: new Date('2024-01-02'),
        userId: 2,
        action: 'USER_CREATED',
      },
    ]);

    mockPrisma.user.count.mockResolvedValue(50);

    mockPrisma.databaseActivity.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        action: 'SELECT',
        metadata: { responseTime: 120 },
      },
    ]);

    mockPrisma.systemMetrics.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        cpuUsage: 45.5,
        memoryUsage: 60.2,
        diskUsage: 30.1,
        networkLatency: 50,
      },
    ]);

    mockPrisma.apiUsage.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        statusCode: 200,
        responseTime: 150,
      },
    ]);

    mockPrisma.errorLog.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01'),
        errorType: 'SYSTEM_ERROR',
        errorMessage: 'Test error',
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('realTimeData');
    expect(data.data).toHaveProperty('businessData');
    expect(data.data).toHaveProperty('systemData');
    expect(data.data).toHaveProperty('lastUpdated');
  });

  it('handles database errors gracefully', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
    };

    mockRequireAuthResponse.mockResolvedValue(mockSession);
    mockGetUserId.mockReturnValue(1);
    mockRequireTenantAccess.mockReturnValue(null);

    // Mock Prisma to throw an error
    mockPrisma.userActivity.findMany.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database connection failed');
  });

  it('calculates user growth correctly', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
    };

    mockRequireAuthResponse.mockResolvedValue(mockSession);
    mockGetUserId.mockReturnValue(1);
    mockRequireTenantAccess.mockReturnValue(null);

    // Mock user activity data for current week
    mockPrisma.userActivity.findMany
      .mockResolvedValueOnce([ // First call for current week
        { createdAt: new Date('2024-01-01'), userId: 1, action: 'USER_CREATED' },
        { createdAt: new Date('2024-01-02'), userId: 2, action: 'USER_CREATED' },
      ])
      .mockResolvedValueOnce([ // Second call for previous week
        { createdAt: new Date('2023-12-25'), userId: 3, action: 'USER_CREATED' },
      ]);

    mockPrisma.user.count.mockResolvedValue(50);

    // Mock other Prisma calls
    mockPrisma.databaseActivity.findMany.mockResolvedValue([]);
    mockPrisma.systemMetrics.findMany.mockResolvedValue([]);
    mockPrisma.apiUsage.findMany.mockResolvedValue([]);
    mockPrisma.errorLog.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.data.realTimeData.userActivity).toBeDefined();
    expect(data.data.realTimeData.userActivity.newUsers).toBe(2);
    expect(data.data.realTimeData.userActivity.userGrowth).toBe(100); // 2/1 * 100
  });

  it('processes system performance data correctly', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
    };

    mockRequireAuthResponse.mockResolvedValue(mockSession);
    mockGetUserId.mockReturnValue(1);
    mockRequireTenantAccess.mockReturnValue(null);

    // Mock empty data for other calls
    mockPrisma.userActivity.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.databaseActivity.findMany.mockResolvedValue([]);
    mockPrisma.apiUsage.findMany.mockResolvedValue([]);
    mockPrisma.errorLog.findMany.mockResolvedValue([]);

    // Mock system metrics data
    mockPrisma.systemMetrics.findMany.mockResolvedValue([
      {
        createdAt: new Date('2024-01-01T00:00:00Z'),
        cpuUsage: 45.5,
        memoryUsage: 60.2,
        diskUsage: 30.1,
        networkLatency: 50,
      },
      {
        createdAt: new Date('2024-01-01T01:00:00Z'),
        cpuUsage: 50.0,
        memoryUsage: 65.0,
        diskUsage: 32.0,
        networkLatency: 55,
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.data.realTimeData.systemPerformance).toBeDefined();
    expect(data.data.realTimeData.systemPerformance.cpuUsage).toBe(47.75); // Average of 45.5 and 50.0
    expect(data.data.realTimeData.systemPerformance.memoryUsage).toBe(62.6); // Average of 60.2 and 65.0
  });

  it('handles missing data gracefully', async () => {
    const mockSession = {
      user: { id: '1', email: 'test@example.com', role: 'ADMIN' },
    };

    mockRequireAuthResponse.mockResolvedValue(mockSession);
    mockGetUserId.mockReturnValue(1);
    mockRequireTenantAccess.mockReturnValue(null);

    // Mock all Prisma calls to return empty arrays
    mockPrisma.userActivity.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.databaseActivity.findMany.mockResolvedValue([]);
    mockPrisma.systemMetrics.findMany.mockResolvedValue([]);
    mockPrisma.apiUsage.findMany.mockResolvedValue([]);
    mockPrisma.errorLog.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/tenants/1/analytics/real-data');
    const response = await getRealDataHandler(request, { params: Promise.resolve({ tenantId: '1' }) });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.data.realTimeData).toBeDefined();
    expect(data.data.realTimeData.userActivity.totalUsers).toBe(0);
    expect(data.data.realTimeData.userActivity.activeUsers).toBe(0);
    expect(data.data.realTimeData.userActivity.newUsers).toBe(0);
  });
});
