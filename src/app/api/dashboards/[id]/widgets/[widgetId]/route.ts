import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';

/**
 * GET /api/dashboards/[id]/widgets/[widgetId]
 * Get a specific widget
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = parseInt(params.id);
    const widgetId = parseInt(params.widgetId);
    
    if (isNaN(dashboardId) || isNaN(widgetId)) {
      return NextResponse.json({ error: 'Invalid dashboard or widget ID' }, { status: 400 });
    }

    // Get all widgets for the dashboard and find the specific one
    const widgets = await DashboardService.getWidgets(
      dashboardId,
      Number(session.user.tenantId),
      Number(session.user.id)
    );

    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Error fetching widget:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch widget' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboards/[id]/widgets/[widgetId]
 * Update a specific widget
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = parseInt(params.id);
    const widgetId = parseInt(params.widgetId);
    
    if (isNaN(dashboardId) || isNaN(widgetId)) {
      return NextResponse.json({ error: 'Invalid dashboard or widget ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = DashboardValidators.validateWidgetUpdate(body);

    const updatedWidget = await DashboardService.updateWidget(
      dashboardId,
      widgetId,
      validatedData as any,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json(updatedWidget);
  } catch (error) {
    console.error('Error updating widget:', error);
    
    const validationError = handleValidationError(error);
    
    if (validationError instanceof Error) {
      return NextResponse.json(
        { error: validationError.message, field: validationError.field },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update widget' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboards/[id]/widgets/[widgetId]
 * Delete a specific widget
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = parseInt(params.id);
    const widgetId = parseInt(params.widgetId);
    
    if (isNaN(dashboardId) || isNaN(widgetId)) {
      return NextResponse.json({ error: 'Invalid dashboard or widget ID' }, { status: 400 });
    }

    await DashboardService.deleteWidget(
      dashboardId,
      widgetId,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json({ message: 'Widget deleted successfully' });
  } catch (error) {
    console.error('Error deleting widget:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete widget' },
      { status: 500 }
    );
  }
}