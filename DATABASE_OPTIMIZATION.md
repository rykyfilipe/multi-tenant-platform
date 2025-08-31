<!-- @format -->

# Database Optimization Guide

## 🚨 Problem: "Too Many Database Connections"

The error `FATAL: too many connections for role "prisma_migration"` indicates
that your application is opening more database connections than the database
server can handle.

## 🔧 Solutions Implemented

### 1. Connection Pool Management

We've implemented a connection pool manager that:

- Limits concurrent connections to 10 (configurable)
- Queues connection requests when pool is full
- Automatically retries failed operations
- Monitors connection pool health

### 2. Prisma Client Optimization

The Prisma client has been optimized with:

- Proper connection lifecycle management
- Graceful shutdown handling
- Error retry mechanisms
- Connection pooling configuration

### 3. Database Configuration

Created configuration files:

- `src/lib/database-config.ts` - Database settings
- `src/lib/database-optimization.ts` - Connection management
- `src/lib/prisma.ts` - Optimized Prisma client

## 📋 Environment Variables

Add these to your `.env` file:

```bash
# Database Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_ACQUIRE_TIMEOUT=30000
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000

# Performance Settings
DATABASE_ENABLE_QUERY_CACHE=true
DATABASE_CACHE_TTL=300000
DATABASE_ENABLE_CONNECTION_POOLING=true
```

## 🗄️ PostgreSQL Configuration

### Update your `postgresql.conf`:

```conf
# Connection settings
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# Connection pool settings
max_prepared_transactions = 0
```

### Update your `pg_hba.conf`:

```conf
# Allow connections from your application
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

## 🔄 Usage Examples

### Basic Query with Connection Management:

```typescript
import { executeWithConnection } from "@/lib/database-optimization";

const result = await executeWithConnection(async () => {
	return await prisma.user.findMany();
});
```

### Batch Operations:

```typescript
import { executeBatchWithConnection } from "@/lib/database-optimization";

const operations = [
	() => prisma.user.findMany(),
	() => prisma.post.findMany(),
	() => prisma.comment.findMany(),
];

const results = await executeBatchWithConnection(operations, 3);
```

### Monitor Connection Pool:

```typescript
import { databaseOptimizer } from "@/lib/database-optimization";

const status = databaseOptimizer.getConnectionStatus();
console.log("Connection pool status:", status);
```

## 🚀 Performance Best Practices

### 1. Use Connection Pooling

- Never create new Prisma clients for each request
- Use the singleton instance from `src/lib/prisma.ts`
- Implement proper connection lifecycle management

### 2. Optimize Queries

- Use `select` to limit returned fields
- Implement pagination for large datasets
- Use database indexes for frequently queried fields

### 3. Implement Caching

- Cache frequently accessed data
- Use Redis or in-memory caching
- Implement cache invalidation strategies

### 4. Batch Operations

- Group multiple queries when possible
- Use transactions for related operations
- Implement proper error handling and rollbacks

## 📊 Monitoring and Debugging

### Connection Pool Status:

```typescript
import { databaseMonitor } from "@/lib/database-config";

// Check database health
const isHealthy = await databaseMonitor.checkHealth();

// Get connection status
const status = databaseMonitor.getStatus();
```

### Enable Query Logging (Development):

```typescript
// In src/lib/prisma.ts
log: process.env.NODE_ENV === "development"
	? ["query", "error", "warn"]
	: ["error"];
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Connection Timeout**

   - Increase `DATABASE_POOL_ACQUIRE_TIMEOUT`
   - Check network connectivity
   - Verify database server capacity

2. **Pool Exhaustion**

   - Reduce `DATABASE_POOL_MAX`
   - Implement connection queuing
   - Add connection monitoring

3. **Query Performance**
   - Analyze slow queries with `EXPLAIN ANALYZE`
   - Add database indexes
   - Optimize query patterns

### Debug Commands:

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection details
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND pid <> pg_backend_pid();
```

## 🔒 Security Considerations

1. **Connection Limits**

   - Set appropriate `max_connections` in PostgreSQL
   - Monitor connection usage patterns
   - Implement rate limiting if needed

2. **Authentication**

   - Use strong passwords
   - Implement connection encryption (SSL)
   - Regular security audits

3. **Access Control**
   - Limit database user permissions
   - Use connection pooling with authentication
   - Monitor suspicious connection patterns

## 📈 Performance Metrics

Monitor these key metrics:

- **Connection Pool Utilization**: Should stay below 80%
- **Query Response Time**: Target < 100ms for simple queries
- **Connection Wait Time**: Should be minimal
- **Error Rate**: Monitor connection failures
- **Throughput**: Queries per second

## 🚀 Deployment Checklist

- [ ] Set appropriate environment variables
- [ ] Configure PostgreSQL connection limits
- [ ] Test connection pool under load
- [ ] Monitor connection metrics
- [ ] Implement health checks
- [ ] Set up alerting for connection issues
- [ ] Document connection management procedures

## 📚 Additional Resources

- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Database Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Note**: This optimization should resolve the "too many connections" error. If
issues persist, check your database server configuration and consider scaling
your database resources.
