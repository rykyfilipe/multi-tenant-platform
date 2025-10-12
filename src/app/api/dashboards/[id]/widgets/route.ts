import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';

// ⚡ DISABLE ALL CACHING - Force dynamic rendering for instant updates
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/dashboards/[id]/widgets
 * List all widgets for a specific dashboard
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

    const { searchParams } = new URL(request.url);
    const queryParams = DashboardValidators.validateWidgetQuery(searchParams);

    const widgets = await DashboardService.getWidgets(
      dashboardId,
      Number(session.user.tenantId),
      Number(session.user.id)   ,
      queryParams as any
    );

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error('Error fetching widgets:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch widgets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboards/[id]/widgets
 * Create a new widget for a dashboard
 */
export async function POST(
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
    const validatedData = DashboardValidators.validateWidgetCreate(body);

    const widget = await DashboardService.createWidget(
      dashboardId,
      validatedData as any,
      Number(session.user.tenantId) ,
      Number(session.user.id)
    );

    return NextResponse.json(widget, { status: 201 });
  } catch (error) {
    console.error('Error creating widget:', error);
    
    const validationError = handleValidationError(error);
    
    if (validationError instanceof Error) {
      return NextResponse.json(
        { error: validationError.message, field: validationError.field },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create widget' },
      { status: 500 }
    );
  }
}