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

// Unified Table Editor tour steps
export const unifiedTableEditorTourSteps: StepType[] = [
	{
		selector: ".unified-table-header",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Unified Table Editor
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					This is your Excel-like table editor where you can manage both columns and rows in one place. 
					The header shows table information and quick actions.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						💡 <strong>Tip:</strong> This unified interface combines column management and row editing for a seamless experience.
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
		selector: ".column-header",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Column Headers
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Each column header shows the column name, type, and properties. Click on a column header to edit its properties, 
					or use the + button to add a new column.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						✨ <strong>Feature:</strong> Hover over column headers to see edit options and properties.
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
		selector: ".data-grid",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Data Grid
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					This is where your data lives. Click on any cell to edit it directly, just like in Excel. 
					Use the row numbers to select rows, and the action buttons to manage them.
				</p>
				<div className='bg-purple-50 p-3 rounded-lg'>
					<p className='text-sm text-purple-700'>
						🔍 <strong>Quick Actions:</strong> Select multiple rows, edit cells inline, and manage your data efficiently.
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
		selector: ".unified-editor-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Unified Table Editor</h3>
				<p className='text-gray-600 leading-relaxed'>
					This button opens the unified table editor where you can manage both columns and rows in one Excel-like interface.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						📊 <strong>All-in-One:</strong> Edit columns, manage rows, and configure table properties in one place.
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
		selector: ".unified-editor-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Unified Table Editor</h3>
				<p className='text-gray-600 leading-relaxed'>
					This button opens the unified table editor where you can manage both columns and rows in one Excel-like interface.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📝 <strong>All-in-One:</strong> Edit columns, manage rows, and configure table properties in one place.
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
		selector: ".unified-editor-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>Unified Table Editor</h3>
				<p className='text-gray-600 leading-relaxed'>
					This button opens the unified table editor where you can manage both columns and rows in one Excel-like interface.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📊 <strong>All-in-One:</strong> Edit columns, manage rows, and configure table properties in one place.
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
		selector: ".unified-editor-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Unified Table Editor
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					This button opens the unified table editor where you can manage both columns and rows in one Excel-like interface.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						⚙️ <strong>All-in-One:</strong> Edit columns, manage rows, and configure table properties in one place.
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
					Manage your databases, tables, users, and data efficiently.
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

// Users management tour steps
export const usersTourSteps: StepType[] = [
	{
		selector: ".users-header",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>User Management</h3>
				<p className='text-gray-600 leading-relaxed'>
					Manage your team members, set permissions, and control access to your
					organization's data and features.
				</p>
				<div className='bg-blue-50 p-3 rounded-lg'>
					<p className='text-sm text-blue-700'>
						👥 <strong>Team:</strong> Invite new members and manage existing
						users.
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
		selector: ".invite-user-button",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					Invite New Users
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					Send invitations to new team members. They'll receive an email with
					instructions to join your organization.
				</p>
				<div className='bg-green-50 p-3 rounded-lg'>
					<p className='text-sm text-green-700'>
						📧 <strong>Invitations:</strong> Customize roles and permissions
						for each new user.
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
		selector: ".users-table",
		content: (
			<div className='space-y-3'>
				<h3 className='text-lg font-semibold text-gray-900'>
					User Management Table
				</h3>
				<p className='text-gray-600 leading-relaxed'>
					View all team members, their roles, status, and last activity. You can
					edit permissions, deactivate accounts, or remove users.
				</p>
				<div className='bg-orange-50 p-3 rounded-lg'>
					<p className='text-sm text-orange-700'>
						⚙️ <strong>Actions:</strong> Click on any user row to manage their
						permissions and account settings.
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

	// Helper function to get unified table editor tour steps
	getUnifiedTableEditorTourSteps: (showUnified: boolean) => {
		return showUnified ? unifiedTableEditorTourSteps : [];
	},
};
