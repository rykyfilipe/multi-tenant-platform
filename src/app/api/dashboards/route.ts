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
  console.log('🌐 GET /api/dashboards - Starting request');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id, 
      tenantId: session?.user?.tenantId 
    });
    
    if (!session?.user?.id || !session.user.tenantId) {
      console.log('❌ Unauthorized - missing session or tenantId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    console.log('📋 Search params:', Object.fromEntries(searchParams.entries()));
    
    const queryParams = DashboardValidators.validateQuery(searchParams);
    console.log('✅ Validated query params:', queryParams);

    console.log('📊 Calling DashboardService.getDashboards with:', {
      tenantId: Number(session.user.tenantId),
      userId: Number(session.user.id),
      queryParams
    });

    const result = await DashboardService.getDashboards(
      Number(session.user.tenantId),
      Number(session.user.id),
      queryParams
    );

    console.log('🎯 DashboardService result:', {
      dashboardsCount: result.dashboards?.length || 0,
      hasPagination: !!result.pagination,
      resultKeys: Object.keys(result)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('💥 Error fetching dashboards:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      console.log('⚠️ Validation error:', error.message);
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
      Number(session.user.tenantId),
      Number(session.user.id)
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