/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Area,
	AreaChart,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	Database,
	Users,
	Activity,
	TrendingUp,
	Plus,
	Settings,
	Bell,
	Search,
	BarChart3,
	Zap,
	Shield,
	Clock,
	ArrowUpRight,
	ArrowDownRight,
	AlertTriangle,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useApp } from "@/contexts/AppContext";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const weeklyData = [
	{ day: "Mon", tokens: 12, users: 45, tables: 8 },
	{ day: "Tue", tokens: 19, users: 52, tables: 12 },
	{ day: "Wed", tokens: 8, users: 38, tables: 6 },
	{ day: "Thu", tokens: 25, users: 67, tables: 15 },
	{ day: "Fri", tokens: 22, users: 61, tables: 13 },
	{ day: "Sat", tokens: 15, users: 43, tables: 9 },
	{ day: "Sun", tokens: 9, users: 32, tables: 5 },
];

const monthlyGrowth = [
	{ month: "Jan", value: 400 },
	{ month: "Feb", value: 600 },
	{ month: "Mar", value: 800 },
	{ month: "Apr", value: 1200 },
	{ month: "May", value: 1600 },
	{ month: "Jun", value: 2100 },
];

const pieData = [
	{ name: "Active Users", value: 324, color: "hsl(var(--chart-1))" },
	{ name: "Inactive Users", value: 156, color: "hsl(var(--chart-2))" },
	{ name: "New Users", value: 89, color: "hsl(var(--chart-3))" },
];

const recentActivity = [
	{
		id: 1,
		user: "John Doe",
		action: "Created new table",
		table: "Customers",
		time: "2 minutes ago",
		avatar: "JD",
	},
	{
		id: 2,
		user: "Jane Smith",
		action: "Updated permissions",
		table: "Products",
		time: "15 minutes ago",
		avatar: "JS",
	},
	{
		id: 3,
		user: "Mike Johnson",
		action: "Generated API token",
		table: "Orders",
		time: "1 hour ago",
		avatar: "MJ",
	},
];

