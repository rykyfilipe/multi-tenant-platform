/**
 * Dashboard Service
 * Business logic for dashboard and widget operations
 */

import { prisma } from '@/lib/prisma';
import { errorTracker } from '@/lib/error-tracker';
import { usageAnalytics } from '@/lib/usage-analytics';
import { DashboardValidators, WidgetType } from './dashboard-validators';

export interface DashboardFilters {
  search?: string;
  mode?: 'view' | 'edit';
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

export interface WidgetFilters {
  type?: WidgetType;
  isVisible?: boolean;
}

export interface DashboardWithWidgets {
  id: number;
  name: string;
  description: string | null;
  mode: string;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
  widgets: Array<{
    id: number;
    type: string;
    title: string | null;
    position: any;
    config: any;
    isVisible: boolean;
    order: number;
  }>;
  _count: {
    widgets: number;
  };
}

export class DashboardService {
  /**
   * Get dashboards for a tenant with filtering and pagination
   */
  static async getDashboards(
    tenantId: number,
    userId: number,
    filters: DashboardFilters = {}
  ): Promise<{
    dashboards: DashboardWithWidgets[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const {
        search = '',
        mode,
        isPublic,
        page = 1,
        limit = 20,
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        tenantId,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (mode) {
        where.mode = mode;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic;
      }

      // Get dashboards with pagination
      const [dashboards, total] = await Promise.all([
        prisma.dashboard.findMany({
          where,
          include: {
            creator: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            updater: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            widgets: {
              select: { id: true, type: true, title: true, isVisible: true, order: true },
              orderBy: { order: 'asc' },
            },
            _count: {
              select: { widgets: true },
            },
          },
          orderBy: [
            { isDefault: 'desc' },
            { updatedAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.dashboard.count({ where }),
      ]);

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        '/api/dashboards',
        'GET',
        200,
        Date.now() - performance.now(),
        undefined,
        undefined,
        { search, mode, isPublic, page, limit }
      );

      return {
        dashboards,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'getDashboards', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Get a specific dashboard by ID
   */
  static async getDashboard(
    dashboardId: number,
    tenantId: number,
    userId: number
  ): Promise<DashboardWithWidgets | null> {
    try {
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          updater: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          widgets: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { widgets: true },
          },
        },
      });

      if (dashboard) {
        // Track usage
        usageAnalytics.trackApiUsage(
          userId,
          tenantId,
          `/api/dashboards/${dashboardId}`,
          'GET',
          200,
          Date.now() - performance.now(),
          undefined,
          JSON.stringify(dashboard).length,
          { dashboardId }
        );
      }

      return dashboard;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'getDashboard', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Create a new dashboard
   */
  static async createDashboard(
    data: {
      name: string;
      description?: string;
      mode?: 'view' | 'edit';
      isPublic?: boolean;
      isDefault?: boolean;
    },
    tenantId: number,
    userId: number
  ): Promise<DashboardWithWidgets> {
    try {
      // Validate data
      const validatedData = DashboardValidators.validateCreate(data);

      // Check if name already exists for this tenant
      const existingDashboard = await prisma.dashboard.findFirst({
        where: {
          tenantId,
          name: validatedData.name,
        },
      });

      if (existingDashboard) {
        throw new Error('Dashboard with this name already exists');
      }

      // If setting as default, unset other default dashboards
      if (validatedData.isDefault) {
        await prisma.dashboard.updateMany({
          where: {
            tenantId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      // Create dashboard
      const dashboard = await prisma.dashboard.create({
        data: {
          ...validatedData,
          tenantId,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          updater: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          widgets: true,
          _count: {
            select: { widgets: true },
          },
        },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        '/api/dashboards',
        'POST',
        201,
        Date.now() - performance.now(),
        JSON.stringify(data).length,
        JSON.stringify(dashboard).length,
        { dashboardId: dashboard.id, name: dashboard.name }
      );

      return dashboard;
    } catch (error) {
      console.error('Error creating dashboard:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'createDashboard', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Update a dashboard
   */
  static async updateDashboard(
    dashboardId: number,
    data: {
      name?: string;
      description?: string;
      mode?: 'view' | 'edit';
      isPublic?: boolean;
      isDefault?: boolean;
    },
    tenantId: number,
    userId: number
  ): Promise<DashboardWithWidgets> {
    try {
      // Validate data
      const validatedData = DashboardValidators.validateUpdate(data);

      // Check if dashboard exists and belongs to tenant
      const existingDashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
      });

      if (!existingDashboard) {
        throw new Error('Dashboard not found');
      }

      // Check if name already exists for this tenant (if name is being updated)
      if (validatedData.name && validatedData.name !== existingDashboard.name) {
        const nameExists = await prisma.dashboard.findFirst({
          where: {
            tenantId,
            name: validatedData.name,
            id: { not: dashboardId },
          },
        });

        if (nameExists) {
          throw new Error('Dashboard with this name already exists');
        }
      }

      // If setting as default, unset other default dashboards
      if (validatedData.isDefault) {
        await prisma.dashboard.updateMany({
          where: {
            tenantId,
            isDefault: true,
            id: { not: dashboardId },
          },
          data: { isDefault: false },
        });
      }

      // Update dashboard
      const updatedDashboard = await prisma.dashboard.update({
        where: { id: dashboardId },
        data: {
          ...validatedData,
          updatedBy: userId,
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          updater: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          widgets: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { widgets: true },
          },
        },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        `/api/dashboards/${dashboardId}`,
        'PUT',
        200,
        Date.now() - performance.now(),
        JSON.stringify(data).length,
        JSON.stringify(updatedDashboard).length,
        { dashboardId, updatedFields: Object.keys(validatedData) }
      );

      return updatedDashboard;
    } catch (error) {
      console.error('Error updating dashboard:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'updateDashboard', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Delete a dashboard
   */
  static async deleteDashboard(
    dashboardId: number,
    tenantId: number,
    userId: number
  ): Promise<void> {
    try {
      // Check if dashboard exists and belongs to tenant
      const existingDashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
      });

      if (!existingDashboard) {
        throw new Error('Dashboard not found');
      }

      // Prevent deletion of default dashboard
      if (existingDashboard.isDefault) {
        throw new Error('Cannot delete default dashboard');
      }

      // Delete dashboard (widgets will be deleted due to cascade)
      await prisma.dashboard.delete({
        where: { id: dashboardId },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        `/api/dashboards/${dashboardId}`,
        'DELETE',
        200,
        Date.now() - performance.now(),
        undefined,
        undefined,
        { dashboardId, name: existingDashboard.name }
      );
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'deleteDashboard', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Get widgets for a dashboard
   */
  static async getWidgets(
    dashboardId: number,
    tenantId: number,
    userId: number,
    filters: WidgetFilters = {}
  ): Promise<any[]> {
    try {
      // Verify dashboard exists and belongs to tenant
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
      });

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Build where clause
      const where: any = {
        dashboardId,
      };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.isVisible !== undefined) {
        where.isVisible = filters.isVisible;
      }

      // Get widgets
      const widgets = await prisma.widget.findMany({
        where,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          updater: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { order: 'asc' },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        `/api/dashboards/${dashboardId}/widgets`,
        'GET',
        200,
        Date.now() - performance.now(),
        undefined,
        JSON.stringify(widgets).length,
        { dashboardId, ...filters }
      );

      return widgets;
    } catch (error) {
      console.error('Error fetching widgets:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'getWidgets', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Create a widget
   */
  static async createWidget(
    dashboardId: number,
    data: {
      type: WidgetType;
      title?: string;
      position: { x: number; y: number; width: number; height: number };
      config?: any;
      isVisible?: boolean;
      order?: number;
    },
    tenantId: number,
    userId: number
  ): Promise<any> {
    try {
      // Validate data
      const validatedData = DashboardValidators.validateWidgetCreate(data);

      // Verify dashboard exists and belongs to tenant
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
      });

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Validate widget configuration
      if (validatedData.config) {
        DashboardValidators.validateWidgetConfig(validatedData.type, validatedData.config);
      }

      // Create widget
      const widget = await prisma.widget.create({
        data: {
          ...validatedData,
          dashboardId,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          updater: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        `/api/dashboards/${dashboardId}/widgets`,
        'POST',
        201,
        Date.now() - performance.now(),
        JSON.stringify(data).length,
        JSON.stringify(widget).length,
        { dashboardId, widgetId: widget.id, type: widget.type }
      );

      return widget;
    } catch (error) {
      console.error('Error creating widget:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'createWidget', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Update a widget
   */
  static async updateWidget(
    dashboardId: number,
    widgetId: number,
    data: {
      type?: WidgetType;
      title?: string;
      position?: { x: number; y: number; width: number; height: number };
      config?: any;
      isVisible?: boolean;
      order?: number;
    },
    tenantId: number,
    userId: number
  ): Promise<any> {
    try {
      // Validate data
      const validatedData = DashboardValidators.validateWidgetUpdate(data);

      // Verify dashboard exists and belongs to tenant
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
      });

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Check if widget exists
      const existingWidget = await prisma.widget.findFirst({
        where: {
          id: widgetId,
          dashboardId,
        },
      });

      if (!existingWidget) {
        throw new Error('Widget not found');
      }

      // Validate widget configuration if provided
      if (validatedData.config && validatedData.type) {
        DashboardValidators.validateWidgetConfig(validatedData.type, validatedData.config);
      }

      // Update widget
      const updatedWidget = await prisma.widget.update({
        where: { id: widgetId },
        data: {
          ...validatedData,
          updatedBy: userId,
        },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          updater: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        `/api/dashboards/${dashboardId}/widgets/${widgetId}`,
        'PUT',
        200,
        Date.now() - performance.now(),
        JSON.stringify(data).length,
        JSON.stringify(updatedWidget).length,
        { dashboardId, widgetId, updatedFields: Object.keys(validatedData) }
      );

      return updatedWidget;
    } catch (error) {
      console.error('Error updating widget:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'updateWidget', tenantId, userId },
        'high'
      );
      throw error;
    }
  }

  /**
   * Delete a widget
   */
  static async deleteWidget(
    dashboardId: number,
    widgetId: number,
    tenantId: number,
    userId: number
  ): Promise<void> {
    try {
      // Verify dashboard exists and belongs to tenant
      const dashboard = await prisma.dashboard.findFirst({
        where: {
          id: dashboardId,
          tenantId,
        },
      });

      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      // Check if widget exists
      const existingWidget = await prisma.widget.findFirst({
        where: {
          id: widgetId,
          dashboardId,
        },
      });

      if (!existingWidget) {
        throw new Error('Widget not found');
      }

      // Delete widget
      await prisma.widget.delete({
        where: { id: widgetId },
      });

      // Track usage
      usageAnalytics.trackApiUsage(
        userId,
        tenantId,
        `/api/dashboards/${dashboardId}/widgets/${widgetId}`,
        'DELETE',
        200,
        Date.now() - performance.now(),
        undefined,
        undefined,
        { dashboardId, widgetId, type: existingWidget.type }
      );
    } catch (error) {
      console.error('Error deleting widget:', error);
      errorTracker.trackError(
        error as Error,
        { action: 'deleteWidget', tenantId, userId },
        'high'
      );
      throw error;
    }
  }
}
