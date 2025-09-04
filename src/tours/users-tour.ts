/** @format */

import { Step } from 'react-joyride';
import { Users, UserPlus, Settings, Shield, Mail, CheckCircle, Clock } from 'lucide-react';

export const usersTour: Step[] = [
  {
    target: '[data-tour-id="users-header"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600">Manage your team effectively</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Welcome to the user management system! Here you can invite team members, 
          manage permissions, and control access to your organization's data and features.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>👥 Team Collaboration:</strong> Invite team members and assign roles 
            to work together on your data and projects.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="invite-user-button"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invite New Users</h3>
            <p className="text-sm text-gray-600">Expand your team</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Click here to invite new team members. They'll receive an email invitation 
          with instructions to join your organization and start collaborating.
        </p>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>📧 Invitations:</strong> Customize roles and permissions for each 
            new user before sending the invitation.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="users-table"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-600">View and manage your team</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          This table shows all team members, their roles, status, and last activity. 
          You can manage permissions, deactivate accounts, or remove users as needed.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Roles - Admin, Editor, or Viewer</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4" />
            <span>Status - Active or Inactive</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last Activity - When they last logged in</span>
          </div>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="user-actions"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Actions</h3>
            <p className="text-sm text-gray-600">Manage individual users</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Each user row has action buttons for common management tasks. Edit permissions, 
          resend invitations, deactivate accounts, or remove users from your organization.
        </p>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>⚙️ Permissions:</strong> Click on permissions to manage user access 
            to specific databases, tables, and columns.
          </p>
        </div>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour-id="pending-invitations"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
            <p className="text-sm text-gray-600">Track invitation status</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          This section shows all pending invitations that haven't been accepted yet. 
          You can resend invitations or cancel them if needed.
        </p>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-800">
            <strong>📬 Tracking:</strong> Monitor which invitations are still pending 
            and follow up with team members if needed.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="role-badges"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">User Roles</h3>
            <p className="text-sm text-gray-600">Understand permission levels</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Each user has a specific role that determines their access level. 
          Understanding these roles helps you assign appropriate permissions.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span><strong>Admin:</strong> Full access to everything</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span><strong>Editor:</strong> Can create and edit data</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span><strong>Viewer:</strong> Read-only access</span>
          </div>
        </div>
      </div>
    ),
    placement: 'right',
  }
];

export const usersTourConfig = {
  id: 'users',
  name: 'User Management Tour',
  description: 'Learn how to manage team members and permissions',
  steps: usersTour,
  roles: ['ADMIN'],
  features: [],
  autoStart: true,
  priority: 7
};
