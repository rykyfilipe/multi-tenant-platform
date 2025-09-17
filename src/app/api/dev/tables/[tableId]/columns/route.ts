import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    
    const columns = await prisma.column.findMany({
      where: {
        tableId: Number(tableId)
      },
      select: {
        id: true,
        name: true,
        type: true,
        required: true,
        primary: true
      }
    });

    return NextResponse.json({
      success: true,
      columns: columns.map(col => ({
        id: col.id,
        name: col.name,
        type: col.type,
        isRequired: col.required,
        isPrimaryKey: col.primary
      }))
    });
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch columns' },
      { status: 500 }
    );
  }
}
