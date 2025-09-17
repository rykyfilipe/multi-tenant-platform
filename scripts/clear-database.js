#!/usr/bin/env node

/**
 * Script to clear all data from the database
 * WARNING: This will delete ALL data from the database!
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🚨 WARNING: This will delete ALL data from the database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  // Wait 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Delete in order to respect foreign key constraints
    const tables = [
      'Cell',
      'Row',
      'Column',
      'Table',
      'Database',
      'WebhookDelivery',
      'Webhook',
      'Invoice',
      'Backup',
      'UserTenant',
      'User',
      'Tenant',
      'Widget',
      'Dashboard'
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma[table.toLowerCase()].deleteMany({});
        console.log(`✅ Cleared ${table}: ${result.count} records deleted`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }
    
    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase();
