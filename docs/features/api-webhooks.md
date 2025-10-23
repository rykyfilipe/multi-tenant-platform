# API & Webhook System

The API and webhook system provides comprehensive REST APIs for all platform operations and enables real-time notifications through webhooks for external system integration.

## Overview

The API and webhook system enables:

- **Comprehensive REST APIs**: Full CRUD operations for all platform resources
- **Real-Time Webhooks**: Event-driven notifications for external systems
- **API Authentication**: Secure API access with JWT tokens and API keys
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **API Documentation**: Interactive API documentation with examples
- **Webhook Management**: Secure webhook endpoint management and delivery

## Architecture Components

### 1. REST API Structure

#### API Endpoint Organization
```typescript
// API route structure (based on actual implementation)
/api/
├── auth/                    # Authentication endpoints
│   ├── login
│   ├── register
│   ├── refresh
│   └── logout
├── tenants/                 # Tenant management
│   ├── [tenantId]/
│   │   ├── databases/      # Database operations
│   │   │   ├── [databaseId]/
│   │   │   │   ├── tables/ # Table operations
│   │   │   │   │   ├── [tableId]/
│   │   │   │   │   │   ├── columns/ # Column operations
│   │   │   │   │   │   ├── rows/    # Row operations
│   │   │   │   │   │   └── batch/   # Batch operations
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── dashboards/     # Dashboard operations
│   │   │   └── [dashboardId]/
│   │   │       └── permissions/
│   │   ├── invoices/       # Invoice operations
│   │   │   ├── [invoiceId]/
│   │   │   │   └── download/
│   │   │   └── series/
│   │   ├── users/          # User management
│   │   │   └── [userId]/
│   │   │       ├── activate/
│   │   │       ├── deactivate/
│   │   │       └── permissions/
│   │   ├── webhooks/       # Webhook management
│   │   │   └── [webhookId]/
│   │   │       ├── deliveries/
│   │   │       └── test/
│   │   ├── analytics/      # Analytics data
│   │   ├── modules/        # Module management
│   │   ├── invitations/    # User invitations
│   │   ├── custom-roles/   # Custom role management
│   │   └── permissions/    # Permission management
├── anaf/                   # ANAF e-Factura integration
│   ├── auth-url/
│   ├── callback/
│   ├── send-invoice/
│   ├── invoice-status/
│   └── download-response/
└── health/                 # Health check endpoints
```

### 2. API Authentication

#### Authentication Methods
```typescript
// API authentication service
export class APIAuthenticationService {
  // JWT Token authentication
  static async authenticateWithJWT(token: string): Promise<AuthResult> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { userTenants: true }
      });
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      return {
        success: true,
        user,
        tenantId: payload.tenantId
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }
  }
  
  // API Key authentication
  static async authenticateWithAPIKey(apiKey: string): Promise<AuthResult> {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { include: { userTenants: true } } }
    });
    
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return {
        success: false,
        error: 'Invalid or inactive API key'
      };
    }
    
    // Check expiration
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return {
        success: false,
        error: 'API key has expired'
      };
    }
    
    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    });
    
    return {
      success: true,
      user: apiKeyRecord.user,
      tenantId: apiKeyRecord.tenantId
    };
  }
}

// API Key model
model APIKey {
  id          Int      @id @default(autoincrement())
  userId      Int
  tenantId    Int
  name        String
  key         String   @unique
  permissions Json     // API permissions
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}
```

### 3. Webhook System

#### Webhook Management
```typescript
// Webhook model
model Webhook {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  name        String
  url         String
  events      String[] // Events to subscribe to
  secret      String   // Webhook secret for verification
  isActive    Boolean  @default(true)
  retryCount  Int      @default(3)
  timeout     Int      @default(30) // seconds
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant        @relation(fields: [tenantId], references: [id])
  deliveries  WebhookDelivery[]
}

// Webhook delivery tracking
model WebhookDelivery {
  id          Int      @id @default(autoincrement())
  webhookId   Int
  event       String
  payload     Json
  status      DeliveryStatus @default(PENDING)
  response    Json?
  attempts    Int      @default(0)
  lastAttempt DateTime?
  createdAt   DateTime @default(now())
  
  webhook     Webhook  @relation(fields: [webhookId], references: [id])
}

enum DeliveryStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  RETRYING = "RETRYING"
}
```

## Implementation Details

### 1. API Route Implementation

