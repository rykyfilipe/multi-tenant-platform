const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing reference columns functionality...');

  try {
    // Find existing test tenant and database
    const tenant = await prisma.tenant.findFirst({
      where: { name: "Bondor's tenant" },
    });

    if (!tenant) {
      console.error('❌ No test tenant found. Please run create-test-data.js first.');
      return;
    }

    const database = await prisma.database.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!database) {
      console.error('❌ No test database found. Please run create-test-data.js first.');
      return;
    }

    // Find existing tables
    const usersTable = await prisma.table.findFirst({
      where: { name: 'client', databaseId: database.id },
    });

    const productsTable = await prisma.table.findFirst({
      where: { name: 'Products', databaseId: database.id },
    });

    if (!usersTable || !productsTable) {
      console.error('❌ Test tables not found. Please run create-test-data.js first.');
      return;
    }

    // Create a new table with reference columns
    const ordersTable = await prisma.table.upsert({
      where: { id: 100 },
      update: {},
      create: {
        id: 100,
        databaseId: database.id,
        name: 'orders',
        description: 'Orders table with reference columns',
      },
    });

    // Create columns for orders table with reference to users and products
    const orderColumns = [
      { name: 'id', type: 'INTEGER', required: true, primary: true, order: 0 },
      { name: 'order_date', type: 'DATE', required: true, primary: false, order: 1 },
      { name: 'user_id', type: 'REFERENCE', required: true, primary: false, order: 2, referenceTableId: usersTable.id },
      { name: 'product_ids', type: 'REFERENCE', required: false, primary: false, order: 3, referenceTableId: productsTable.id },
    ];

    for (const column of orderColumns) {
      await prisma.column.upsert({
        where: { id: column.order + 100 },
        update: {},
        create: {
          id: column.order + 100,
          tableId: ordersTable.id,
          name: column.name,
          type: column.type,
          required: column.required,
          primary: column.primary,
          order: column.order,
          referenceTableId: column.referenceTableId,
        },
      });
    }

    // Add some test rows to users table
    const userRows = [
      { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
    ];

    for (const userRow of userRows) {
      // Create row
      const row = await prisma.row.upsert({
        where: { id: userRow.id },
        update: {},
        create: {
          id: userRow.id,
          tableId: usersTable.id,
        },
      });

      // Create cells for the row
      const columns = await prisma.column.findMany({
        where: { tableId: usersTable.id },
        orderBy: { order: 'asc' },
      });

      for (const [index, column] of columns.entries()) {
        const value = userRow[column.name];
        if (value !== undefined) {
          await prisma.cell.upsert({
            where: { 
              rowId_columnId: { 
                rowId: row.id, 
                columnId: column.id 
              } 
            },
            update: {},
            create: {
              rowId: row.id,
              columnId: column.id,
              value: value.toString(),
            },
          });
        }
      }
    }

    // Add some test rows to products table
    const productRows = [
      { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
      { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics' },
      { id: 3, name: 'Keyboard', price: 79.99, category: 'Electronics' },
      { id: 4, name: 'Monitor', price: 299.99, category: 'Electronics' },
    ];

    for (const productRow of productRows) {
      // Create row
      const row = await prisma.row.upsert({
        where: { id: productRow.id + 100 },
        update: {},
        create: {
          id: productRow.id + 100,
          tableId: productsTable.id,
        },
      });

      // Create cells for the row
      const columns = await prisma.column.findMany({
        where: { tableId: productsTable.id },
        orderBy: { order: 'asc' },
      });

      for (const [index, column] of columns.entries()) {
        const value = productRow[column.name];
        if (value !== undefined) {
          await prisma.cell.upsert({
            where: { 
              rowId_columnId: { 
                rowId: row.id, 
                columnId: column.id 
              } 
            },
            update: {},
            create: {
              rowId: row.id,
              columnId: column.id,
              value: value.toString(),
            },
          });
        }
      }
    }

    console.log('✅ Test data with reference columns created successfully!');
    console.log('📊 Tables created:');
    console.log('  - users (ID: ' + usersTable.id + ')');
    console.log('  - products (ID: ' + productsTable.id + ')');
    console.log('  - orders (ID: ' + ordersTable.id + ')');
    console.log('🔗 Reference columns:');
    console.log('  - orders.user_id -> users.id');
    console.log('  - orders.product_ids -> products.id (multiple)');
    console.log('🌐 Access the application and test editing the orders table to see reference columns in action!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
