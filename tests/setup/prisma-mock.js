// Mock Prisma client for tests
const mockPrisma = {
  table: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  row: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  column: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  database: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  // Custom caching methods
  findManyWithCache: jest.fn(),
  findFirstWithCache: jest.fn(),
  findUniqueWithCache: jest.fn(),
  findUniqueOrThrowWithCache: jest.fn(),
  findFirstOrThrowWithCache: jest.fn(),
  createWithCache: jest.fn(),
  updateWithCache: jest.fn(),
  deleteWithCache: jest.fn(),
  upsertWithCache: jest.fn(),
  countWithCache: jest.fn(),
  aggregateWithCache: jest.fn(),
  groupByWithCache: jest.fn(),
};

// Mock DEFAULT_CACHE_STRATEGIES
const mockCacheStrategies = {
  table: { ttl: 300000, max: 100 },
  tableList: { ttl: 300000, max: 50 },
  column: { ttl: 300000, max: 200 },
  columnList: { ttl: 300000, max: 100 },
  row: { ttl: 60000, max: 1000 },
  rowList: { ttl: 60000, max: 500 },
};

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
  DEFAULT_CACHE_STRATEGIES: mockCacheStrategies,
}));

// Export the mock for use in tests
module.exports = { mockPrisma };
