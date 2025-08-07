/** @format */

import React from "react";
import { StepType } from "@reactour/tour";

// Database page tour steps
export const databaseTourSteps: StepType[] = [
	{
		selector: ".database-selector",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Database Selection
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Select which database you want to work with. You can create multiple
					databases and switch between them to organize your data effectively.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						💡 <strong>Tip:</strong> Each database can contain multiple tables
						for different projects or data categories.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".add-table-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Create New Table
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Click this button to create a new table in your selected database. You
					can define columns, data types, and relationships to structure your
					data.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						✨ <strong>Feature:</strong> Tables support various data types
						including text, numbers, dates, and more.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".table-grid",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Tables Overview</h3>
				<p className='text-gray-600 leading-relaxed'>
					This grid displays all tables in your selected database. You can view,
					edit, and manage each table from here with quick access to all
					features.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						🔍 <strong>Quick Actions:</strong> Each table card shows key
						information and action buttons.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Conditional database tour steps (only shown when tables exist)
export const databaseTourStepsWithTables: StepType[] = [
	...databaseTourSteps,
	{
		selector: ".table-card",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Table Management
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Each table card shows the table name, description, and quick action
					buttons for managing columns, rows, and settings.
				</p>
				<div className='bg-orange-50 p-3 rounded-lg'>
					<p className='text-sm text-orange-700'>
						⚡ <strong>Actions:</strong> Click the buttons to manage columns,
						rows, or delete the table.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".columns-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Manage Columns</h3>
				<p className='text-gray-600 leading-relaxed'>
					This button takes you to the columns editor where you can define the
					structure of your table, including data types and constraints.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						📊 <strong>Structure:</strong> Define your table schema with various
						column types and properties.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".rows-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Manage Data</h3>
				<p className='text-gray-600 leading-relaxed'>
					This button takes you to the rows editor where you can add, edit, and
					manage the actual data in your table.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📝 <strong>Data Entry:</strong> Add, edit, and organize your table
						data with an intuitive interface.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Columns editor tour steps
export const columnsEditorTourSteps: StepType[] = [
	{
		selector: ".add-column-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Add New Column</h3>
				<p className='text-gray-600 leading-relaxed'>
					Click this button to add a new column to your table. You can define
					the column name, data type, and other properties.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						🔧 <strong>Types:</strong> Choose from text, number, date, boolean,
						and more data types.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".table-content",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Columns Overview
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					This area displays all your table columns. You can view, edit, and
					manage each column's properties.
				</p>
				<div className='bg-orange-50 p-3 rounded-lg'>
					<p className='text-sm text-orange-700'>
						✏️ <strong>Edit:</strong> Double-click any cell to edit column
						properties.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Conditional columns editor tour steps (only shown when columns exist)
export const columnsEditorTourStepsWithColumns: StepType[] = [
	...columnsEditorTourSteps,
	{
		selector: ".order-columns-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Column Order</h3>
				<p className='text-gray-600 leading-relaxed'>
					Manage the order of your columns by dragging and dropping them into
					the desired position.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						🎯 <strong>Organization:</strong> Arrange columns to match your data
						entry workflow.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".rows-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Data Management</h3>
				<p className='text-gray-600 leading-relaxed'>
					Switch to the rows editor to add and manage the actual data in your
					table.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📊 <strong>Data Entry:</strong> Start adding data once your columns
						are configured.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Rows editor tour steps
export const rowsEditorTourSteps: StepType[] = [
	{
		selector: ".add-row-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Add New Row</h3>
				<p className='text-gray-600 leading-relaxed'>
					Click this button to add a new row to your table. You can then fill in
					the data for each column.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						➕ <strong>Quick Add:</strong> Add multiple rows quickly with the
						form interface.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".columns-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Column Management
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Switch to the columns editor to modify the table structure or add new
					columns.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						⚙️ <strong>Structure:</strong> Modify column types and properties as
						needed.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".table-content",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Data Table</h3>
				<p className='text-gray-600 leading-relaxed'>
					This area displays all your table rows. You can view, edit, and manage
					each row of data.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						📝 <strong>Edit:</strong> Double-click any cell to edit the data
						directly.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Conditional rows editor tour steps (only shown when rows exist)
export const rowsEditorTourStepsWithRows: StepType[] = [
	...rowsEditorTourSteps,
	{
		selector: ".row-row",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Data Row</h3>
				<p className='text-gray-600 leading-relaxed'>
					Each row represents a record in your table. You can edit individual
					cells by double-clicking on them.
				</p>
				<div className='bg-orange-50 p-3 rounded-lg'>
					<p className='text-sm text-orange-700'>
						💾 <strong>Auto-save:</strong> Changes are automatically saved as
						you edit.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Dashboard tour steps
export const dashboardTourSteps: StepType[] = [
	{
		selector: ".dashboard-stats",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Overview Statistics
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Get a quick overview of your platform usage including databases,
					tables, users, and API tokens.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						📊 <strong>Real-time:</strong> Statistics update automatically as
						you use the platform.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Conditional dashboard tour steps (only shown when charts exist)
export const dashboardTourStepsWithCharts: StepType[] = [
	...dashboardTourSteps,
	{
		selector: ".usage-chart",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Usage Analytics</h3>
				<p className='text-gray-600 leading-relaxed'>
					Monitor your resource usage over time with interactive charts and
					graphs.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📈 <strong>Trends:</strong> Track usage patterns and plan your
						resources accordingly.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".activity-chart",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>User Activity</h3>
				<p className='text-gray-600 leading-relaxed'>
					View user activity patterns and engagement metrics to understand how
					your team uses the platform.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						👥 <strong>Insights:</strong> Understand team usage patterns and
						optimize workflows.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Settings tour steps
export const settingsTourSteps: StepType[] = [
	{
		selector: ".settings-navigation",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Settings Navigation
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Navigate between different settings sections: Profile, Security,
					Subscription, Usage, and Privacy.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						⚙️ <strong>Organization:</strong> All your account settings are
						organized in one place.
					</p>
				</div>
			</div>
		),
		position: "right",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".profile-settings",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Profile Management
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Update your personal information, profile picture, and account
					details.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						👤 <strong>Identity:</strong> Keep your profile information up to
						date.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".subscription-settings",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Subscription & Billing
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Manage your subscription plan, billing information, and upgrade
					options.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						💳 <strong>Billing:</strong> View invoices, update payment methods,
						and manage your plan.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Public API tour steps
export const publicApiTourSteps: StepType[] = [
	{
		selector: ".api-header",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>API Overview</h3>
				<p className='text-gray-600 leading-relaxed'>
					Manage your API tokens and access the public API documentation for
					integrating with external applications.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						🔑 <strong>Integration:</strong> Use API tokens to securely access
						your data from external applications.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".create-token-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Create API Token
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Generate new API tokens with specific permissions and expiration dates
					for secure external access.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						🔐 <strong>Security:</strong> Set specific scopes and expiration
						dates for each token.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".tokens-list",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Token Management
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					View and manage all your API tokens. You can revoke tokens, view usage
					statistics, and copy token values.
				</p>
				<div className='bg-orange-50 p-3 rounded-lg'>
					<p className='text-sm text-orange-700'>
						📊 <strong>Monitoring:</strong> Track token usage and last access
						times.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".api-documentation",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					API Documentation
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Access comprehensive API documentation with examples, endpoints, and
					integration guides.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						📚 <strong>Reference:</strong> Complete API reference with code
						examples and best practices.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Users management tour steps
export const usersTourSteps: StepType[] = [
	{
		selector: ".users-header",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>User Management</h3>
				<p className='text-gray-600 leading-relaxed'>
					Manage your team members, their roles, and permissions. Invite new
					users and control access to your data.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						👥 <strong>Team:</strong> Collaborate with team members while
						maintaining security.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".users-header-section",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Team Overview</h3>
				<p className='text-gray-600 leading-relaxed'>
					View statistics about your team including total members, pending
					invitations, and administrators.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						📊 <strong>Statistics:</strong> Monitor team growth and activity at
						a glance.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Conditional users tour steps (only shown when users exist)
export const usersTourStepsWithUsers: StepType[] = [
	...usersTourSteps,
	{
		selector: ".users-table",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Team Members</h3>
				<p className='text-gray-600 leading-relaxed'>
					View all team members, their roles, and quick actions for managing
					permissions and removing users.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						⚙️ <strong>Permissions:</strong> Click on permissions to manage user
						access to specific tables and columns.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Conditional users tour steps (only shown when invitations exist)
export const usersTourStepsWithInvitations: StepType[] = [
	...usersTourStepsWithUsers,
	{
		selector: ".invite-user-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Invite Users</h3>
				<p className='text-gray-600 leading-relaxed'>
					Send invitations to new team members with specific roles and
					permissions.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📧 <strong>Invitations:</strong> Users receive email invitations to
						join your team.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Add table modal tour steps
export const addTableModalTourSteps: StepType[] = [
	{
		selector: ".table-name-input",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Table Name</h3>
				<p className='text-gray-600 leading-relaxed'>
					Enter a descriptive name for your table. This will be used to identify
					the table in your database.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						📝 <strong>Naming:</strong> Use clear, descriptive names that
						reflect the data content.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".table-description-input",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Table Description
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Provide a brief description of what this table will contain. This
					helps team members understand the purpose.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						💡 <strong>Documentation:</strong> Good descriptions help with team
						collaboration and maintenance.
					</p>
				</div>
			</div>
		),
		position: "bottom",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
	{
		selector: ".create-table-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Create Table</h3>
				<p className='text-gray-600 leading-relaxed'>
					Click this button to create your table. You'll be redirected to the
					columns editor to define the table structure.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						🎯 <strong>Next Step:</strong> After creation, you'll define columns
						and start adding data.
					</p>
				</div>
			</div>
		),
		position: "top",
		styles: {
			popover: (base) => ({
				...base,
				borderRadius: "16px",
				boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
			}),
		},
	},
];

// Tour management utilities
export const tourUtils = {
	markTourSeen: (tourKey: string) => {
		if (typeof window !== "undefined") {
			localStorage.setItem(`tour-seen-${tourKey}`, "true");
		}
	},

	isTourSeen: (tourKey: string) => {
		if (typeof window !== "undefined") {
			return localStorage.getItem(`tour-seen-${tourKey}`) === "true";
		}
		return false;
	},

	resetAllTours: () => {
		if (typeof window !== "undefined") {
			const keys = Object.keys(localStorage);
			keys.forEach((key) => {
				if (key.startsWith("tour-seen-")) {
					localStorage.removeItem(key);
				}
			});
		}
	},

	getTourKey: (page: string) => {
		return `tour-seen-${page}`;
	},

	// Helper function to check if element exists
	elementExists: (selector: string | Element) => {
		if (typeof window !== "undefined") {
			if (typeof selector === "string") {
				return document.querySelector(selector) !== null;
			} else {
				return selector !== null;
			}
		}
		return false;
	},

	// Helper function to get conditional tour steps
	getConditionalTourSteps: (
		baseSteps: StepType[],
		conditionalSteps: StepType[],
	) => {
		const availableSteps = [...baseSteps];

		conditionalSteps.forEach((step) => {
			if (tourUtils.elementExists(step.selector)) {
				availableSteps.push(step);
			}
		});

		return availableSteps;
	},

	// Helper function to get database tour steps based on content
	getDatabaseTourSteps: (hasTables: boolean) => {
		return hasTables ? databaseTourStepsWithTables : databaseTourSteps;
	},

	// Helper function to get columns editor tour steps based on content
	getColumnsEditorTourSteps: (hasColumns: boolean) => {
		return hasColumns
			? columnsEditorTourStepsWithColumns
			: columnsEditorTourSteps;
	},

	// Helper function to get rows editor tour steps based on content
	getRowsEditorTourSteps: (hasRows: boolean) => {
		return hasRows ? rowsEditorTourStepsWithRows : rowsEditorTourSteps;
	},

	// Helper function to get dashboard tour steps based on content
	getDashboardTourSteps: (hasCharts: boolean) => {
		return hasCharts ? dashboardTourStepsWithCharts : dashboardTourSteps;
	},

	// Helper function to get users tour steps based on content
	getUsersTourSteps: (hasUsers: boolean, hasInvitations: boolean) => {
		if (hasInvitations) {
			return usersTourStepsWithInvitations;
		} else if (hasUsers) {
			return usersTourStepsWithUsers;
		} else {
			return usersTourSteps;
		}
	},
};
