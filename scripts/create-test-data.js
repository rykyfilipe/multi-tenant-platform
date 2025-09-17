const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test data...');

  try {
    // Create a test user
    const user = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        password: 'hashed_password',
      },
    });

    // Create a test tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Test Tenant',
        adminId: user.id,
      },
    });

    // Create a test database
    const database = await prisma.database.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        tenantId: tenant.id,
        name: 'Test Database',
      },
    });

    // Create test tables
    const usersTable = await prisma.table.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        databaseId: database.id,
        name: 'users',
        description: 'Users table',
      },
    });

    const productsTable = await prisma.table.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        databaseId: database.id,
        name: 'products',
        description: 'Products table',
      },
    });

    // Create columns for users table
    const userColumns = [
      { name: 'id', type: 'INTEGER', required: true, primary: true },
      { name: 'name', type: 'VARCHAR', required: true, primary: false },
      { name: 'email', type: 'VARCHAR', required: true, primary: false },
      { name: 'age', type: 'INTEGER', required: false, primary: false },
    ];

    for (const [index, column] of userColumns.entries()) {
      await prisma.column.upsert({
        where: { id: index + 1 },
        update: {},
        create: {
          id: index + 1,
          tableId: usersTable.id,
          name: column.name,
          type: column.type,
          required: column.required,
          primary: column.primary,
          order: index,
        },
      });
    }

    // Create columns for products table
    const productColumns = [
      { name: 'id', type: 'INTEGER', required: true, primary: true },
      { name: 'name', type: 'VARCHAR', required: true, primary: false },
      { name: 'price', type: 'DECIMAL', required: true, primary: false },
      { name: 'category', type: 'VARCHAR', required: false, primary: false },
    ];

    for (const [index, column] of productColumns.entries()) {
      await prisma.column.upsert({
        where: { id: index + 5 },
        update: {},
        create: {
          id: index + 5,
          tableId: productsTable.id,
          name: column.name,
          type: column.type,
          required: column.required,
          primary: column.primary,
          order: index,
        },
      });
    }

    console.log('✅ Test data created successfully!');
    console.log('📊 Tables:', usersTable.name, productsTable.name);
    console.log('🔗 Tenant ID:', tenant.id);
    console.log('🗄️ Database ID:', database.id);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
