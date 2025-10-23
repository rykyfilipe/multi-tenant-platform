# Multi-Tenant Architecture

The multi-tenant architecture is the foundation of the platform, providing complete data isolation and tenant-specific configurations while maintaining scalability and performance.


## Architecture Components

### 1. Tenant Management

#### Core Models
```typescript
// Tenant entity with complete configuration
model Tenant {
  id                   Int                   @id @default(autoincrement())
  name                 String                @unique
  adminId              Int                   @unique
  address              String?
  companyEmail         String?
  language             String?
  logoUrl              String?
  theme                String?
  timezone             String?
  defaultCurrency      String?               @default("USD")
  enabledModules       String[]              @default([])
  // ... additional fields
}
```

#### Key Features
- **Tenant Registration**: Automatic tenant creation on user registration
- **Admin Assignment**: Each tenant has a designated admin user
- **Module Management**: Enable/disable features per tenant
- **Customization**: Branding, language, and currency settings

### 2. Database Isolation

#### Database-per-Tenant Strategy
```typescript
// Each tenant gets their own database
model Database {
  id        Int     @id @default(autoincrement())
  name      String
  tenantId  Int
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  tables    Table[]
}
```

#### Benefits
- **Complete Isolation**: No shared tables between tenants
- **Independent Scaling**: Scale databases per tenant needs
- **Data Security**: Physical separation prevents data leaks
- **Custom Schemas**: Each tenant can have unique table structures

### 3. User Management

#### Multi-Tenant User System
```typescript
model User {
  id               Int      @id @default(autoincrement())
  email            String   @unique
  role             Role
  tenantId         Int?     // Legacy compatibility
  activeTenantId   Int?     // Current active tenant
  // ... additional fields
}

model UserTenant {
  id       Int @id @default(autoincrement())
  userId   Int
  tenantId Int
  role     String
  user     User   @relation(fields: [userId], references: [id])
  tenant   Tenant @relation(fields: [tenantId], references: [id])
}
```

#### Features
- **Cross-Tenant Users**: Users can belong to one tenant
- **Role-Based Access**: Different roles per tenant
- **Permission Inheritance**: Tenant-level permissions

## Implementation Details

### 1. Tenant Resolution

#### Middleware-Based Resolution
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Extract tenant ID from URL pattern
  const tenantMatch = pathname.match(/\/tenants\/(\d+)/);
  if (tenantMatch) {
    const tenantId = tenantMatch[1];
    
    // Verify user has access to tenant
    const hasAccess = await verifyTenantAccess(userId, tenantId);
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Add tenant context to request
    request.headers.set('x-tenant-id', tenantId);
  }
}
```

#### API Route Protection
```typescript
// src/lib/session.ts
export async function requireTenantAccess(
  session: Session, 
  tenantId: string
): Promise<NextResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userTenants: true }
  });
  
  const hasAccess = user?.userTenants.some(
    ut => ut.tenantId === parseInt(tenantId)
  );
  
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Access denied" }, 
      { status: 403 }
    );
  }
  
  return null;
}
```

### 2. Database Connection Management

#### Dynamic Database Connections
```typescript
// src/lib/prisma.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.YDV_DATABASE_URL
    }
  }
});

// Tenant-specific database operations
export async function getTenantDatabase(tenantId: number) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { databases: true }
  });
  
  return tenant?.databases[0]; // Primary database
}
```

### 3. Module System

#### Dynamic Module Loading
```typescript
// src/lib/modules.ts
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  tables: TableDefinition[];
  dependencies?: string[];
}

