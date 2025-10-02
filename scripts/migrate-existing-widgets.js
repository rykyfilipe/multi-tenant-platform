#!/usr/bin/env node

/**
 * Migration script to update existing widgets with complete configuration structure
 * This ensures all existing widgets have the complete settings, style, and data structure
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Widget default configurations
const widgetDefaults = {
  chart: {
    settings: {
      chartType: "bar",
      refreshInterval: 60,
      processingMode: "raw",
      aggregationFunction: "sum",
      aggregationColumns: [],
      groupByColumn: undefined,
      enableTopN: false,
      topNCount: 10,
      sortByColumn: undefined,
      sortDirection: "desc",
    },
    style: {
      theme: "platinum",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      fontSize: "sm",
      fontWeight: "normal",
      padding: "md",
      borderRadius: "xl",
      borderWidth: 1,
      shadow: "medium",
      glassEffect: false,
      backdropBlur: "none",
      showLegend: true,
      showGrid: true,
      legendPosition: "bottom",
      chartOpacity: 1,
      shine: false,
      glow: false,
    },
    data: {
      databaseId: 0,
      tableId: "default_table",
      filters: [],
      mappings: {
        x: "dimension",
        y: ["value"],
      },
    },
    refresh: {
      enabled: false,
      interval: 30000,
    },
    metadata: {},
  },
  kpi: {
    settings: {
      label: "KPI Value",
      format: "number",
      showTrend: true,
      showComparison: false,
      showExtremeValueDetails: false,
      extremeValueMode: "max",
      valueField: "value",
      displayFields: [],
      selectedAggregations: ["sum"],
      comparisonField: undefined,
    },
    style: {
      theme: "platinum",
      backgroundColor: "#FFFFFF",
      valueColor: "#000000",
      labelColor: "#737373",
      trendColor: "#16a34a",
      valueFontSize: "4xl",
      valueFontWeight: "bold",
      size: "medium",
      alignment: "center",
    },
    data: {
      databaseId: 0,
      tableId: "default_kpi",
      filters: [],
    },
    refresh: {
      enabled: false,
      interval: 30000,
    },
  },
  table: {
    settings: {
      columns: [
        {
          id: "column_1",
          label: "Column 1",
          sortable: true,
        },
      ],
      pageSize: 25,
      enableExport: false,
      stickyHeader: true,
    },
    style: {
      theme: "platinum",
      density: "comfortable",
      showRowBorders: false,
      zebraStripes: true,
    },
    data: {
      databaseId: 0,
      tableId: "default_table",
      filters: [],
      sort: [],
    },
    refresh: {
      enabled: false,
      interval: 30000,
    },
  },
};

function mergeConfig(existingConfig, defaultConfig) {
  if (!existingConfig) {
    return defaultConfig;
  }

  return {
    ...defaultConfig,
    ...existingConfig,
    settings: {
      ...defaultConfig.settings,
      ...existingConfig.settings,
    },
    style: {
      ...defaultConfig.style,
      ...existingConfig.style,
    },
    data: {
      ...defaultConfig.data,
      ...existingConfig.data,
    },
    refresh: {
      ...defaultConfig.refresh,
      ...existingConfig.refresh,
    },
    metadata: {
      ...defaultConfig.metadata,
      ...existingConfig.metadata,
    },
  };
}

async function migrateWidgets() {
  try {
    console.log('🚀 Starting widget migration...');

    // Get all widgets
    const widgets = await prisma.widget.findMany({
      select: {
        id: true,
        kind: true,
        config: true,
        title: true,
      },
    });

    console.log(`📊 Found ${widgets.length} widgets to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const widget of widgets) {
      const widgetType = widget.kind.toLowerCase();
      const defaultConfig = widgetDefaults[widgetType];

      if (!defaultConfig) {
        console.log(`⚠️  No default config for widget type: ${widgetType}, skipping widget ${widget.id}`);
        skippedCount++;
        continue;
      }

      const currentConfig = widget.config || {};
      const mergedConfig = mergeConfig(currentConfig, defaultConfig);

      // Check if migration is needed
      const needsMigration = 
        !currentConfig.settings ||
        !currentConfig.style ||
        !currentConfig.data ||
        !currentConfig.refresh ||
        Object.keys(currentConfig.settings).length < Object.keys(defaultConfig.settings).length;

      if (!needsMigration) {
        console.log(`✅ Widget ${widget.id} (${widget.title}) already has complete config, skipping`);
        skippedCount++;
        continue;
      }

      // Update widget with complete configuration
      await prisma.widget.update({
        where: { id: widget.id },
        data: {
          config: mergedConfig,
        },
      });

      console.log(`✅ Migrated widget ${widget.id} (${widget.title}) - ${widgetType}`);
      migratedCount++;
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   ✅ Migrated: ${migratedCount} widgets`);
    console.log(`   ⏭️  Skipped: ${skippedCount} widgets`);
    console.log(`   📊 Total: ${widgets.length} widgets processed`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateWidgets();
