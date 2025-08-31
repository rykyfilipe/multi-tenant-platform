import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateWidgetSchema = z.object({
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
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const updateData = updateWidgetSchema.parse(body);

    // Get the widget to verify ownership
    const widget = await prisma.widget.findFirst({
      where: { id: params.id },
      include: {
        dashboard: {
          select: { userId: true }
        }
      }
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    if (widget.dashboard.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If parentId is being updated, verify it exists and belongs to the same dashboard
    if (updateData.parentId !== undefined) {
      if (updateData.parentId) {
        const parentWidget = await prisma.widget.findFirst({
          where: {
            id: updateData.parentId,
            dashboardId: widget.dashboardId,
          },
          select: { id: true }
        });

        if (!parentWidget) {
          return NextResponse.json({ error: 'Parent widget not found' }, { status: 404 });
        }
      }
    }

    const updatedWidget = await prisma.widget.update({
      where: { id: params.id },
      data: updateData,
      include: {
        children: true
      }
    });

    return NextResponse.json(updatedWidget);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating widget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the widget to verify ownership
    const widget = await prisma.widget.findFirst({
      where: { id: params.id },
      include: {
        dashboard: {
          select: { userId: true }
        }
      }
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    if (widget.dashboard.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete widget and all its children (cascade)
    await prisma.widget.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Widget deleted successfully' });
  } catch (error) {
    console.error('Error deleting widget:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
