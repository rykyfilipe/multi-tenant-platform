const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

// Sample product data
const products = [
  { name: 'Laptop Dell XPS 13', description: 'High-performance laptop', price: 1299.99, sku: 'DLX13-001', category: 'Electronics', brand: 'Dell', vat: 19, unit_of_measure: 'piece', currency: 'USD', created_at: new Date('2024-01-15') },
  { name: 'iPhone 15 Pro', description: 'Latest iPhone model', price: 999.99, sku: 'IP15P-001', category: 'Electronics', brand: 'Apple', vat: 19, unit_of_measure: 'piece', currency: 'USD', created_at: new Date('2024-01-20') },
  { name: 'Samsung Galaxy S24', description: 'Android smartphone', price: 899.99, sku: 'SGS24-001', category: 'Electronics', brand: 'Samsung', vat: 19, unit_of_measure: 'piece', currency: 'USD', created_at: new Date('2024-02-01') },
  { name: 'MacBook Pro M3', description: 'Professional laptop', price: 1999.99, sku: 'MBPM3-001', category: 'Electronics', brand: 'Apple', vat: 19, unit_of_measure: 'piece', currency: 'USD', created_at: new Date('2024-02-10') },
  { name: 'Nike Air Max 270', description: 'Running shoes', price: 149.99, sku: 'NAM270-001', category: 'Footwear', brand: 'Nike', vat: 19, unit_of_measure: 'pair', currency: 'EUR', created_at: new Date('2024-02-15') },
  { name: 'Adidas Ultraboost 22', description: 'Performance running shoes', price: 179.99, sku: 'AUB22-001', category: 'Footwear', brand: 'Adidas', vat: 19, unit_of_measure: 'pair', currency: 'EUR', created_at: new Date('2024-02-20') },
  { name: 'Coffee Beans Premium', description: 'Arabica coffee beans', price: 24.99, sku: 'CBP-001', category: 'Food & Beverage', brand: 'Coffee Co', vat: 7, unit_of_measure: 'kg', currency: 'EUR', created_at: new Date('2024-03-01') },
  { name: 'Organic Green Tea', description: 'Premium organic tea', price: 12.99, sku: 'OGT-001', category: 'Food & Beverage', brand: 'Tea Masters', vat: 7, unit_of_measure: 'box', currency: 'EUR', created_at: new Date('2024-03-05') },
  { name: 'Office Chair Ergonomic', description: 'Comfortable office chair', price: 299.99, sku: 'OCE-001', category: 'Furniture', brand: 'Office Pro', vat: 19, unit_of_measure: 'piece', currency: 'EUR', created_at: new Date('2024-03-10') },
  { name: 'Standing Desk Adjustable', description: 'Height-adjustable desk', price: 599.99, sku: 'SDA-001', category: 'Furniture', brand: 'Desk Solutions', vat: 19, unit_of_measure: 'piece', currency: 'EUR', created_at: new Date('2024-03-15') }
];

async function generateTestData() {
  try {
    // Get the Products table
    const table = await prisma.table.findFirst({ where: { name: 'Products' } });
    if (!table) {
      console.log('Products table not found');
      return;
    }
    
    console.log(`Found Products table: ID=${table.id}`);
    
    // Get columns for this table
    const columns = await prisma.column.findMany({ 
      where: { tableId: table.id },
      orderBy: { order: 'asc' }
    });
    
    console.log(`Found ${columns.length} columns`);
    
    // Clear existing data
    await prisma.cell.deleteMany({ where: { row: { tableId: table.id } } });
    await prisma.row.deleteMany({ where: { tableId: table.id } });
    console.log('Cleared existing data');
    
    // Insert new data
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Create row
      const row = await prisma.row.create({
        data: {
          tableId: table.id
        }
      });
      
      console.log(`Created row ${row.id} for product: ${product.name}`);
      
      // Create cells for each column
      for (const column of columns) {
        let value = null;
        
        switch (column.name) {
          case 'name':
            value = product.name;
            break;
          case 'description':
            value = product.description;
            break;
          case 'price':
            value = product.price;
            break;
          case 'sku':
            value = product.sku;
            break;
          case 'category':
            value = product.category;
            break;
          case 'brand':
            value = product.brand;
            break;
          case 'vat':
            value = product.vat;
            break;
          case 'unit_of_measure':
            value = product.unit_of_measure;
            break;
          case 'currency':
            value = product.currency;
            break;
          case 'created_at':
            value = product.created_at;
            break;
        }
        
        // Create cell based on column type
        const cellData = {
          rowId: row.id,
          columnId: column.id,
          value: value // JSON field is required
        };
        
        if (column.type === 'text') {
          cellData.stringValue = value;
        } else if (column.type === 'number') {
          cellData.numberValue = value;
        } else if (column.type === 'date') {
          cellData.dateValue = value;
        }
        
        await prisma.cell.create({ data: cellData });
      }
    }
    
    console.log(`Successfully inserted ${products.length} products with test data`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestData();
