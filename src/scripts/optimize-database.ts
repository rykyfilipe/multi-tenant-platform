/**
 * Database optimization script
 * Creates indexes and optimizes the database for filtering performance
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🚀 Starting database optimization...');
  
  try {
    // Read the SQL script
    const sqlScript = readFileSync(
      join(__dirname, 'create-filter-indexes.sql'), 
      'utf-8'
    );
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.warn(`⚠️  Statement ${i + 1} failed (this might be expected):`, error);
        // Continue with other statements even if one fails
      }
    }
    
    console.log('🎉 Database optimization completed successfully!');
    
    // Get database statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes 
      WHERE tablename IN ('Row', 'Cell')
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10
    `;
    
    console.log('📊 Top 10 largest indexes:');
    console.table(stats);
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the optimization if this script is executed directly
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('✅ Database optimization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database optimization script failed:', error);
      process.exit(1);
    });
}

export { optimizeDatabase };
