/** @format */

import { Step } from 'react-joyride';
import { Settings, User, Shield, CreditCard, Bell, Palette, Globe, Database } from 'lucide-react';

export const settingsTour: Step[] = [
  {
    target: '[data-tour-id="settings-header"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Settings & Preferences</h3>
            <p className="text-sm text-gray-600">Customize your experience</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Welcome to the settings page! Here you can customize your account, 
          manage security settings, configure billing, and adjust your preferences.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>⚙️ Personalization:</strong> Make the platform work exactly 
            how you want it to with these comprehensive settings.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour-id="settings-navigation"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Settings Navigation</h3>
            <p className="text-sm text-gray-600">Explore different sections</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Use the navigation menu to access different settings sections. Each section 
          is organized by category to help you find what you're looking for quickly.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Profile - Personal information</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Security - Password and 2FA</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="w-4 h-4" />
            <span>Billing - Subscription and payments</span>
          </div>
        </div>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour-id="profile-settings"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
            <p className="text-sm text-gray-600">Update your personal information</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Keep your profile information up to date. This includes your name, email, 
          profile picture, and other personal details that appear across the platform.
        </p>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>👤 Identity:</strong> Your profile information helps team members 
            identify you in collaborative features.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="security-settings"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            <p className="text-sm text-gray-600">Protect your account</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Manage your account security with password changes, two-factor authentication, 
          and session management. Keep your account secure with these important settings.
        </p>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>🔒 Security:</strong> Enable 2FA and use strong passwords to protect 
            your data and your organization's information.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="subscription-settings"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Subscription & Billing</h3>
            <p className="text-sm text-gray-600">Manage your plan and payments</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          View your current subscription plan, manage billing information, and upgrade 
          or downgrade your plan as your needs change.
        </p>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>💳 Billing:</strong> View invoices, update payment methods, 
            and manage your subscription from this section.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour-id="notification-settings"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-600">Control how you're notified</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Customize how and when you receive notifications. Choose between email, 
          in-app notifications, and weekly digests to stay informed without being overwhelmed.
        </p>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-indigo-800">
            <strong>🔔 Notifications:</strong> Stay updated on important changes 
            while avoiding notification fatigue.
          </p>
        </div>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour-id="appearance-settings"]',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
            <Palette className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Appearance & Language</h3>
            <p className="text-sm text-gray-600">Customize your experience</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Personalize the platform's appearance with theme settings, language preferences, 
          and timezone configuration to match your workflow.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Palette className="w-4 h-4" />
            <span>Theme - Light, dark, or system</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <span>Language - Choose your preferred language</span>
          </div>
        </div>
      </div>
    ),
    placement: 'right',
  }
];

export const settingsTourConfig = {
  id: 'settings',
  name: 'Settings Tour',
  description: 'Learn how to customize your account and preferences',
  steps: settingsTour,
  roles: ['ADMIN', 'EDITOR', 'VIEWER'],
  features: [],
  autoStart: true,
  priority: 6
};
