import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user first
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

  console.log('✅ Created user:', user.email);

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

  console.log('✅ Created tenant:', tenant.name);

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

  console.log('✅ Created database:', database.name);

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

  console.log('✅ Created tables:', usersTable.name, productsTable.name);

  // Create columns for users table
  const userColumns = [
    { name: 'id', type: 'INTEGER', required: true, primary: true },
    { name: 'name', type: 'VARCHAR', required: true, primary: false },
    { name: 'email', type: 'VARCHAR', required: true, primary: false },
    { name: 'age', type: 'INTEGER', required: false, primary: false },
    { name: 'created_at', type: 'TIMESTAMP', required: true, primary: false },
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
    { name: 'stock', type: 'INTEGER', required: false, primary: false },
    { name: 'created_at', type: 'TIMESTAMP', required: true, primary: false },
  ];

  for (const [index, column] of productColumns.entries()) {
    await prisma.column.upsert({
      where: { id: index + 6 },
      update: {},
      create: {
        id: index + 6,
        tableId: productsTable.id,
        name: column.name,
        type: column.type,
        required: column.required,
        primary: column.primary,
        order: index,
      },
    });
  }

  console.log('✅ Created columns for both tables');

  // Create some sample rows
  const sampleUsers = [
    { name: 'John Doe', email: 'john@example.com', age: 30 },
    { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  for (const [index, user] of sampleUsers.entries()) {
    const row = await prisma.row.upsert({
      where: { id: index + 1 },
      update: {},
      create: {
        id: index + 1,
        tableId: usersTable.id,
      },
    });

    // Create cells for this row
    await prisma.cell.upsert({
      where: { id: index * 5 + 1 },
      update: {},
      create: {
        id: index * 5 + 1,
        rowId: row.id,
        columnId: 1, // id column
        value: (index + 1).toString(),
        stringValue: (index + 1).toString(),
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 5 + 2 },
      update: {},
      create: {
        id: index * 5 + 2,
        rowId: row.id,
        columnId: 2, // name column
        value: user.name,
        stringValue: user.name,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 5 + 3 },
      update: {},
      create: {
        id: index * 5 + 3,
        rowId: row.id,
        columnId: 3, // email column
        value: user.email,
        stringValue: user.email,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 5 + 4 },
      update: {},
      create: {
        id: index * 5 + 4,
        rowId: row.id,
        columnId: 4, // age column
        value: user.age,
        numberValue: user.age,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 5 + 5 },
      update: {},
      create: {
        id: index * 5 + 5,
        rowId: row.id,
        columnId: 5, // created_at column
        value: new Date(),
        dateValue: new Date(),
      },
    });
  }

  console.log('✅ Created sample user data');

  // Create some sample products
  const sampleProducts = [
    { name: 'Laptop', price: 999.99, category: 'Electronics', stock: 10 },
    { name: 'Mouse', price: 29.99, category: 'Electronics', stock: 50 },
    { name: 'Keyboard', price: 79.99, category: 'Electronics', stock: 25 },
  ];

  for (const [index, product] of sampleProducts.entries()) {
    const row = await prisma.row.upsert({
      where: { id: index + 4 },
      update: {},
      create: {
        id: index + 4,
        tableId: productsTable.id,
      },
    });

    // Create cells for this row
    await prisma.cell.upsert({
      where: { id: index * 6 + 16 },
      update: {},
      create: {
        id: index * 6 + 16,
        rowId: row.id,
        columnId: 6, // id column
        value: (index + 1).toString(),
        stringValue: (index + 1).toString(),
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 6 + 17 },
      update: {},
      create: {
        id: index * 6 + 17,
        rowId: row.id,
        columnId: 7, // name column
        value: product.name,
        stringValue: product.name,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 6 + 18 },
      update: {},
      create: {
        id: index * 6 + 18,
        rowId: row.id,
        columnId: 8, // price column
        value: product.price,
        numberValue: product.price,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 6 + 19 },
      update: {},
      create: {
        id: index * 6 + 19,
        rowId: row.id,
        columnId: 9, // category column 
        value: product.category,
        stringValue: product.category,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 6 + 20 },
      update: {},
      create: {
        id: index * 6 + 20,
        rowId: row.id,
        columnId: 10, // stock column
        value: product.stock,
        numberValue: product.stock,
      },
    });

    await prisma.cell.upsert({
      where: { id: index * 6 + 21 },
      update: {},
      create: {
        id: index * 6 + 21,
        rowId: row.id,
        columnId: 11, // created_at column
        value: new Date(),
        dateValue: new Date(),
      },
    });
  }

  console.log('✅ Created sample product data');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
