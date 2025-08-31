import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tenantId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get tables that the user has access to
    let tables: any[] = [];
    
    if (user.tenantId) {
      // User belongs to a tenant, get tenant tables
      tables = await prisma.table.findMany({
        where: {
          database: {
            tenantId: user.tenantId
          },
          isPublic: true, // Only public tables for now
        },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              type: true,
              required: true,
              primary: true,
              semanticType: true,
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    // Transform to match the expected interface
    const customTables = tables.map(table => ({
      id: table.id,
      name: table.name,
      description: table.description || '',
      columns: table.columns.map((col: any) => ({
        id: col.id,
        name: col.name,
        type: col.type,
        required: col.required,
        primary: col.primary,
        semanticType: col.semanticType,
      }))
    }));

    return NextResponse.json(customTables);
  } catch (error) {
    console.error('Error fetching custom tables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
