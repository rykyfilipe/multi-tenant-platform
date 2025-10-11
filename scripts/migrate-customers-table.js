#!/usr/bin/env node

/**
 * Migration script to add missing columns to existing customers tables
 * This script adds the new customer columns (customer_type, customer_cnp, etc.)
 * to existing customers tables that were created before the update
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import semantic types
const { SemanticColumnType } = require('../src/lib/semantic-types.ts');

async function migrateCustomersTables() {
    console.log('🚀 Starting migration of customers tables...');
    
    try {
        // Find all customers tables
        const customersTables = await prisma.table.findMany({
            where: {
                name: 'customers',
                isProtected: true,
                protectedType: 'customers'
            },
            include: {
                columns: true,
                database: {
                    include: {
                        tenant: true
                    }
                }
            }
        });

        console.log(`📊 Found ${customersTables.length} customers tables to migrate`);

        for (const table of customersTables) {
            console.log(`\n🔄 Processing table: ${table.name} (ID: ${table.id}) for tenant: ${table.database.tenant.name}`);
            
            // Get existing column names
            const existingColumnNames = table.columns.map(col => col.name);
            console.log(`   Existing columns: ${existingColumnNames.join(', ')}`);
            
            // Define new columns to add
            const newColumns = [
                {
                    name: "customer_type",
                    type: "customArray",
                    semanticType: SemanticColumnType.CUSTOMER_TYPE,
                    required: true,
                    primary: false,
                    order: 2,
                    isLocked: true,
                    customArrayOptions: ["Persoană fizică", "Persoană juridică"],
                },
                {
                    name: "customer_cnp",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_CNP,
                    required: true,
                    primary: false,
                    order: 5,
                    isLocked: true,
                },
                {
                    name: "customer_cui",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_CUI,
                    required: true,
                    primary: false,
                    order: 6,
                    isLocked: true,
                },
                {
                    name: "customer_company_registration_number",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_COMPANY_REGISTRATION_NUMBER,
                    required: true,
                    primary: false,
                    order: 7,
                    isLocked: true,
                },
                {
                    name: "customer_vat_number",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_VAT_NUMBER,
                    required: false,
                    primary: false,
                    order: 8,
                    isLocked: true,
                },
                {
                    name: "customer_bank_account",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_BANK_ACCOUNT,
                    required: false,
                    primary: false,
                    order: 9,
                    isLocked: true,
                },
                {
                    name: "customer_street",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_STREET,
                    required: true,
                    primary: false,
                    order: 10,
                    isLocked: true,
                },
                {
                    name: "customer_street_number",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_STREET_NUMBER,
                    required: true,
                    primary: false,
                    order: 11,
                    isLocked: true,
                },
                {
                    name: "customer_city",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_CITY,
                    required: true,
                    primary: false,
                    order: 12,
                    isLocked: true,
                },
                {
                    name: "customer_country",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_COUNTRY,
                    required: true,
                    primary: false,
                    order: 13,
                    isLocked: true,
                },
                {
                    name: "customer_postal_code",
                    type: "string",
                    semanticType: SemanticColumnType.CUSTOMER_POSTAL_CODE,
                    required: true,
                    primary: false,
                    order: 14,
                    isLocked: true,
                }
            ];

            // Filter out columns that already exist
            const columnsToAdd = newColumns.filter(col => !existingColumnNames.includes(col.name));
            
            if (columnsToAdd.length === 0) {
                console.log(`   ✅ Table already has all required columns`);
                continue;
            }

            console.log(`   ➕ Adding ${columnsToAdd.length} new columns: ${columnsToAdd.map(c => c.name).join(', ')}`);

            // Add missing columns
            for (const columnData of columnsToAdd) {
                await prisma.column.create({
                    data: {
                        ...columnData,
                        tableId: table.id,
                    },
                });
                console.log(`   ✅ Added column: ${columnData.name}`);
            }

            console.log(`   ✅ Migration completed for table ID: ${table.id}`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Processed ${customersTables.length} customers tables`);
        console.log(`   - All missing columns have been added`);
        console.log('\n💡 Note: Existing customer records will have empty values for the new columns.');
        console.log('   You may want to update them manually or through the application.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateCustomersTables()
        .then(() => {
            console.log('✅ Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateCustomersTables };
