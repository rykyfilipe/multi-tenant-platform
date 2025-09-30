import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';

/**
 * GET /api/dashboards
 * List all dashboards for the current tenant
 */
export async function GET(request: NextRequest) {
 

  try {
    // Try multiple authentication methods
    let userId: number | null = null;
    let tenantId: number | null = null;

    // Method 1: Try NextAuth session
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      tenantId: session?.user?.tenantId,
      email: session?.user?.email
    });

    if (session?.user?.id && session.user.tenantId) {
      userId = Number(session.user.id);
      tenantId = Number(session.user.tenantId);
      console.log('✅ Using NextAuth session:', { userId, tenantId });
    } else {
      // Method 2: Try JWT token from cookies (NextAuth format)
      console.log('🔍 Trying cookie-based authentication...');
      try {
        const jwtToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
        if (jwtToken?.id && jwtToken?.tenantId) {
          userId = Number(jwtToken.id);
          tenantId = Number(jwtToken.tenantId);
          console.log('✅ Using cookie JWT token:', { userId, tenantId });
        }
      } catch (error) {
        console.log('❌ Cookie JWT token validation failed:', error);
      }

      // Method 3: Try Authorization header as fallback
      if (!userId || !tenantId) {
        console.log('🔍 Trying Authorization header authentication...');
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          try {
            // For custom JWT tokens, we need to decode them manually
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET);
            if (decoded?.userId || decoded?.id) {
              userId = decoded.userId || decoded.id;
              console.log('✅ Using custom JWT token:', { userId });

              // Look up tenantId from user if not provided in token
              if (!tenantId && userId) {
                console.log('🔍 Looking up tenantId for user:', userId);
                const user = await prisma.user.findUnique({
                  where: { id: userId },
                  select: { tenantId: true }
                });
                if (user?.tenantId) {
                  tenantId = user.tenantId;
                  console.log('✅ Found tenantId:', tenantId);
                }
              }
            }
          } catch (error) {
            console.log('❌ Custom JWT token validation failed:', error);
          }
        }
      }

      if (!userId || !tenantId) {
        console.log('❌ No valid authentication found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    console.log('📋 Search params:', Object.fromEntries(searchParams.entries()));
    
    const queryParams = DashboardValidators.validateQuery(searchParams);
    console.log('✅ Validated query params:', queryParams);

    console.log('📊 Calling DashboardService.getDashboards with:', {
      tenantId,
      userId,
      queryParams
    });

    const result = await DashboardService.getDashboards(
      tenantId!,
      userId!,
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
    // Try multiple authentication methods
    let userId: number | null = null;
    let tenantId: number | null = null;

    // Method 1: Try NextAuth session
    const session = await getServerSession(authOptions);
    if (session?.user?.id && session.user.tenantId) {
      userId = Number(session.user.id);
      tenantId = Number(session.user.tenantId);
    } else {
      // Method 2: Try JWT token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const jwtToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
          if (jwtToken?.id && jwtToken?.tenantId) {
            userId = Number(jwtToken.id);
            tenantId = Number(jwtToken.tenantId);
          }
        } catch (error) {
          console.log('❌ JWT token validation failed in POST:', error);
        }
      }

      if (!userId || !tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const validatedData = DashboardValidators.validateCreate(body);

    const dashboard = await DashboardService.createDashboard(
      validatedData,
      tenantId!,
      userId!
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