/** @format */

import React from 'react';
import { BarChart3, Database, Users, Settings, FileText, CreditCard } from 'lucide-react';

export const dashboardTour = [
  {
    target: '[data-tour-id="dashboard-stats"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>
            <p className="text-sm text-gray-600">Your command center</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Welcome to your dashboard! Here you can see an overview of all your key metrics, 
          recent activity, and quick access to all major features.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro Tip:</strong> This dashboard updates in real-time as you use the platform. 
            Keep an eye on your usage to stay within plan limits.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="quick-actions"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-600">Get started quickly</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          These are your most frequently used actions. Create databases, manage tables, 
          and access your data with just one click.
        </p>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>⚡ Quick Start:</strong> New to the platform? Start by creating your first database 
            to organize your data.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour-id="navigation-menu"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Navigation Menu</h3>
            <p className="text-sm text-gray-600">Explore all features</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Use the navigation menu to access all platform features. Each section is designed 
          for specific tasks like data management, user administration, and analytics.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>Database - Manage your data</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Users - Team management</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Invoices - Billing & invoices</span>
          </div>
        </div>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour-id="recent-activity"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600">Stay updated</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Track what's happening across your organization. See recent changes, 
          user activities, and system updates in real-time.
        </p>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>🔍 Monitor:</strong> Keep track of team activities and data changes 
            to maintain security and collaboration.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="help-tour-button"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Help & Support</h3>
            <p className="text-sm text-gray-600">Get assistance anytime</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Need help? Click this button anytime to access tutorials, documentation, 
          and restart any tour. We're here to help you succeed!
        </p>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-800">
            <strong>🎯 Remember:</strong> You can restart this tour or access other tutorials 
            anytime using the help button.
          </p>
        </div>
      </div>
    ),
    placement: 'left',
  }
];

export const dashboardTourConfig = {
  id: 'dashboard',
  name: 'Dashboard Tour',
  description: 'Learn the basics of your dashboard and navigation',
  steps: dashboardTour,
  roles: ['ADMIN', 'EDITOR', 'VIEWER'],
  features: [],
  autoStart: true,
  priority: 10
};
