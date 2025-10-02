import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';
import { z } from 'zod';

// Batch operation schema - supports both frontend format (kind) and backend format (type)
const BatchOperationSchema = z.union([
  // Frontend format (DraftOperation)
  z.object({
    id: z.string(),
    kind: z.enum(['create', 'update', 'delete']),
    widget: z.any().optional(),
    widgetId: z.number().optional(),
    expectedVersion: z.number().optional(),
    patch: z.any().optional(),
  }),
  // Legacy backend format
  z.object({
    type: z.enum(['create', 'update', 'delete']),
    widgetId: z.union([z.number(), z.string()]).optional(),
    data: z.any().optional(),
  })
]);

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
      
      try {
        let result;
        
        // Determine operation type - support both frontend (kind) and backend (type) formats
        const operationType = 'kind' in operation ? operation.kind : operation.type;
        
        switch (operationType) {
          case 'create':
            // Support both frontend format (widget) and backend format (data)
            const createPayload = 'widget' in operation ? operation.widget : operation.data;
            if (!createPayload) {
              throw new Error('Widget data is required for create operation');
            }
            
            // Normalize widget type from uppercase to lowercase for validation
            const normalizedPayload = {
              ...createPayload,
              type: createPayload.kind?.toLowerCase() || createPayload.type?.toLowerCase()
            };
            
            // Validate widget creation data
            const createData = DashboardValidators.validateWidgetCreate(normalizedPayload);
            
            // Validate widget configuration if provided
            if (createData.config && createData.type) {
              DashboardValidators.validateWidgetConfig(createData.type, createData.config);
            }
            
            result = await DashboardService.createWidget(
              dashboardId,
              createData as any,
              Number(session.user.tenantId),
              Number(session.user.id)
            );
            break;
            
          case 'update':
            // Support both frontend format (patch) and backend format (data)
            const updateWidgetId = 'patch' in operation ? operation.widgetId : operation.widgetId;
            const updatePayload = 'patch' in operation ? operation.patch : operation.data;
            
            if (!updateWidgetId || !updatePayload) {
              throw new Error('Widget ID and update data are required for update operation');
            }
            
            // Normalize widget type from uppercase to lowercase for validation
            const normalizedUpdatePayload = {
              ...updatePayload,
              type: updatePayload.kind?.toLowerCase() || updatePayload.type?.toLowerCase()
            };
            
            // Validate widget update data
            const updateData = DashboardValidators.validateWidgetUpdate(normalizedUpdatePayload);
            
            // Validate widget configuration if provided
            if (updateData.config && updateData.type) {
              DashboardValidators.validateWidgetConfig(updateData.type, updateData.config);
            }
            
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
