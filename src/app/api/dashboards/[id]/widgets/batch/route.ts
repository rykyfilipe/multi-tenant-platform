import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';
import { z } from 'zod';

// Batch operation schema - unified to use 'kind' for operation type
const BatchOperationSchema = z.object({
  id: z.string(),
  kind: z.enum(['create', 'update', 'delete']),
  widget: z.any().optional(),
  widgetId: z.number().optional(),
  expectedVersion: z.number().optional(),
  patch: z.any().optional(),
});

const BatchRequestSchema = z.object({
  operations: z.array(BatchOperationSchema).min(1, 'At least one operation is required'),
});

/**
 * POST /api/dashboards/[id]/widgets/batch
 * Process multiple widget operations in a single request
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
    const validatedData = BatchRequestSchema.parse(body);

    const results = [];
    const errors = [];

    // Process each operation
    for (let i = 0; i < validatedData.operations.length; i++) {
      const operation = validatedData.operations[i];
      const operationType = operation.kind;
      
      try {
        let result;
        
        switch (operationType) {
          case 'create':
            const createPayload = operation.widget;
            if (!createPayload) {
              throw new Error('Widget data is required for create operation');
            }
            
            console.log('[batch] Create payload received:', JSON.stringify(createPayload, null, 2));
            
            // Get widget type - should already be uppercase WidgetType enum
            const widgetType = createPayload.type;
            
            if (!widgetType) {
              console.error('[batch] No valid widget type found in payload:', createPayload);
              throw new Error('Widget type is required but not found in payload');
            }
            
            console.log('[batch] Widget type:', widgetType);
            
            // Validate widget creation data  
            const createData = DashboardValidators.validateWidgetCreate(createPayload);
            
            result = await DashboardService.createWidget(
              dashboardId,
              createData as any,
              Number(session.user.tenantId),
              Number(session.user.id)
            );
            break;
            
          case 'update':
            const updateWidgetId = operation.widgetId;
            const updatePayload = operation.patch;
            
            if (!updateWidgetId || !updatePayload) {
              throw new Error('Widget ID and update data are required for update operation');
            }
            
            // Validate widget update data
            const updateData = DashboardValidators.validateWidgetUpdate(updatePayload);
            
            result = await DashboardService.updateWidget(
              dashboardId,
              Number(updateWidgetId),
              updateData as any,
              Number(session.user.tenantId),
              Number(session.user.id)
            );
            break;
            
          case 'delete':
            if (!operation.widgetId) {
              throw new Error('Widget ID is required for delete operation');
            }
            
            await DashboardService.deleteWidget(
              dashboardId,
              Number(operation.widgetId),
              Number(session.user.tenantId),
              Number(session.user.id)
            );
            
            result = { success: true, widgetId: operation.widgetId };
            break;
            
          default:
            throw new Error(`Unknown operation type: ${operationType}`);
        }
        
        results.push({
          index: i,
          type: operationType,
          success: true,
          result,
        });
        
      } catch (error) {
        console.error(`Error processing operation ${i}:`, error);
        
        const validationError = handleValidationError(error);
        errors.push({
          index: i,
          type: operationType,
          success: false,
          error: validationError.message,
          field: validationError.field,
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: validatedData.operations.length,
        successful: results.length,
        failed: errors.length,
      },
    });

  } catch (error) {
    console.error('Error processing batch widget operations:', error);
    
    const validationError = handleValidationError(error);
    
    if (validationError instanceof Error) {
      return NextResponse.json(
        { error: validationError.message, field: validationError.field },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process batch operations' },
      { status: 500 }
    );
  }
}
