import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password123
      role: 'ADMIN',
    },
  });

  console.log('✅ Demo user created:', demoUser.email);

  // Create a demo dashboard
  const demoDashboard = await prisma.dashboard.upsert({
    where: { id: 'demo-dashboard-1' },
    update: {},
    create: {
      id: 'demo-dashboard-1',
      name: 'Sample Dashboard',
      userId: demoUser.id,
    },
  });

  console.log('✅ Demo dashboard created:', demoDashboard.name);

  // Create demo widgets
  const demoWidgets = [
    {
      id: 'widget-title-1',
      dashboardId: demoDashboard.id,
      type: 'title',
      config: {
        id: 'title-1',
        text: 'Welcome to Your Dashboard',
        fontSize: 32,
        fontWeight: 700,
        color: '#1f2937',
        alignment: 'center',
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 0, y: 0, w: 12, h: 2, minW: 2, minH: 1 },
      orderIndex: 0,
    },
    {
      id: 'widget-paragraph-1',
      dashboardId: demoDashboard.id,
      type: 'paragraph',
      config: {
        id: 'paragraph-1',
        text: 'This is a sample dashboard created with our drag & drop builder. You can customize widgets, change layouts, and create beautiful dashboards for your data.',
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 1.6,
        alignment: 'left',
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 0, y: 2, w: 6, h: 3, minW: 2, minH: 2 },
      orderIndex: 1,
    },
    {
      id: 'widget-list-1',
      dashboardId: demoDashboard.id,
      type: 'list',
      config: {
        id: 'list-1',
        items: ['Drag & Drop Interface', 'Customizable Widgets', 'Real-time Updates', 'Responsive Design'],
        listType: 'bullet',
        fontSize: 14,
        color: '#374151',
        spacing: 8,
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 6, y: 2, w: 6, h: 3, minW: 2, minH: 2 },
      orderIndex: 2,
    },
    {
      id: 'widget-progress-1',
      dashboardId: demoDashboard.id,
      type: 'progress',
      config: {
        id: 'progress-1',
        value: 75,
        max: 100,
        label: 'Project Completion',
        showPercentage: true,
        color: '#10b981',
        size: 'lg',
        variant: 'success',
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 0, y: 5, w: 4, h: 2, minW: 2, minH: 1 },
      orderIndex: 3,
    },
    {
      id: 'widget-progress-2',
      dashboardId: demoDashboard.id,
      type: 'progress',
      config: {
        id: 'progress-2',
        value: 45,
        max: 100,
        label: 'Task Progress',
        showPercentage: true,
        color: '#3b82f6',
        size: 'lg',
        variant: 'default',
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 4, y: 5, w: 4, h: 2, minW: 2, minH: 1 },
      orderIndex: 4,
    },
    {
      id: 'widget-container-1',
      dashboardId: demoDashboard.id,
      type: 'container',
      config: {
        id: 'container-1',
        background: '#f8fafc',
        border: { width: 2, color: '#e2e8f0', radius: 12, style: 'solid' },
        padding: 20,
        margin: 0,
        shadow: 'md',
        children: [],
      },
      position: { x: 8, y: 5, w: 4, h: 4, minW: 2, minH: 2 },
      orderIndex: 5,
    },
  ];

  for (const widgetData of demoWidgets) {
    await prisma.widget.upsert({
      where: { id: widgetData.id },
      update: {},
      create: widgetData,
    });
  }

  console.log('✅ Demo widgets created:', demoWidgets.length);

  // Create a second dashboard with different widgets
  const secondDashboard = await prisma.dashboard.upsert({
    where: { id: 'demo-dashboard-2' },
    update: {},
    create: {
      id: 'demo-dashboard-2',
      name: 'Analytics Dashboard',
      userId: demoUser.id,
    },
  });

  console.log('✅ Second demo dashboard created:', secondDashboard.name);

  const analyticsWidgets = [
    {
      id: 'widget-title-2',
      dashboardId: secondDashboard.id,
      type: 'title',
      config: {
        id: 'title-2',
        text: 'Analytics Overview',
        fontSize: 28,
        fontWeight: 600,
        color: '#1e40af',
        alignment: 'left',
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 0, y: 0, w: 12, h: 2, minW: 2, minH: 1 },
      orderIndex: 0,
    },
    {
      id: 'widget-table-1',
      dashboardId: secondDashboard.id,
      type: 'table',
      config: {
        id: 'table-1',
        tableName: 'sales_data',
        columns: ['date', 'product', 'amount', 'region'],
        pageSize: 5,
        showHeader: true,
        showPagination: true,
        sortable: true,
        filterable: true,
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
      orderIndex: 1,
    },
    {
      id: 'widget-chart-1',
      dashboardId: secondDashboard.id,
      type: 'chart',
      config: {
        id: 'chart-1',
        tableName: 'sales_data',
        x: 'date',
        y: 'amount',
        chartType: 'bar',
        aggregate: 'sum',
        colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
        showLegend: true,
        showGrid: true,
        backgroundColor: 'transparent',
        padding: 16,
      },
      position: { x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      orderIndex: 2,
    },
  ];

  for (const widgetData of analyticsWidgets) {
    await prisma.widget.upsert({
      where: { id: widgetData.id },
      update: {},
      create: widgetData,
    });
  }

  console.log('✅ Analytics widgets created:', analyticsWidgets.length);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Demo Data Summary:');
  console.log(`- User: ${demoUser.email}`);
  console.log(`- Dashboards: 2`);
  console.log(`- Total Widgets: ${demoWidgets.length + analyticsWidgets.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log(`- Email: ${demoUser.email}`);
  console.log(`- Password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
