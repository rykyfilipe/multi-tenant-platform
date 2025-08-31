/** @format */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Activity, Clock } from "lucide-react";

interface UserActivityChartProps {
	data: {
		recentUsers: Array<{
			id: number;
			name: string;
			email: string;
			role: string;
			lastActive: string;
			status: "online" | "offline" | "away";
		}>;
		activeUsers: number;
		totalUsers: number;
	};
}

const UserActivityChart: React.FC<UserActivityChartProps> = ({ data }) => {
	const { t } = useLanguage();

	// Memoize status-related functions and data
	const statusConfig = useMemo(() => {
		const getStatusColor = (status: string) => {
			switch (status) {
				case "online":
					return "bg-green-500/20 text-green-400 border-green-500/30";
				case "away":
					return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
				case "offline":
					return "bg-gray-500/20 text-gray-400 border-gray-500/30";
				default:
					return "bg-gray-500/20 text-gray-400 border-gray-500/30";
			}
		};

		const getStatusText = (status: string) => {
			switch (status) {
				case "online":
					return t("dashboard.userActivity.status.online");
				case "away":
					return t("dashboard.userActivity.status.away");
				case "offline":
					return t("dashboard.userActivity.status.offline");
				default:
					return t("dashboard.userActivity.status.unknown");
			}
		};

		return { getStatusColor, getStatusText };
	}, [t]);

	// Memoize user initials to avoid recalculation
	const userInitials = useMemo(() => {
		return data.recentUsers.map((user) => ({
			...user,
			initials: user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2),
		}));
	}, [data.recentUsers]);

	// Memoize recent activity users for timeline
	const timelineUsers = useMemo(() => {
		return userInitials.slice(0, 3);
	}, [userInitials]);

	return (
		<Card className='dashboard-card'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Users className='h-5 w-5' />
					{t("dashboard.userActivity.userActivity")}
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{/* Activity Overview */}
				<div className='grid grid-cols-2 gap-4'>
					<div className='text-center p-4 rounded-lg bg-card/50 border border-border/20'>
						<div className='text-2xl font-bold text-green-500'>
							{data.activeUsers}
						</div>
						<p className='text-sm text-muted-foreground'>
							{t("dashboard.userActivity.activeUsers")}
						</p>
					</div>
					<div className='text-center p-4 rounded-lg bg-card/50 border border-border/20'>
						<div className='text-2xl font-bold'>{data.totalUsers}</div>
						<p className='text-sm text-muted-foreground'>
							{t("dashboard.userActivity.totalUsers")}
						</p>
					</div>
				</div>

				{/* Recent Users */}
				<div className='space-y-4'>
					<h4 className='text-sm font-medium'>
						{t("dashboard.userActivity.recentUsers")}
					</h4>
					<div className='space-y-3'>
						{userInitials.map((user) => (
							<div
								key={user.id}
								className='flex sm:flex-row flex-col items-center justify-between p-3 rounded-lg bg-card/50 border border-border/20'>
								<div className='flex items-center gap-3'>
									<Avatar className='h-8 w-8'>
										<AvatarImage src='' alt={user.name} />
										<AvatarFallback className='text-xs'>
											{user.initials}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className='text-sm font-medium'>{user.name}</p>
										<p className='text-xs text-muted-foreground'>
											{user.email}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-2'>
									<Badge variant='outline' className='text-xs'>
										{user.role}
									</Badge>
									<Badge className={statusConfig.getStatusColor(user.status)}>
										{statusConfig.getStatusText(user.status)}
									</Badge>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Activity Timeline */}
				<div className='space-y-4'>
					<h4 className='text-sm font-medium flex items-center gap-2'>
						<Activity className='h-4 w-4' />
						{t("dashboard.userActivity.recentActivity")}
					</h4>
					<div className='space-y-3'>
						{timelineUsers.map((user, index) => (
							<div
								key={index}
								className='flex items-center gap-3 p-2 rounded-lg bg-card/30'>
								<Clock className='h-3 w-3 text-muted-foreground' />
								<span className='text-xs text-muted-foreground'>
									{user.name} {t("dashboard.userActivity.wasLastActive")}{" "}
									{user.lastActive}
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default React.memo(UserActivityChart);
