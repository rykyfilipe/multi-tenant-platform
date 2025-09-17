import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';

/**
 * GET /api/dashboards/[id]
 * Get a specific dashboard by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = parseInt(params.id);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    const dashboard = await DashboardService.getDashboard(
      dashboardId,
      Number(session.user.tenantId),
      Number(session.user.id)   
    );

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboards/[id]
 * Update a specific dashboard
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = parseInt(params.id);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = DashboardValidators.validateUpdate(body);

    const updatedDashboard = await DashboardService.updateDashboard(
      dashboardId,
      validatedData,
      Number(session.user.tenantId),
      Number(session.user.id)
    );

    return NextResponse.json(updatedDashboard);
  } catch (error) {
    console.error('Error updating dashboard:', error);
    
    const validationError = handleValidationError(error);
    
    if (validationError instanceof Error) {
      return NextResponse.json(
        { error: validationError.message, field: validationError.field },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboards/[id]
 * Delete a specific dashboard
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardId = parseInt(params.id);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    await DashboardService.deleteDashboard(
      dashboardId,
      Number(session.user.tenantId),
      Number(session.user.id)       
    );

    return NextResponse.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete dashboard' },
      { status: 500 }
    );
  }
}