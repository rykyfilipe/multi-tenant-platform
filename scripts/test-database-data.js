const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testDatabaseData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        databases: {
          include: {
            tables: {
              include: {
                columns: true,
                rows: {
                  include: {
                    cells: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (ID: ${tenant.id})`);
      console.log(`    Databases: ${tenant.databases.length}`);
      
      tenant.databases.forEach(db => {
        console.log(`      - ${db.name} (ID: ${db.id})`);
        console.log(`        Tables: ${db.tables.length}`);
        
        db.tables.forEach(table => {
          console.log(`          - ${table.name} (ID: ${table.id})`);
          console.log(`            Columns: ${table.columns.length}`);
          console.log(`            Rows: ${table.rows.length}`);
          
          if (table.rows.length > 0) {
            console.log(`            Sample row data:`);
            const firstRow = table.rows[0];
            firstRow.cells.forEach(cell => {
              const column = table.columns.find(c => c.id === cell.columnId);
              console.log(`              ${column?.name}: ${cell.value}`);
            });
          }
        });
      });
    });

    // Check if we have any data for testing
    const hasData = tenants.some(tenant => 
      tenant.databases.some(db => 
        db.tables.some(table => table.rows.length > 0)
      )
    );

    if (!hasData) {
      console.log('\n❌ No data found! Creating test data...');
      await createTestData();
    } else {
      console.log('\n✅ Data found! Ready for testing.');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestData() {
  try {
    // Create a test tenant if it doesn't exist
    const tenant = await prisma.tenant.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Test Tenant',
        adminId: 1
      }
    });

    // Create a test user
    const user = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        tenantId: tenant.id
      }
    });

    // Update tenant with admin
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { adminId: user.id }
    });

    // Create a test database
    const database = await prisma.database.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        tenantId: tenant.id,
        name: 'Test Database'
      }
    });

    // Create a test table
    const table = await prisma.table.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        databaseId: database.id,
        name: 'Products',
        description: 'Product catalog'
      }
    });

    // Create columns
    const columns = [
      { name: 'id', type: 'INTEGER', required: true, primary: true },
      { name: 'name', type: 'TEXT', required: true, primary: false },
      { name: 'price', type: 'DECIMAL', required: true, primary: false },
      { name: 'category', type: 'TEXT', required: false, primary: false },
      { name: 'stock', type: 'INTEGER', required: false, primary: false }
    ];

    for (let i = 0; i < columns.length; i++) {
      await prisma.column.upsert({
        where: { id: i + 1 },
        update: {},
        create: {
          id: i + 1,
          tableId: table.id,
          name: columns[i].name,
          type: columns[i].type,
          required: columns[i].required,
          primary: columns[i].primary,
          order: i
        }
      });
    }

    // Create test rows
    const testProducts = [
      { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 10 },
      { id: 2, name: 'Mouse', price: 29.99, category: 'Electronics', stock: 50 },
      { id: 3, name: 'Keyboard', price: 79.99, category: 'Electronics', stock: 25 },
      { id: 4, name: 'Monitor', price: 299.99, category: 'Electronics', stock: 15 },
      { id: 5, name: 'Desk', price: 199.99, category: 'Furniture', stock: 8 }
    ];

    for (let i = 0; i < testProducts.length; i++) {
      const product = testProducts[i];
      
      // Create row
      const row = await prisma.row.upsert({
        where: { id: i + 1 },
        update: {},
        create: {
          id: i + 1,
          tableId: table.id
        }
      });

      // Create cells for each column
      for (let j = 0; j < columns.length; j++) {
        const column = columns[j];
        const value = product[column.name];
        
        await prisma.cell.upsert({
          where: { id: i * columns.length + j + 1 },
          update: {},
          create: {
            id: i * columns.length + j + 1,
            rowId: row.id,
            columnId: j + 1,
            value: value?.toString() || '',
            stringValue: column.type === 'TEXT' ? value?.toString() : null,
            numberValue: column.type === 'DECIMAL' || column.type === 'INTEGER' ? parseFloat(value) : null,
            dateValue: null,
            booleanValue: null
          }
        });
      }
    }

    console.log('✅ Test data created successfully!');
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - Database: ${database.name}`);
    console.log(`   - Table: ${table.name} with ${columns.length} columns`);
    console.log(`   - Rows: ${testProducts.length} products`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

testDatabaseData();