export const AVAILABLE_MODULES: Record<string, ModuleDefinition> = {
  billing: {
    id: 'billing',
    name: 'Billing & Invoicing',
    description: 'Complete invoicing system with multi-currency support',
    tables: [
      { name: 'invoices', columns: [...] },
      { name: 'invoice_items', columns: [...] },
      { name: 'customers', columns: [...] }
    ]
  }
};
```

#### Module Activation
```typescript
// API: POST /api/tenants/[tenantId]/modules
export async function POST(request: Request) {
  const { moduleId, databaseId } = await request.json();
  
  // Validate tenant has required configuration
  if (moduleId === 'billing') {
    const tenantDetails = await validateBillingRequirements(tenantId);
    if (!tenantDetails.complete) {
      return NextResponse.json({
        error: "Billing details incomplete",
        missingFields: tenantDetails.missing
      }, { status: 400 });
    }
  }
  
  // Create module tables
  const createdTables = await createModuleTables(databaseId, moduleId);
  
  // Update tenant enabled modules
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { 
      enabledModules: { push: moduleId }
    }
  });
  
  return NextResponse.json({ createdTables });
}
```

## Security Considerations

### 1. Data Isolation

#### Tenant Boundary Enforcement
- **Database Level**: Virtual separation prevents cross-tenant queries
- **Application Level**: All queries include tenant ID filters
- **API Level**: Middleware validates tenant access on every request

#### Audit Logging
```typescript
model AuditLog {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  userId    Int
  action    String
  resource  String
  details   Json?
  timestamp DateTime @default(now())
}
```

### 2. Access Control

#### Role-Based Permissions
```typescript
model CustomRole {
  id          Int     @id @default(autoincrement())
  tenantId    Int
  name        String
  permissions Json    // Granular permission matrix
  tenant      Tenant  @relation(fields: [tenantId], references: [id])
}

model UserCustomRole {
  id       Int        @id @default(autoincrement())
  userId   Int
  roleId   Int
  user     User       @relation(fields: [userId], references: [id])
  role     CustomRole @relation(fields: [roleId], references: [id])
}
```

## Performance Optimizations

### 1. Connection Pooling

#### Database Connection Management
```typescript
// Optimized Prisma configuration
export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.YDV_DATABASE_URL }
  },
  log: ['query', 'info', 'warn', 'error'],
  // Connection pooling for multi-tenant scenarios
  __internal: {
    engine: {
      connectTimeout: 60000,
      pool: {
        min: 2,
        max: 10
      }
    }
  }
});
```

### 2. Caching Strategy

#### Tenant-Aware Caching
```typescript
// Cache invalidation with tenant context
export function invalidateCacheByTags(tags: string[], tenantId?: number) {
  const cacheKey = tenantId ? `${tenantId}:${tags.join(':')}` : tags.join(':');
  
  // Invalidate specific tenant cache
  cache.delete(cacheKey);
  
  // Invalidate global cache if needed
  if (!tenantId) {
    cache.clear();
  }
}
```

## Monitoring & Analytics

### 1. Tenant Usage Tracking

#### Resource Monitoring
```typescript
model TenantUsage {
  id           Int      @id @default(autoincrement())
  tenantId     Int
  resourceType String   // 'database', 'api_calls', 'storage'
  usage        Float
  timestamp    DateTime @default(now())
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
}
```

### 2. Performance Metrics

#### System Metrics
```typescript
model SystemMetrics {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  metricType  String   // 'response_time', 'error_rate', 'throughput'
  value       Float
  timestamp   DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}
```

## Common Issues & Solutions

### 1. Tenant Resolution Errors

**Problem**: Users accessing wrong tenant data
**Solution**: 
- Implement strict middleware validation
- Add tenant ID to all database queries
- Use database-level row-level security

### 2. Performance Issues

**Problem**: Slow queries across multiple tenants
**Solution**:
- Implement proper database indexing
- Use connection pooling
- Add query optimization and caching

### 3. Module Conflicts

**Problem**: Module dependencies causing conflicts
**Solution**:
- Implement dependency validation
- Use module versioning
- Provide migration scripts

## Future Enhancements

### 1. Advanced Multi-Tenancy
- **Hybrid Architecture**: Support for both shared and isolated databases
- **Tenant Cloning**: Copy tenant configurations and data
- **Cross-Tenant Analytics**: Aggregated reporting across tenants

### 2. Scalability Improvements
- **Horizontal Scaling**: Automatic tenant database distribution
- **Load Balancing**: Tenant-aware load balancing
- **Microservices**: Split functionality into tenant-aware services

### 3. Enterprise Features
- **Tenant Hierarchies**: Parent-child tenant relationships
- **Resource Quotas**: Per-tenant resource limits
- **Compliance Reporting**: Automated compliance checks per tenant
