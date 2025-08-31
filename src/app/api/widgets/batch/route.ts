import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const batchUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    config: z.record(z.any()).optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      minW: z.number().optional(),
      minH: z.number().optional(),
      maxW: z.number().optional(),
      maxH: z.number().optional(),
    }).optional(),
    parentId: z.string().optional(),
    orderIndex: z.number().optional(),
  }))
});

export async function PATCH(request: NextRequest) {
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
    const { updates } = batchUpdateSchema.parse(body);

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    if (updates.length > 100) {
      return NextResponse.json({ error: 'Too many updates (max 100)' }, { status: 400 });
    }

    // Get all widget IDs to verify ownership
    const widgetIds = updates.map(u => u.id);
    const widgets = await prisma.widget.findMany({
      where: { id: { in: widgetIds } },
      include: {
        dashboard: {
          select: { userId: true }
        }
      }
    });

    if (widgets.length !== widgetIds.length) {
      return NextResponse.json({ error: 'Some widgets not found' }, { status: 404 });
    }

    // Verify all widgets belong to the user
    const unauthorizedWidgets = widgets.filter(w => w.dashboard.userId !== user.id);
    if (unauthorizedWidgets.length > 0) {
      return NextResponse.json({ error: 'Unauthorized access to some widgets' }, { status: 403 });
    }

    // Group updates by dashboard to optimize database operations
    const updatesByDashboard = new Map<string, typeof updates>();
    widgets.forEach(widget => {
      if (!updatesByDashboard.has(widget.dashboardId)) {
        updatesByDashboard.set(widget.dashboardId, []);
      }
      const update = updates.find(u => u.id === widget.id);
      if (update) {
        updatesByDashboard.get(widget.dashboardId)!.push(update);
      }
    });

    // Process updates in parallel for each dashboard
    const updatePromises = Array.from(updatesByDashboard.entries()).map(async ([dashboardId, dashboardUpdates]) => {
      const updatePromises = dashboardUpdates.map(async (update) => {
        const updateData: any = {};
        
        if (update.config !== undefined) updateData.config = update.config;
        if (update.position !== undefined) updateData.position = update.position;
        if (update.parentId !== undefined) updateData.parentId = update.parentId;
        if (update.orderIndex !== undefined) updateData.orderIndex = update.orderIndex;

        return prisma.widget.update({
          where: { id: update.id },
          data: updateData,
          include: { children: true }
        });
      });

      return Promise.all(updatePromises);
    });

    const results = await Promise.all(updatePromises);
    const updatedWidgets = results.flat();

    return NextResponse.json({
      message: `Successfully updated ${updatedWidgets.length} widgets`,
      updatedWidgets
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in batch update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
