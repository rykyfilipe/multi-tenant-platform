import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { tenant: true }
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get all databases for this tenant with detailed information
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

    const databaseSizes = [];

    for (const database of databases) {
      // Calculate real size for each database using memory tracking
      
      // Calculate size per database based on its proportion of total data
      const totalRows = database.tables.reduce((sum:any, table:any) => sum + table.rows.length, 0);
      const totalCells = database.tables.reduce((sum:any, table:any) => 
        sum + table.rows.reduce((rowSum:any, row:any) => rowSum + row.cells.length, 0), 0
      );

      // Calculate real size using pg_column_size for this database's cells
      let realSizeBytes = 0;
      try {
        const cellSizeQuery = await prisma.$queryRaw`
          SELECT 
            SUM(pg_column_size(c."value")) as total_cell_bytes
          FROM "Cell" c
          INNER JOIN "Row" r ON c."rowId" = r.id
          INNER JOIN "Table" t ON r."tableId" = t.id
          INNER JOIN "Database" d ON t."databaseId" = d.id
          WHERE d.id = ${database.id}
        `;
        
        const result = Array.isArray(cellSizeQuery) ? cellSizeQuery[0] : cellSizeQuery;
        realSizeBytes = Number(result?.total_cell_bytes) || 0;
      } catch (error) {
        // Fallback to JSON calculation
        for (const table of database.tables) {
          for (const row of table.rows) {
            for (const cell of row.cells) {
              const jsonString = JSON.stringify(cell.value);
              realSizeBytes += Buffer.byteLength(jsonString, "utf8");
            }
          }
        }
      }

      const realSizeMB = realSizeBytes / (1024 * 1024);
      const realSizeKB = realSizeBytes / 1024;

      databaseSizes.push({
        id: database.id,
        name: database.name,
        tables: database.tables.length,
        rows: totalRows,
        cells: totalCells,
        realSizeBytes,
        realSizeMB: Math.round(realSizeMB * 1000) / 1000, // Round to 3 decimal places
        realSizeKB: Math.round(realSizeKB),
        sizeFormatted: formatBytes(realSizeBytes)
      });
    }

    // Calculate total memory usage for the tenant
    const totalMemoryUsed = databaseSizes.reduce((sum, db) => sum + db.realSizeMB, 0);
    const totalRows = databaseSizes.reduce((sum, db) => sum + db.rows, 0);
    const totalTables = databaseSizes.reduce((sum, db) => sum + db.tables, 0);

    return NextResponse.json({
      success: true,
      data: {
        databases: databaseSizes,
        totalMemoryUsed,
        totalRows,
        totalTables
      }
    });

  } catch (error) {
    console.error("Error calculating real database sizes:", error);
    return NextResponse.json(
      { error: "Failed to calculate real database sizes" },
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
