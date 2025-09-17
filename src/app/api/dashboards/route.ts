import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';

/**
 * GET /api/dashboards
 * List all dashboards for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = DashboardValidators.validateQuery(searchParams);

    const result = await DashboardService.getDashboards(
      session.user.tenantId,
      session.user.id,
      queryParams
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboards
 * Create a new dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = DashboardValidators.validateCreate(body);

    const dashboard = await DashboardService.createDashboard(
      validatedData,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    
    const validationError = handleValidationError(error);
    
    if (validationError instanceof Error) {
      return NextResponse.json(
        { error: validationError.message, field: validationError.field },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}