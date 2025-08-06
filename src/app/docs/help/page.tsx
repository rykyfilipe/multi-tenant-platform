/** @format */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Search,
	Database,
	Table,
	Users,
	Settings,
	Code,
	Shield,
	Globe,
	Plus,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	UserPlus,
	Key,
	Download,
	Upload,
	Filter,
	SortAsc,
	SortDesc,
} from "lucide-react";

export default function HelpCenterPage() {
	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='text-center space-y-4'>
				<h1 className='text-4xl font-bold text-foreground'>Help Center</h1>
				<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
					Everything you need to know about using YDV's multi-tenant database
					platform
				</p>
			</div>

			{/* Search */}
			<div className='max-w-2xl mx-auto'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
					<Input
						placeholder='Search help articles...'
						className='pl-10 h-12 text-lg'
					/>
				</div>
			</div>

			{/* Main Content */}
			<Tabs defaultValue='getting-started' className='space-y-6'>
				<TabsList className='grid w-full grid-cols-2 lg:grid-cols-6'>
					<TabsTrigger value='getting-started'>Getting Started</TabsTrigger>
					<TabsTrigger value='databases'>Databases</TabsTrigger>
					<TabsTrigger value='tables'>Tables</TabsTrigger>
					<TabsTrigger value='users'>Users & Permissions</TabsTrigger>
					<TabsTrigger value='api'>API & Integration</TabsTrigger>
					<TabsTrigger value='advanced'>Advanced</TabsTrigger>
				</TabsList>

				{/* Getting Started */}
				<TabsContent value='getting-started' className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Database className='w-5 h-5 text-blue-500' />
									Creating Your First Database
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-3'>
									<div className='flex items-start gap-3'>
										<div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5'>
											1
										</div>
										<div>
											<h4 className='font-semibold'>Navigate to Dashboard</h4>
											<p className='text-sm text-muted-foreground'>
												From your home page, click on "Database" in the
												navigation menu
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5'>
											2
										</div>
										<div>
											<h4 className='font-semibold'>Create Database</h4>
											<p className='text-sm text-muted-foreground'>
												Click the "Create Database" button and provide a name
												and description
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5'>
											3
										</div>
										<div>
											<h4 className='font-semibold'>Add Tables</h4>
											<p className='text-sm text-muted-foreground'>
												Once created, you can start adding tables to organize
												your data
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Users className='w-5 h-5 text-green-500' />
									Inviting Team Members
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-3'>
									<div className='flex items-start gap-3'>
										<div className='w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5'>
											1
										</div>
										<div>
											<h4 className='font-semibold'>Access Users Section</h4>
											<p className='text-sm text-muted-foreground'>
												Go to "Users" in the navigation menu
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<div className='w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5'>
											2
										</div>
										<div>
											<h4 className='font-semibold'>Add New User</h4>
											<p className='text-sm text-muted-foreground'>
												Click "Add User" and enter their email address
											</p>
										</div>
									</div>
									<div className='flex items-start gap-3'>
										<div className='w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5'>
											3
										</div>
										<div>
											<h4 className='font-semibold'>Set Permissions</h4>
											<p className='text-sm text-muted-foreground'>
												Configure what tables and actions they can access
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Databases */}
				<TabsContent value='databases' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Database className='w-5 h-5' />
								Database Management
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Creating a Database</h3>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<Plus className='w-4 h-4 text-green-500' />
											<span className='text-sm'>
												Click "Create Database" button
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Edit className='w-4 h-4 text-blue-500' />
											<span className='text-sm'>
												Enter database name and description
											</span>
										</div>

										<div className='flex items-center gap-2'>
											<Settings className='w-4 h-4 text-orange-500' />
											<span className='text-sm'>
												Configure initial settings
											</span>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Database Operations</h3>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<Eye className='w-4 h-4 text-blue-500' />
											<span className='text-sm'>
												View database details and statistics
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Edit className='w-4 h-4 text-green-500' />
											<span className='text-sm'>
												Edit database name and description
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Download className='w-4 h-4 text-purple-500' />
											<span className='text-sm'>
												Export database schema and data
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Trash2 className='w-4 h-4 text-red-500' />
											<span className='text-sm'>
												Delete database (requires confirmation)
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg'>
								<h4 className='font-semibold text-blue-800 mb-2'>Pro Tip</h4>
								<p className='text-blue-700 text-sm'>
									Use descriptive database names and add detailed descriptions
									to help team members understand the purpose of each database.
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tables */}
				<TabsContent value='tables' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Table className='w-5 h-5' />
								Table Management
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Creating Tables</h3>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<Plus className='w-4 h-4 text-green-500' />
											<span className='text-sm'>
												Click "Add Table" in database view
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Edit className='w-4 h-4 text-blue-500' />
											<span className='text-sm'>
												Define table name and description
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Table className='w-4 h-4 text-purple-500' />
											<span className='text-sm'>
												Add columns with appropriate data types
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Globe className='w-4 h-4 text-orange-500' />
											<span className='text-sm'>
												Set table visibility (public/private)
											</span>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Column Types</h3>
									<div className='space-y-2'>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Text</span>
											<Badge variant='outline'>String data</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Number</span>
											<Badge variant='outline'>Numeric values</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Date</span>
											<Badge variant='outline'>Date/time data</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Boolean</span>
											<Badge variant='outline'>True/false values</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Reference</span>
											<Badge variant='outline'>Links to other tables</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Custom Array</span>
											<Badge variant='outline'>Custom Options</Badge>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Table Operations</h3>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<Eye className='w-4 h-4 text-blue-500' />
											<span className='text-sm'>
												View table data and structure
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Edit className='w-4 h-4 text-green-500' />
											<span className='text-sm'>
												Edit table schema and data
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Filter className='w-4 h-4 text-purple-500' />
											<span className='text-sm'>Filter and sort data</span>
										</div>
										<div className='flex items-center gap-2'>
											<Upload className='w-4 h-4 text-orange-500' />
											<span className='text-sm'>Import data from CSV/JSON</span>
										</div>
									</div>
								</div>
							</div>

							<div className='bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg'>
								<h4 className='font-semibold text-orange-800 mb-2'>
									Important Note
								</h4>
								<p className='text-orange-700 text-sm'>
									Only public tables can be accessed via the API. To make a
									table public, click the globe icon on the table card and
									toggle the visibility setting.
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Users & Permissions */}
				<TabsContent value='users' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Users className='w-5 h-5' />
								User Management & Permissions
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Adding Users</h3>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<UserPlus className='w-4 h-4 text-green-500' />
											<span className='text-sm'>Click "Add User" button</span>
										</div>
										<div className='flex items-center gap-2'>
											<Edit className='w-4 h-4 text-blue-500' />
											<span className='text-sm'>Enter user email address</span>
										</div>
										<div className='flex items-center gap-2'>
											<Shield className='w-4 h-4 text-purple-500' />
											<span className='text-sm'>
												Set initial permission level
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Users className='w-4 h-4 text-orange-500' />
											<span className='text-sm'>
												User receives invitation email
											</span>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Permission Levels</h3>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Admin</span>
											<Badge variant='destructive'>Full access</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Editor</span>
											<Badge variant='default'>Read & Write</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Viewer</span>
											<Badge variant='secondary'>Read only</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm'>Custom</span>
											<Badge variant='outline'>Granular control</Badge>
										</div>
									</div>
								</div>
							</div>

							<div className='space-y-4'>
								<h3 className='text-lg font-semibold'>Granular Permissions</h3>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									<div className='space-y-2'>
										<h4 className='font-medium'>Table Permissions</h4>
										<div className='space-y-1 text-sm text-muted-foreground'>
											<div>• View table data</div>
											<div>• Add new rows</div>
											<div>• Edit existing rows</div>
											<div>• Delete rows</div>
										</div>
									</div>
									<div className='space-y-2'>
										<h4 className='font-medium'>Column Permissions</h4>
										<div className='space-y-1 text-sm text-muted-foreground'>
											<div>• View column data</div>
											<div>• Edit column values</div>
											<div>• Hide sensitive columns</div>
										</div>
									</div>
									<div className='space-y-2'>
										<h4 className='font-medium'>System Permissions</h4>
										<div className='space-y-1 text-sm text-muted-foreground'>
											<div>• Manage users</div>
											<div>• Create databases</div>
											<div>• Access API tokens</div>
											<div>• View system settings</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* API & Integration */}
				<TabsContent value='api' className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Code className='w-5 h-5' />
								API Configuration
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Creating API Tokens</h3>
									<div className='space-y-3'>
										<div className='flex items-center gap-2'>
											<Key className='w-4 h-4 text-green-500' />
											<span className='text-sm'>
												Go to "Public API" section
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Plus className='w-4 h-4 text-blue-500' />
											<span className='text-sm'>Click "Create Token"</span>
										</div>
										<div className='flex items-center gap-2'>
											<Edit className='w-4 h-4 text-purple-500' />
											<span className='text-sm'>
												Set token name and permissions
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<Shield className='w-4 h-4 text-orange-500' />
											<span className='text-sm'>
												Copy and secure your token
											</span>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>API Endpoints</h3>
									<div className='space-y-3'>
										<div className='flex items-center justify-between'>
											<span className='text-sm font-mono'>
												GET /api/public/tables
											</span>
											<Badge variant='outline'>List tables</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm font-mono'>
												GET /api/public/tables/:id
											</span>
											<Badge variant='outline'>Get table data</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm font-mono'>
												POST /api/public/tables/:id/rows
											</span>
											<Badge variant='outline'>Add row</Badge>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-sm font-mono'>
												PATCH /api/public/tables/:id/rows/:rowId
											</span>
											<Badge variant='outline'>Update row</Badge>
										</div>
									</div>
								</div>
							</div>

							<div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg'>
								<h4 className='font-semibold text-blue-800 mb-2'>
									API Best Practices
								</h4>
								<div className='text-blue-700 text-sm space-y-2'>
									<p>
										• Always include your API token in the Authorization header
									</p>
									<p>• Use appropriate HTTP methods for different operations</p>
									<p>• Handle rate limits and error responses gracefully</p>
									<p>• Keep your API tokens secure and rotate them regularly</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Advanced */}
				<TabsContent value='advanced' className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Filter className='w-5 h-5' />
									Advanced Features
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-3'>
									<div className='flex items-center gap-2'>
										<Filter className='w-4 h-4 text-blue-500' />
										<span className='text-sm'>
											Advanced filtering and search
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<SortAsc className='w-4 h-4 text-green-500' />
										<span className='text-sm'>Custom sorting and ordering</span>
									</div>
									<div className='flex items-center gap-2'>
										<Download className='w-4 h-4 text-purple-500' />
										<span className='text-sm'>
											Data export in multiple formats
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Upload className='w-4 h-4 text-orange-500' />
										<span className='text-sm'>Bulk data import</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Shield className='w-5 h-5' />
									Security & Compliance
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-3'>
									<div className='flex items-center gap-2'>
										<EyeOff className='w-4 h-4 text-red-500' />
										<span className='text-sm'>Column-level data masking</span>
									</div>
									<div className='flex items-center gap-2'>
										<Shield className='w-4 h-4 text-green-500' />
										<span className='text-sm'>Audit logging and tracking</span>
									</div>
									<div className='flex items-center gap-2'>
										<Key className='w-4 h-4 text-blue-500' />
										<span className='text-sm'>
											Token expiration and rotation
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Users className='w-4 h-4 text-purple-500' />
										<span className='text-sm'>Role-based access control</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			{/* FAQ Section */}
			<Card>
				<CardHeader>
					<CardTitle>Frequently Asked Questions</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='space-y-4'>
						<div className='border-b border-border pb-4'>
							<h4 className='font-semibold mb-2'>
								How do I make a table public for API access?
							</h4>
							<p className='text-sm text-muted-foreground'>
								Navigate to your database, find the table you want to make
								public, and click the globe icon on the table card. Toggle the
								visibility setting to "Public".
							</p>
						</div>
						<div className='border-b border-border pb-4'>
							<h4 className='font-semibold mb-2'>
								Can I import data from external sources?
							</h4>
							<p className='text-sm text-muted-foreground'>
								Yes, you can import data from CSV and JSON files. Go to the
								table view and use the import functionality to upload your data
								files.
							</p>
						</div>
						<div className='border-b border-border pb-4'>
							<h4 className='font-semibold mb-2'>
								How do I set up user permissions?
							</h4>
							<p className='text-sm text-muted-foreground'>
								Go to the Users section, select a user, and click on
								"Permissions". You can then configure granular permissions for
								tables and columns.
							</p>
						</div>
						<div className='border-b border-border pb-4'>
							<h4 className='font-semibold mb-2'>
								What happens if I exceed my plan limits?
							</h4>
							<p className='text-sm text-muted-foreground'>
								You'll receive notifications when approaching limits. Exceeding
								limits may result in temporary restrictions until you upgrade
								your plan.
							</p>
						</div>
						<div>
							<h4 className='font-semibold mb-2'>How secure is my data?</h4>
							<p className='text-sm text-muted-foreground'>
								Your data is encrypted at rest and in transit. We use
								industry-standard security practices and regular security audits
								to protect your information.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Support Channels */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle className='text-center'>Email Support</CardTitle>
					</CardHeader>
					<CardContent className='text-center'>
						<p className='text-sm text-muted-foreground mb-4'>
							Get help from our support team
						</p>
						<Button variant='outline' className='w-full'>
							Contact Support
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='text-center'>Documentation</CardTitle>
					</CardHeader>
					<CardContent className='text-center'>
						<p className='text-sm text-muted-foreground mb-4'>
							Browse our comprehensive guides
						</p>
						<Button variant='outline' className='w-full'>
							View Docs
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className='text-center'>System Status</CardTitle>
					</CardHeader>
					<CardContent className='text-center'>
						<p className='text-sm text-muted-foreground mb-4'>
							Check platform status and uptime
						</p>
						<Button variant='outline' className='w-full'>
							Check Status
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
