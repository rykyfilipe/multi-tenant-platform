/**
 * Database Connection Pool Configuration
 * Optimizes database connections for better performance
 */

import { PrismaClient } from '@/generated/prisma';

// Connection pool configuration
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
  
  // Minimum number of connections to maintain
  minConnections: parseInt(process.env.DATABASE_MIN_CONNECTIONS || '5'),
  
  // Connection timeout in milliseconds
  connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
  
  // Idle timeout in milliseconds
  idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
  
  // Maximum lifetime of a connection in milliseconds
  maxLifetime: parseInt(process.env.DATABASE_MAX_LIFETIME || '3600000'), // 1 hour
};

// Enhanced Prisma client with connection pooling
class DatabasePool {
  private static instance: DatabasePool;
  private prisma: PrismaClient;
  private connectionCount: number = 0;
  private maxConnections: number;

  constructor() {
    this.maxConnections = connectionPoolConfig.maxConnections;
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Execute query with connection management
   */
  async executeQuery<T>(
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      this.connectionCount++;
      
      if (this.connectionCount > this.maxConnections) {
        console.warn(`Connection pool limit exceeded: ${this.connectionCount}/${this.maxConnections}`);
      }

      const result = await queryFn(this.prisma);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      this.connectionCount = Math.max(0, this.connectionCount - 1);
    }
  }

  /**
   * Get connection pool status
   */
  getStatus(): {
    activeConnections: number;
    maxConnections: number;
    utilization: number;
  } {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.maxConnections,
      utilization: (this.connectionCount / this.maxConnections) * 100,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

// Export singleton instance
export const databasePool = DatabasePool.getInstance();
export const prisma = databasePool.getClient();
