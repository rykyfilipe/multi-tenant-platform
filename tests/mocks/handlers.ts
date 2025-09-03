import { http, HttpResponse } from 'msw'

export const handlers = [
  // Authentication handlers
  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 1,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  }),

  http.post('/api/auth/signout', () => {
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 1,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  }),

  // User management handlers
  http.get('/api/users', () => {
    return HttpResponse.json([
      {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        tenantId: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
        role: 'USER',
        tenantId: 1,
        createdAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 3,
      ...body,
      createdAt: new Date().toISOString(),
    })
  }),

  http.put('/api/users/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.delete('/api/users/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Tenant handlers
  http.get('/api/tenants', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Tenant',
        adminId: 1,
        address: '123 Test St',
        companyEmail: 'admin@testtenant.com',
        createdAt: new Date().toISOString(),
        language: 'en',
        theme: 'light',
        timezone: 'UTC',
      },
    ])
  }),

  http.get('/api/tenants/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Tenant',
      adminId: 1,
      address: '123 Test St',
      companyEmail: 'admin@testtenant.com',
      createdAt: new Date().toISOString(),
      language: 'en',
      theme: 'light',
      timezone: 'UTC',
    })
  }),

  http.put('/api/tenants/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  // Database handlers
  http.get('/api/databases', () => {
    return HttpResponse.json([
      {
        id: 1,
        tenantId: 1,
        name: 'Main Database',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/databases', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 2,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  http.get('/api/databases/:id/tables', ({ params }) => {
    return HttpResponse.json([
      {
        id: 1,
        databaseId: params.id,
        name: 'users',
        description: 'User table',
        isPublic: false,
        isProtected: false,
        moduleType: 'user',
        isModuleTable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        databaseId: params.id,
        name: 'products',
        description: 'Product table',
        isPublic: true,
        isProtected: false,
        moduleType: 'inventory',
        isModuleTable: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/databases/:id/tables', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 3,
      databaseId: params.id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  // Table handlers
  http.get('/api/tables/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      databaseId: 1,
      name: 'users',
      description: 'User table',
      isPublic: false,
      isProtected: false,
      moduleType: 'user',
      isModuleTable: true,
      columns: [
        {
          id: 1,
          name: 'id',
          type: 'INTEGER',
          required: true,
          isPrimaryKey: true,
          isForeignKey: false,
          referencedTableId: null,
          referencedColumnId: null,
        },
        {
          id: 2,
          name: 'email',
          type: 'VARCHAR',
          required: true,
          isPrimaryKey: false,
          isForeignKey: false,
          referencedTableId: null,
          referencedColumnId: null,
        },
        {
          id: 3,
          name: 'name',
          type: 'VARCHAR',
          required: false,
          isPrimaryKey: false,
          isForeignKey: false,
          referencedTableId: null,
          referencedColumnId: null,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  http.put('/api/tables/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.delete('/api/tables/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Column handlers
  http.post('/api/tables/:id/columns', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 4,
      tableId: params.id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  http.put('/api/columns/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.delete('/api/columns/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Row handlers
  http.get('/api/tables/:id/rows', ({ params }) => {
    return HttpResponse.json([
      {
        id: 1,
        tableId: params.id,
        data: {
          id: 1,
          email: 'user1@example.com',
          name: 'User One',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        tableId: params.id,
        data: {
          id: 2,
          email: 'user2@example.com',
          name: 'User Two',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/tables/:id/rows', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: 3,
      tableId: params.id,
      data: body.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }),

  http.put('/api/rows/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.delete('/api/rows/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Permissions handlers
  http.get('/api/permissions/tables', () => {
    return HttpResponse.json([
      {
        id: 1,
        userId: 1,
        tableId: 1,
        tenantId: 1,
        canRead: true,
        canEdit: true,
        canDelete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  }),

  http.get('/api/permissions/columns', () => {
    return HttpResponse.json([
      {
        id: 1,
        userId: 1,
        columnId: 1,
        tableId: 1,
        tenantId: 1,
        canRead: true,
        canEdit: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
  }),

  http.put('/api/permissions/tables/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  http.put('/api/permissions/columns/:id', async ({ request, params }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    })
  }),

  // Analytics handlers
  http.get('/api/analytics/overview', () => {
    return HttpResponse.json({
      totalUsers: 150,
      totalTables: 25,
      totalRows: 5000,
      totalDatabases: 3,
      activeUsers: 45,
      storageUsed: 2.5,
      storageLimit: 10,
      apiCalls: 1250,
      apiLimit: 10000,
    })
  }),

  http.get('/api/analytics/usage', () => {
    return HttpResponse.json({
      daily: [
        { date: '2024-01-01', users: 10, apiCalls: 100, storage: 1.2 },
        { date: '2024-01-02', users: 15, apiCalls: 150, storage: 1.5 },
        { date: '2024-01-03', users: 20, apiCalls: 200, storage: 1.8 },
      ],
      monthly: [
        { month: '2024-01', users: 45, apiCalls: 450, storage: 2.1 },
        { month: '2024-02', users: 50, apiCalls: 500, storage: 2.3 },
        { month: '2024-03', users: 55, apiCalls: 550, storage: 2.5 },
      ],
    })
  }),

  // Subscription handlers
  http.get('/api/subscription/status', () => {
    return HttpResponse.json({
      plan: 'PRO',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      limits: {
        users: 100,
        databases: 10,
        storage: 10,
        apiCalls: 10000,
      },
      usage: {
        users: 15,
        databases: 3,
        storage: 2.5,
        apiCalls: 1250,
      },
    })
  }),

  http.post('/api/subscription/create-checkout-session', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    })
  }),

  http.post('/api/subscription/create-portal-session', () => {
    return HttpResponse.json({
      url: 'https://billing.stripe.com/session_123',
    })
  }),

  // Error handlers
  http.get('/api/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }),

  http.get('/api/not-found', () => {
    return HttpResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }),

  http.get('/api/unauthorized', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),

  http.get('/api/forbidden', () => {
    return HttpResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }),
]
