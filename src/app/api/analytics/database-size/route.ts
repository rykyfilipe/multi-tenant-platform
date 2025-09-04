import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import  prisma  from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true }
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get all databases for this tenant
    const databases = await prisma.database.findMany({
      where: { tenantId: user.tenant.id },
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
    });

    const sizeAnalysis = [];

    for (const database of databases) {
      // Calculate database size using PostgreSQL functions
      const dbSizeQuery = await prisma.$queryRaw`
        SELECT 
          pg_database_size(current_database()) as database_size_bytes,
          pg_size_pretty(pg_database_size(current_database())) as database_size_pretty
      `;

      const databaseSize = Array.isArray(dbSizeQuery) ? dbSizeQuery[0] : dbSizeQuery;

      const tableSizes = [];

      for (const table of database.tables) {
        // Calculate table size using PostgreSQL functions
        const tableSizeQuery = await prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
            pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
            pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
            pg_total_relation_size(schemaname||'.'||tablename) as total_size_bytes,
            pg_relation_size(schemaname||'.'||tablename) as table_size_bytes,
            pg_indexes_size(schemaname||'.'||tablename) as indexes_size_bytes
          FROM pg_tables 
          WHERE tablename = ${table.name}
        `;

        const tableSize = Array.isArray(tableSizeQuery) ? tableSizeQuery[0] : tableSizeQuery;

        // Calculate row count and average row size
        const rowCount = table.rows.length;
        const totalCells = table.rows.reduce((sum:any, row:any) => sum + row.cells.length, 0);
        
        // Calculate average cell size using pg_column_size for JSON values
        let avgCellSize = 0;
        if (totalCells > 0) {
          const cellSizeQuery = await prisma.$queryRaw`
            SELECT 
              AVG(pg_column_size(value)) as avg_cell_size,
              SUM(pg_column_size(value)) as total_cell_size,
              COUNT(*) as cell_count
            FROM "Cell" 
            WHERE "rowId" IN (
              SELECT id FROM "Row" WHERE "tableId" = ${table.id}
            )
          `;
          
          const cellSize = Array.isArray(cellSizeQuery) ? cellSizeQuery[0] : cellSizeQuery;
          avgCellSize = cellSize?.avg_cell_size || 0;
        }

        // Calculate column sizes
        const columnSizes = [];
        for (const column of table.columns) {
          const columnSizeQuery = await prisma.$queryRaw`
            SELECT 
              AVG(pg_column_size(value)) as avg_column_size,
              SUM(pg_column_size(value)) as total_column_size,
              COUNT(*) as cell_count
            FROM "Cell" 
            WHERE "columnId" = ${column.id}
          `;
          
          const columnSize = Array.isArray(columnSizeQuery) ? columnSizeQuery[0] : columnSizeQuery;
          
          columnSizes.push({
            id: column.id,
            name: column.name,
            type: column.type,
            avgSize: columnSize?.avg_column_size || 0,
            totalSize: columnSize?.total_column_size || 0,
            cellCount: columnSize?.cell_count || 0
          });
        }

        tableSizes.push({
          id: table.id,
          name: table.name,
          description: table.description,
          rowCount,
          columnCount: table.columns.length,
          cellCount: totalCells,
          avgRowSize: avgCellSize,
          totalSize: tableSize?.total_size || "0 bytes",
          tableSize: tableSize?.table_size || "0 bytes",
          indexesSize: tableSize?.indexes_size || "0 bytes",
          totalSizeBytes: Number(tableSize?.total_size_bytes) || 0,
          tableSizeBytes: Number(tableSize?.table_size_bytes) || 0,
          indexesSizeBytes: Number(tableSize?.indexes_size_bytes) || 0,
          columns: columnSizes
        });
      }

      sizeAnalysis.push({
        id: database.id,
        name: database.name,
        createdAt: database.createdAt,
        tableCount: database.tables.length,
        totalRows: database.tables.reduce((sum:any, table:any) => sum + table.rows.length, 0),
        totalCells: database.tables.reduce((sum:any, table:any) => 
          sum + table.rows.reduce((rowSum:any, row:any) => rowSum + row.cells.length, 0), 0
        ),
        databaseSize: databaseSize?.database_size_pretty || "0 bytes",
        databaseSizeBytes: Number(databaseSize?.database_size_bytes) || 0,
        tables: tableSizes
      });
    }

    // Calculate overall statistics
    const totalDatabases = sizeAnalysis.length;
    const totalTables = sizeAnalysis.reduce((sum, db) => sum + db.tableCount, 0);
    const totalRows = sizeAnalysis.reduce((sum, db) => sum + db.totalRows, 0);
    const totalCells = sizeAnalysis.reduce((sum, db) => sum + db.totalCells, 0);
    const totalDatabaseSize = sizeAnalysis.reduce((sum, db) => sum + db.databaseSizeBytes, 0);

    const overallStats = {
      totalDatabases,
      totalTables,
      totalRows,
      totalCells,
      totalDatabaseSizeBytes: totalDatabaseSize,
      totalDatabaseSizePretty: formatBytes(totalDatabaseSize)
    };

    return NextResponse.json({
      success: true,
      data: {
        overall: overallStats,
        databases: sizeAnalysis
      }
    });

  } catch (error) {
    console.error("Error calculating database sizes:", error);
    return NextResponse.json(
      { error: "Failed to calculate database sizes" },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 bytes";
  
  const k = 1024;
  const sizes = ["bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
