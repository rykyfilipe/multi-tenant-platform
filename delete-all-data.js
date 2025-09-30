/**
 * Script to delete ALL data from the Prisma database
 * WARNING: This will permanently delete all data!
 */

const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function deleteAllData() {
  console.log('🚨 WARNING: This will delete ALL data from your database!');
  console.log('Press Ctrl+C within 5 seconds to cancel...');

  // Wait 5 seconds for potential cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🗑️  Starting data deletion...');

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraint errors

    // 1. WidgetSnapshot (no dependencies)
    console.log('Deleting WidgetSnapshot...');
    await prisma.widgetSnapshot.deleteMany({});

    // 2. WidgetAudit (depends on Widget, WidgetDraft, User, Dashboard, Tenant)
    console.log('Deleting WidgetAudit...');
    await prisma.widgetAudit.deleteMany({});

    // 3. WidgetDraft (depends on Widget, User, Dashboard, Tenant)
    console.log('Deleting WidgetDraft...');
    await prisma.widgetDraft.deleteMany({});

    // 4. Widget (depends on User, Dashboard, Tenant)
    console.log('Deleting Widget...');
    await prisma.widget.deleteMany({});

    // 5. Dashboard (depends on User, Tenant)
    console.log('Deleting Dashboard...');
    await prisma.dashboard.deleteMany({});

    // 6. ANAFSubmissionLog (depends on Tenant)
    console.log('Deleting ANAFSubmissionLog...');
    await prisma.aNAFSubmissionLog.deleteMany({});

    // 7. ANAFCredentials (depends on User, Tenant)
    console.log('Deleting ANAFCredentials...');
    await prisma.aNAFCredentials.deleteMany({});

    // 8. PDFTemplateConfig (depends on Tenant)
    console.log('Deleting PDFTemplateConfig...');
    await prisma.pDFTemplateConfig.deleteMany({});

    // 9. PDFAnalytics (depends on Tenant)
    console.log('Deleting PDFAnalytics...');
    await prisma.pDFAnalytics.deleteMany({});

    // 10. UserPreferences (depends on User, Tenant)
    console.log('Deleting UserPreferences...');
    await prisma.userPreferences.deleteMany({});

    // 11. InvoiceAuditLog (depends on Tenant, Database)
    console.log('Deleting InvoiceAuditLog...');
    await prisma.invoiceAuditLog.deleteMany({});

    // 12. InvoiceSeries (depends on Tenant, Database)
    console.log('Deleting InvoiceSeries...');
    await prisma.invoiceSeries.deleteMany({});

    // 13. ErrorLog (depends on User, Tenant)
    console.log('Deleting ErrorLog...');
    await prisma.errorLog.deleteMany({});

    // 14. ApiUsage (depends on User, Tenant)
    console.log('Deleting ApiUsage...');
    await prisma.apiUsage.deleteMany({});

    // 15. TenantUsage (depends on Tenant)
    console.log('Deleting TenantUsage...');
    await prisma.tenantUsage.deleteMany({});

    // 16. SystemMetrics (depends on Tenant)
    console.log('Deleting SystemMetrics...');
    await prisma.systemMetrics.deleteMany({});

    // 17. PerformanceAlert (depends on Tenant)
    console.log('Deleting PerformanceAlert...');
    await prisma.performanceAlert.deleteMany({});

    // 18. DatabaseActivity (depends on Tenant, Database)
    console.log('Deleting DatabaseActivity...');
    await prisma.databaseActivity.deleteMany({});

    // 19. UserActivity (depends on User, Tenant)
    console.log('Deleting UserActivity...');
    await prisma.userActivity.deleteMany({});

    // 20. ColumnPermission (depends on User, Column, Table, Tenant)
    console.log('Deleting ColumnPermission...');
    await prisma.columnPermission.deleteMany({});

    // 21. TablePermission (depends on User, Table, Tenant)
    console.log('Deleting TablePermission...');
    await prisma.tablePermission.deleteMany({});

    // 22. Cell (depends on Row, Column)
    console.log('Deleting Cell...');
    await prisma.cell.deleteMany({});

    // 23. Row (depends on Table)
    console.log('Deleting Row...');
    await prisma.row.deleteMany({});

    // 24. Column (depends on Table)
    console.log('Deleting Column...');
    await prisma.column.deleteMany({});

    // 25. Table (depends on Database)
    console.log('Deleting Table...');
    await prisma.table.deleteMany({});

    // 26. Database (depends on Tenant)
    console.log('Deleting Database...');
    await prisma.database.deleteMany({});

    // 27. Account (depends on User)
    console.log('Deleting Account...');
    await prisma.account.deleteMany({});

    // 28. Session (depends on User)
    console.log('Deleting Session...');
    await prisma.session.deleteMany({});

    // 29. Invitation (depends on Tenant)
    console.log('Deleting Invitation...');
    await prisma.invitation.deleteMany({});

    // 30. VerificationToken (no dependencies)
    console.log('Deleting VerificationToken...');
    await prisma.verificationToken.deleteMany({});

    // 31. Tenant (no dependencies)
    console.log('Deleting Tenant...');
    await prisma.tenant.deleteMany({});

    // 32. User (depends on Tenant)
    console.log('Deleting User...');
    await prisma.user.deleteMany({});

    console.log('✅ All data deleted successfully!');

  } catch (error) {
    console.error('❌ Error deleting data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteAllData()
  .then(() => {
    console.log('🎉 Database cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
