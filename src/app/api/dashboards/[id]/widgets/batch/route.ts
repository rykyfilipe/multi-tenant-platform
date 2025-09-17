import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardService } from '@/lib/dashboard-service';
import { DashboardValidators, handleValidationError } from '@/lib/dashboard-validators';
import { z } from 'zod';

// Batch operation schema
const BatchOperationSchema = z.object({
  type: z.enum(['create', 'update', 'delete']),
  widgetId: z.number().optional(),
  data: z.any().optional(),
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
      
      try {
        let result;
        
        switch (operation.type) {
          case 'create':
            if (!operation.data) {
              throw new Error('Data is required for create operation');
            }
            
            // Validate widget creation data
            const createData = DashboardValidators.validateWidgetCreate(operation.data);
            
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
            if (!operation.widgetId || !operation.data) {
              throw new Error('Widget ID and data are required for update operation');
            }
            
            // Validate widget update data
            const updateData = DashboardValidators.validateWidgetUpdate(operation.data);
            
            // Validate widget configuration if provided
            if (updateData.config && updateData.type) {
              DashboardValidators.validateWidgetConfig(updateData.type, updateData.config);
            }
            
            result = await DashboardService.updateWidget(
              dashboardId,
              operation.widgetId,
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
              operation.widgetId,
              Number(session.user.tenantId),
              Number(session.user.id)
            );
            
            result = { success: true, widgetId: operation.widgetId };
            break;
            
          default:
            throw new Error(`Unknown operation type: ${operation.type}`);
        }
        
        results.push({
          index: i,
          type: operation.type,
          success: true,
          result,
        });
        
      } catch (error) {
        console.error(`Error processing operation ${i}:`, error);
        
        const validationError = handleValidationError(error);
        errors.push({
          index: i,
          type: operation.type,
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
