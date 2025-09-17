import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get tables for tenant 1, database 1 (our test data)
    const tables = await prisma.table.findMany({
      where: {
        databaseId: 1,
        database: {
          tenantId: 1
        }
      },
      include: {
        columns: {
          select: {
            id: true,
            name: true,
            type: true,
            required: true,
            primary: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      tables: tables.map(table => ({
        id: table.id,
        name: table.name,
        description: table.description,
        columns: table.columns
      }))
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}
