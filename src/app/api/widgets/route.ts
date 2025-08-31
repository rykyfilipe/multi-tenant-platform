import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createWidgetSchema = z.object({
  dashboardId: z.string(),
  parentId: z.string().optional(),
  type: z.enum(['container', 'title', 'paragraph', 'list', 'table', 'chart', 'calendar', 'tasks', 'image', 'progress']),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    minW: z.number().optional(),
    minH: z.number().optional(),
    maxW: z.number().optional(),
    maxH: z.number().optional(),
  }),
  orderIndex: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dashboardId = searchParams.get('dashboardId');

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 });
    }

    // Verify user owns the dashboard
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        userId: user.id,
      },
      select: { id: true }
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    const widgets = await prisma.widget.findMany({
      where: { dashboardId },
      orderBy: { orderIndex: 'asc' },
      include: {
        children: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return NextResponse.json(widgets);
  } catch (error) {
    console.error('Error fetching widgets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { dashboardId, parentId, type, config, position, orderIndex } = createWidgetSchema.parse(body);

    // Verify user owns the dashboard
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        userId: user.id,
      },
      select: { id: true }
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    // If parentId is provided, verify it exists and belongs to the same dashboard
    if (parentId) {
      const parentWidget = await prisma.widget.findFirst({
        where: {
          id: parentId,
          dashboardId,
        },
        select: { id: true }
      });

      if (!parentWidget) {
        return NextResponse.json({ error: 'Parent widget not found' }, { status: 404 });
      }
    }

    // Get the next order index if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const lastWidget = await prisma.widget.findFirst({
        where: { dashboardId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true }
      });
      finalOrderIndex = (lastWidget?.orderIndex ?? -1) + 1;
    }

    const widget = await prisma.widget.create({
      data: {
        dashboardId,
        parentId,
        type,
        config,
        position,
        orderIndex: finalOrderIndex,
      },
      include: {
        children: true
      }
    });

    return NextResponse.json(widget, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating widget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
