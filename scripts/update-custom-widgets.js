const { PrismaClient, WidgetKind } = require('../src/generated/prisma');

async function updateCustomWidgets() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Updating CUSTOM widgets to CHART...');

    // Update all CUSTOM widgets to CHART
    const result = await prisma.widget.updateMany({
      where: {
        kind: WidgetKind.CUSTOM
      },
      data: {
        kind: WidgetKind.CHART
      }
    });

    console.log(`✅ Updated ${result.count} CUSTOM widgets to CHART`);

    // Also update their config to use CHART defaults
    const customWidgets = await prisma.widget.findMany({
      where: {
        kind: 'CHART' // Now they are CHART widgets
      }
    });

    for (const widget of customWidgets) {
      if (widget.config && typeof widget.config === 'object') {
        // Ensure the config has proper CHART structure
        const updatedConfig = {
          settings: {
            chartType: 'bar',
            xAxis: 'dimension',
            yAxis: 'value',
            refreshInterval: 60,
            valueFormat: 'number',
          },
          style: {
            theme: 'premium-light',
            showLegend: true,
            showGrid: true,
          },
          data: {
            tableId: 'default_table',
            filters: [],
            mappings: {
              x: 'dimension',
              y: 'value',
            },
          },
          refresh: {
            enabled: false,
            interval: 30000,
          },
          ...widget.config // Keep existing config if present
        };

        await prisma.widget.update({
          where: { id: widget.id },
          data: { config: updatedConfig }
        });
      }
    }

    console.log('✅ Updated widget configs');

  } catch (error) {
    console.error('❌ Error updating widgets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCustomWidgets();