#### Generic CRUD Operations
```typescript
// Generic CRUD API handler
export class CRUDAPIHandler<T> {
  constructor(
    private model: string,
    private permissions: PermissionMatrix,
    private validationSchema: z.ZodSchema<T>
  ) {}
  
  async GET(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string; id?: string }> }
  ): Promise<NextResponse> {
    const { tenantId, id } = await params;
    
    // Authenticate request
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    const hasPermission = await PermissionService.checkPermission(
      authResult.user.id,
      parseInt(tenantId),
      this.model,
      'read'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
      if (id) {
        // Get single item
        const item = await this.getSingleItem(parseInt(id), parseInt(tenantId));
        return NextResponse.json(item);
      } else {
        // Get list of items
        const items = await this.getItemsList(parseInt(tenantId), request);
        return NextResponse.json(items);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  async POST(
    request: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
  ): Promise<NextResponse> {
    const { tenantId } = await params;
    
    // Authenticate request
    const authResult = await this.authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    const hasPermission = await PermissionService.checkPermission(
      authResult.user.id,
      parseInt(tenantId),
      this.model,
      'create'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
      const body = await request.json();
      
      // Validate request body
      const validationResult = this.validationSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.errors },
          { status: 400 }
        );
      }
      
      // Create item
      const item = await this.createItem(validationResult.data, parseInt(tenantId));
      
      // Trigger webhook
      await WebhookService.triggerWebhook(
        parseInt(tenantId),
        `${this.model}.created`,
        item
      );
      
      return NextResponse.json(item, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
  
  private async authenticateRequest(request: NextRequest): Promise<AuthResult> {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { success: false, error: 'No authorization header' };
    }
    
    const [type, token] = authHeader.split(' ');
    
    switch (type) {
      case 'Bearer':
        return await APIAuthenticationService.authenticateWithJWT(token);
      case 'ApiKey':
        return await APIAuthenticationService.authenticateWithAPIKey(token);
      default:
        return { success: false, error: 'Invalid authorization type' };
    }
  }
}
```

### 2. Webhook Delivery System

#### Webhook Service
```typescript
// Webhook delivery service
export class WebhookService {
  static async triggerWebhook(
    tenantId: number,
    event: string,
    data: any
  ): Promise<void> {
    // Get active webhooks for this tenant and event
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: {
          has: event
        }
      }
    });
    
    // Create delivery records
    const deliveries = await Promise.all(
      webhooks.map(webhook =>
        prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(data)
          }
        })
      )
    );
    
    // Process deliveries asynchronously
    deliveries.forEach(delivery => {
      this.processDelivery(delivery.id);
    });
  }
  
  private static async processDelivery(deliveryId: number): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true }
    });
    
    if (!delivery) return;
    
    try {
      // Prepare payload
      const payload = {
        event: delivery.event,
        data: JSON.parse(delivery.payload as string),
        timestamp: delivery.createdAt.toISOString(),
        webhookId: delivery.webhookId
      };
      
      // Generate signature
      const signature = this.generateSignature(
        JSON.stringify(payload),
        delivery.webhook.secret
      );
      
      // Send webhook
      const response = await fetch(delivery.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
          'User-Agent': 'YDV-Platform-Webhook/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(delivery.webhook.timeout * 1000)
      });
      
      // Update delivery status
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? 'DELIVERED' : 'FAILED',
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          },
          attempts: delivery.attempts + 1,
          lastAttempt: new Date()
        }
      });
      
      // Retry if failed and retries remaining
      if (!response.ok && delivery.attempts < delivery.webhook.retryCount) {
        setTimeout(() => {
          this.processDelivery(deliveryId);
        }, this.getRetryDelay(delivery.attempts));
      }
      
    } catch (error) {
      // Update delivery status
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          response: { error: error.message },
          attempts: delivery.attempts + 1,
          lastAttempt: new Date()
        }
      });
      
      // Retry if retries remaining
      if (delivery.attempts < delivery.webhook.retryCount) {
        setTimeout(() => {
          this.processDelivery(deliveryId);
        }, this.getRetryDelay(delivery.attempts));
      }
    }
  }
  
  private static generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }
  
  private static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}
```

### 3. Rate Limiting

#### Rate Limiting Service
```typescript
// Rate limiting service
export class RateLimitService {
  private static redis = new Redis(process.env.REDIS_URL!);
  
  static async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    const currentCount = await this.redis.zcard(key);
    
    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime: windowStart + window * 1000
      };
    }
    
    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, window);
    
    return {
      allowed: true,
      limit,
      remaining: limit - currentCount - 1,
      resetTime: now + window * 1000
    };
  }
  
  static async getRateLimitHeaders(
    identifier: string,
    limit: number,
    window: number
  ): Promise<Record<string, string>> {
    const result = await this.checkRateLimit(identifier, limit, window);
    
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    };
  }
}

// Rate limiting middleware
export function withRateLimit(
  limit: number,
  window: number,
  getIdentifier: (request: NextRequest) => string
) {
  return function(handler: NextRequestHandler) {
    return async function(request: NextRequest, context: any) {
      const identifier = getIdentifier(request);
      const rateLimitResult = await RateLimitService.checkRateLimit(
        identifier,
        limit,
        window
      );
      
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { 
            status: 429,
            headers: await RateLimitService.getRateLimitHeaders(
              identifier,
              limit,
              window
            )
          }
        );
      }
      
      const response = await handler(request, context);
      
      // Add rate limit headers to response
      const headers = await RateLimitService.getRateLimitHeaders(
        identifier,
        limit,
        window
      );
      
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    };
  };
}
```

