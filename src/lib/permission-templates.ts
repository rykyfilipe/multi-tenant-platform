/** @format */

/**
 * Permission Templates System
 * Provides predefined permission sets for quick assignment
 */

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'general' | 'departmental' | 'project';
  permissions: {
    // Table permissions
    tables?: {
      canRead: boolean;
      canEdit: boolean;
      canDelete: boolean;
    };
    // Dashboard permissions
    dashboards?: {
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canShare: boolean;
    };
    // Column permissions (optional fine-grained control)
    columns?: {
      canRead: boolean;
      canEdit: boolean;
    };
  };
  color: string;
}

/**
 * Predefined Permission Templates
 */
export const PERMISSION_TEMPLATES: PermissionTemplate[] = [
  // General Templates
  {
    id: 'full-access',
    name: 'Full Access',
    description: 'Complete access to all resources and features',
    icon: '🔓',
    category: 'general',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: true,
      },
      dashboards: {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'read-only',
    name: 'Read Only',
    description: 'View-only access to all resources',
    icon: '👁️',
    category: 'general',
    permissions: {
      tables: {
        canRead: true,
        canEdit: false,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: true,
        canEdit: false,
      },
    },
    color: 'from-slate-500 to-slate-600',
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Can view and edit, but not delete',
    icon: '✏️',
    category: 'general',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-blue-500 to-cyan-500',
  },
  
  // Departmental Templates
  {
    id: 'finance-team',
    name: 'Finance Team',
    description: 'Access to financial data and reports',
    icon: '💰',
    category: 'departmental',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: true,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'sales-team',
    name: 'Sales Team',
    description: 'Access to sales data and customer information',
    icon: '📊',
    category: 'departmental',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: true,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'hr-team',
    name: 'HR Team',
    description: 'Access to employee and HR data',
    icon: '👥',
    category: 'departmental',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'marketing-team',
    name: 'Marketing Team',
    description: 'Access to marketing and analytics data',
    icon: '📢',
    category: 'departmental',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: true,
      },
      columns: {
        canRead: true,
        canEdit: false,
      },
    },
    color: 'from-indigo-500 to-purple-500',
  },
  
  // Project-based Templates
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'Manage projects and team resources',
    icon: '📋',
    category: 'project',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: true,
      },
      dashboards: {
        canView: true,
        canEdit: true,
        canDelete: false,
        canShare: true,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'project-contributor',
    name: 'Project Contributor',
    description: 'Contribute to projects and view progress',
    icon: '🤝',
    category: 'project',
    permissions: {
      tables: {
        canRead: true,
        canEdit: true,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: true,
        canEdit: true,
      },
    },
    color: 'from-lime-500 to-green-500',
  },
  {
    id: 'project-viewer',
    name: 'Project Viewer',
    description: 'View project status and reports',
    icon: '👀',
    category: 'project',
    permissions: {
      tables: {
        canRead: true,
        canEdit: false,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: true,
        canEdit: false,
      },
    },
    color: 'from-gray-500 to-slate-500',
  },
  
  // Custom/Restricted Templates
  {
    id: 'auditor',
    name: 'Auditor',
    description: 'Read-only access with full visibility for compliance',
    icon: '🔍',
    category: 'general',
    permissions: {
      tables: {
        canRead: true,
        canEdit: false,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: true,
        canEdit: false,
      },
    },
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'guest',
    name: 'Guest',
    description: 'Limited view access for external users',
    icon: '🚪',
    category: 'general',
    permissions: {
      tables: {
        canRead: true,
        canEdit: false,
        canDelete: false,
      },
      dashboards: {
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
      },
      columns: {
        canRead: false, // Restricted column access
        canEdit: false,
      },
    },
    color: 'from-gray-400 to-gray-500',
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): PermissionTemplate | undefined {
  return PERMISSION_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: PermissionTemplate['category']): PermissionTemplate[] {
  return PERMISSION_TEMPLATES.filter(t => t.category === category);
}

/**
 * Apply template to a list of resources
 */
export function applyTemplateToTables(
  template: PermissionTemplate,
  tableIds: number[],
  userId: number,
  tenantId: number
) {
  if (!template.permissions.tables) return [];

  return tableIds.map(tableId => ({
    userId,
    tableId,
    tenantId,
    canRead: template.permissions.tables!.canRead,
    canEdit: template.permissions.tables!.canEdit,
    canDelete: template.permissions.tables!.canDelete,
  }));
}

/**
 * Apply template to dashboards
 */
export function applyTemplateToDashboards(
  template: PermissionTemplate,
  dashboardIds: number[],
  userId: number,
  tenantId: number
) {
  if (!template.permissions.dashboards) return [];

  return dashboardIds.map(dashboardId => ({
    userId,
    dashboardId,
    tenantId,
    canView: template.permissions.dashboards!.canView,
    canEdit: template.permissions.dashboards!.canEdit,
    canDelete: template.permissions.dashboards!.canDelete,
    canShare: template.permissions.dashboards!.canShare,
  }));
}

/**
 * Get all available templates grouped by category
 */
export function getTemplatesGrouped() {
  return {
    general: getTemplatesByCategory('general'),
    departmental: getTemplatesByCategory('departmental'),
    project: getTemplatesByCategory('project'),
  };
}

