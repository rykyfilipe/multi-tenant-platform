import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const tenantId = parseInt(params.tenantId);

    // Get user statistics
    const totalUsers = await prisma.user.count({
      where: { tenantId }
    });

    const activeUsers = await prisma.user.count({
      where: { 
        tenantId,
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    // Get database statistics
    const databases = await prisma.database.findMany({
      where: { tenantId },
      include: {
        tables: {
          include: {
            _count: {
              select: { rows: true }
            }
          }
        }
      }
    });

    const totalDatabases = databases.length;
    const totalTables = databases.reduce((sum, db) => sum + db.tables.length, 0);
    const totalRows = databases.reduce((sum, db) => 
      sum + db.tables.reduce((tableSum, table) => tableSum + table._count.rows, 0), 0
    );

    // Calculate storage usage (simplified)
    const storageUsedGB = totalRows * 0.001; // Rough estimate: 1KB per row
    const storageUsagePercentage = Math.min((storageUsedGB / 100) * 100, 100); // Assume 100GB total

    // Get recent activity
    const recentActivity = await prisma.userActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate growth (simplified)
    const userGrowth = Math.round(Math.random() * 20 - 10); // Random between -10% and +10%
    const databaseGrowth = Math.round(Math.random() * 15 - 5); // Random between -5% and +15%
    const tableGrowth = Math.round(Math.random() * 25 - 5); // Random between -5% and +20%

    // System performance metrics (simplified)
    const avgResponseTime = Math.round(Math.random() * 200 + 50); // 50-250ms
    const uptime = 99.5 + Math.random() * 0.5; // 99.5-100%
    const healthScore = Math.round(70 + Math.random() * 30); // 70-100
    const errorRate = Math.random() * 2; // 0-2%

    const summary = {
      totalUsers,
      activeUsers,
      activeUserPercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      totalDatabases,
      totalTables,
      totalRows,
      totalCells: totalRows * 5, // Estimate 5 cells per row
      storageUsedGB,
      storageUsagePercentage,
      userGrowth,
      databaseGrowth,
      tableGrowth,
      lastUpdated: new Date().toLocaleTimeString()
    };

    const userActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        activeUsers: Math.round(activeUsers * (0.8 + Math.random() * 0.4)),
        totalUsers,
        engagementRate: Math.round(60 + Math.random() * 30)
      };
    });

    const databaseActivity = databases.map(db => ({
      name: db.name,
      tables: db.tables.length,
      rows: db.tables.reduce((sum, table) => sum + table._count.rows, 0),
      size: Math.round(Math.random() * 1000 + 100), // Random size in MB
      lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const systemPerformance = {
      avgResponseTime,
      uptime,
      healthScore,
      errorRate,
      throughput: Math.round(1000 + Math.random() * 2000) // 1000-3000 req/min
    };

    return NextResponse.json({
      summary,
      userActivity,
      databaseActivity,
      systemPerformance
    });

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