function Page() {
	const { user } = useApp();
	const [currentTime, setCurrentTime] = useState(new Date());
	const [animatedStats, setAnimatedStats] = useState({
		tokens: 0,
		users: 0,
		tables: 0,
		growth: 0,
	});

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedStats({ tokens: 1847, users: 324, tables: 67, growth: 23 });
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	const StatCard = ({
		title,
		value,
		icon: Icon,
		change,
		changeType,
		description,
	}: any) => (
		<Card className='dashboard-card'>
			<CardContent className='p-6'>
				<div className='flex items-center justify-between mb-4'>
					<div className='p-2 bg-primary/10 rounded-lg'>
						<Icon className='w-5 h-5 text-primary' />
					</div>
					{change && (
						<Badge
							variant={changeType === "increase" ? "default" : "secondary"}
							className='text-xs'>
							{changeType === "increase" ? (
								<ArrowUpRight className='w-3 h-3 mr-1' />
							) : (
								<ArrowDownRight className='w-3 h-3 mr-1' />
							)}
							{change}%
						</Badge>
					)}
				</div>
				<div className='space-y-2'>
					<p className='dashboard-stat'>{value}</p>
					<p className='dashboard-label'>{title}</p>
					{description && (
						<p className='text-xs text-muted-foreground'>{description}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className='h-full bg-background'>
			{/* Development Notice */}
			<div className='bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800/50 px-4 py-2'>
				<div className='max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-800 dark:text-amber-200'>
					<AlertTriangle className='w-4 h-4 flex-shrink-0' />
					<div className='text-center'>
						<p className='text-xs font-medium'>🚧 Development Mode</p>
						<p className='text-xs text-amber-700 dark:text-amber-300'>
							Some features may be incomplete or not fully functional.
						</p>
					</div>
				</div>
			</div>

			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex items-center justify-between px-6 py-4'>
					<div className='flex items-center space-x-4'>
						<SidebarTrigger className='md:hidden' />
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								Dashboard
							</h1>
							<p className='text-sm text-muted-foreground'>
								{currentTime.toLocaleDateString("en-US", {
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						<div className='relative'>
							<Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground' />
							<input
								type='text'
								placeholder='Search...'
								className='pl-10 pr-4 py-2 border border-border/20 rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
							/>
						</div>
						<Button variant='ghost' size='sm' className='relative'>
							<Bell className='w-4 h-4' />
							<span className='absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full'></span>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-6 space-y-6'>
				{/* Stats Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					<StatCard
						title='Total Users'
						value={animatedStats.users.toLocaleString()}
						icon={Users}
						change={12}
						changeType='increase'
						description='Active team members'
					/>
					<StatCard
						title='API Tokens'
						value={animatedStats.tokens.toLocaleString()}
						icon={Zap}
						change={8}
						changeType='increase'
						description='Active tokens'
					/>
					<StatCard
						title='Data Tables'
						value={animatedStats.tables}
						icon={Database}
						change={-3}
						changeType='decrease'
						description='Total tables'
					/>
					<StatCard
						title='Growth Rate'
						value={`${animatedStats.growth}%`}
						icon={TrendingUp}
						change={5}
						changeType='increase'
						description='Monthly growth'
					/>
				</div>

				{/* Charts Section */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Weekly Activity Chart */}
					<Card className='chart-container'>
						<CardHeader className='pb-4'>
							<CardTitle className='text-lg font-semibold'>
								Weekly Activity
							</CardTitle>
							<CardDescription className='text-sm'>
								User and token activity over the past week
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width='100%' height={300}>
								<BarChart data={weeklyData}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='hsl(var(--border))'
										opacity={0.4}
									/>
									<XAxis
										dataKey='day'
										className='text-xs'
										tick={{ fill: "hsl(var(--muted-foreground))" }}
									/>
									<YAxis
										className='text-xs'
										tick={{ fill: "hsl(var(--muted-foreground))" }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "12px",
											boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
											color: "hsl(var(--foreground))",
										}}
									/>
									<Bar
										dataKey='users'
										fill='hsl(var(--chart-1))'
										radius={[4, 4, 0, 0]}
									/>
									<Bar
										dataKey='tokens'
										fill='hsl(var(--chart-2))'
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Growth Trend Chart */}
					<Card className='chart-container'>
						<CardHeader className='pb-4'>
							<CardTitle className='text-lg font-semibold'>
								Growth Trend
							</CardTitle>
							<CardDescription className='text-sm'>
								Monthly platform growth
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width='100%' height={300}>
								<AreaChart data={monthlyGrowth}>
									<CartesianGrid
										strokeDasharray='3 3'
										stroke='hsl(var(--border))'
										opacity={0.4}
									/>
									<XAxis
										dataKey='month'
										className='text-xs'
										tick={{ fill: "hsl(var(--muted-foreground))" }}
									/>
									<YAxis
										className='text-xs'
										tick={{ fill: "hsl(var(--muted-foreground))" }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "12px",
											boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
											color: "hsl(var(--foreground))",
										}}
									/>
									<Area
										type='monotone'
										dataKey='value'
										stroke='hsl(var(--chart-3))'
										fill='hsl(var(--chart-3))'
										fillOpacity={0.2}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>

				{/* User Distribution and Recent Activity */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* User Distribution */}
					<Card className='chart-container lg:col-span-1'>
						<CardHeader className='pb-4'>
							<CardTitle className='text-lg font-semibold'>
								User Distribution
							</CardTitle>
							<CardDescription className='text-sm'>
								Current user status breakdown
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width='100%' height={200}>
								<PieChart>
									<Pie
										data={pieData}
										cx='50%'
										cy='50%'
										innerRadius={40}
										outerRadius={80}
										paddingAngle={5}
										dataKey='value'>
										{pieData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "12px",
											boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
											color: "hsl(var(--foreground))",
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className='chart-legend'>
								{pieData.map((item, index) => (
									<div key={index} className='chart-legend-item'>
										<div
											className='chart-legend-color'
											style={{ backgroundColor: item.color }}
										/>
										<span>{item.name}</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Recent Activity */}
					<Card className='border border-border/20 bg-card/50 backdrop-blur-sm lg:col-span-2'>
						<CardHeader className='pb-4'>
							<CardTitle className='text-lg font-semibold'>
								Recent Activity
							</CardTitle>
							<CardDescription className='text-sm'>
								Latest actions from your team
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{recentActivity.map((activity) => (
									<div
										key={activity.id}
										className='flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/20'>
										<Avatar className='w-10 h-10'>
											<AvatarFallback className='bg-primary/10 text-primary text-sm font-medium'>
												{activity.avatar}
											</AvatarFallback>
										</Avatar>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-semibold text-foreground'>
												{activity.user}
											</p>
											<p className='text-sm text-muted-foreground'>
												{activity.action} in{" "}
												<span className='font-medium text-foreground'>
													{activity.table}
												</span>
											</p>
										</div>
										<div className='flex items-center space-x-2 text-xs text-muted-foreground'>
											<Clock className='w-4 h-4' />
											<span>{activity.time}</span>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default Page;