## Advanced Features

### 1. API Documentation

#### Interactive API Documentation
```typescript
// API documentation generator
export class APIDocumentationService {
  static generateOpenAPISpec(): OpenAPISpec {
    return {
      openapi: '3.0.0',
      info: {
        title: 'YDV Platform API',
        version: '1.0.0',
        description: 'Comprehensive API for YDV Platform operations'
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'https://api.ydv.digital',
          description: 'Production server'
        }
      ],
      security: [
        { BearerAuth: [] },
        { ApiKeyAuth: [] }
      ],
      paths: {
        '/api/tenants/{tenantId}/tables': {
          get: {
            summary: 'List tables',
            parameters: [
              {
                name: 'tenantId',
                in: 'path',
                required: true,
                schema: { type: 'integer' }
              }
            ],
            responses: {
              '200': {
                description: 'List of tables',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Table' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        },
        schemas: {
          Table: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    };
  }
}
```

### 2. Webhook Security

#### Webhook Verification
```typescript
// Webhook verification service
export class WebhookVerificationService {
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
  
  private static generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }
}

// Webhook endpoint handler
export async function POST(request: NextRequest) {
  const signature = request.headers.get('X-Webhook-Signature');
  const body = await request.text();
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  // Verify webhook signature
  const webhookId = request.headers.get('X-Webhook-Id');
  const webhook = await prisma.webhook.findUnique({
    where: { id: parseInt(webhookId!) }
  });
  
  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }
  
  const isValid = WebhookVerificationService.verifyWebhookSignature(
    body,
    signature,
    webhook.secret
  );
  
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Process webhook payload
  const payload = JSON.parse(body);
  await processWebhookPayload(payload);
  
  return NextResponse.json({ success: true });
}
```

### 3. API Analytics

#### API Usage Tracking
```typescript
// API analytics service
export class APIAnalyticsService {
  static async trackAPIUsage(
    userId: number,
    tenantId: number,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    await prisma.apiUsage.create({
      data: {
        userId,
        tenantId,
        endpoint,
        method,
        statusCode,
        responseTime,
        timestamp: new Date()
      }
    });
  }
  
  static async getAPIUsageStats(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<APIUsageStats> {
    const stats = await prisma.apiUsage.groupBy({
      by: ['endpoint', 'method'],
      where: {
        tenantId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        responseTime: true
      }
    });
    
    return {
      totalRequests: stats.reduce((sum, stat) => sum + stat._count.id, 0),
      averageResponseTime: stats.reduce((sum, stat) => 
        sum + (stat._avg.responseTime || 0), 0) / stats.length,
      endpointStats: stats.map(stat => ({
        endpoint: stat.endpoint,
        method: stat.method,
        requestCount: stat._count.id,
        averageResponseTime: stat._avg.responseTime
      }))
    };
  }
}
```

## Common Issues & Solutions

### 1. Authentication Failures

**Problem**: API requests failing with authentication errors
**Solution**:
- Implement comprehensive error handling
- Add detailed error messages
- Provide authentication debugging tools

### 2. Webhook Delivery Failures

**Problem**: Webhooks not being delivered successfully
**Solution**:
- Implement retry mechanisms with exponential backoff
- Add webhook delivery monitoring
- Provide webhook testing tools

### 3. Rate Limiting Issues

**Problem**: Legitimate requests being blocked by rate limits
**Solution**:
- Implement dynamic rate limiting based on user tier
- Add rate limit bypass for trusted applications
- Provide rate limit status endpoints

## Future Enhancements

### 1. Advanced Features
- **GraphQL API**: GraphQL endpoint for complex queries
- **Real-Time APIs**: WebSocket-based real-time data streaming
- **API Versioning**: Multiple API versions with backward compatibility

### 2. Integration Features
- **SDK Generation**: Auto-generate SDKs for popular languages
- **API Gateway**: Advanced API gateway with caching and transformation
- **Third-Party Integrations**: Pre-built integrations with popular services

### 3. Monitoring & Analytics
- **API Monitoring**: Real-time API performance monitoring
- **Usage Analytics**: Detailed API usage analytics and reporting
- **Alerting**: Automated alerts for API issues and anomalies
