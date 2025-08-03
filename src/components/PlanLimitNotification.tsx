/** @format */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	X,
	AlertTriangle,
	Upgrade,
	Database,
	Table,
	Users,
	Key,
	Globe,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface PlanLimitNotificationProps {
	limit: number;
	current: number;
	plan: string;
	onClose: () => void;
	onUpgrade: () => void;
}

const PLAN_ICONS = {
	databases: Database,
	tables: Table,
	users: Users,
	apiTokens: Key,
	publicTables: Globe,
};

const PLAN_LABELS = {
	databases: "Databases",
	tables: "Tables",
	users: "Users",
	apiTokens: "API Tokens",
	publicTables: "Public Tables",
};

export default function PlanLimitNotification({
	limit,
	current,
	plan,
	onClose,
	onUpgrade,
}: PlanLimitNotificationProps) {
	const { data: session } = useSession();
	const [isVisible, setIsVisible] = useState(true);

	const currentPlan = session?.subscription?.plan || "Starter";
	const Icon = PLAN_ICONS[plan as keyof typeof PLAN_ICONS] || AlertTriangle;
	const label = PLAN_LABELS[plan as keyof typeof PLAN_LABELS] || plan;

	useEffect(() => {
		// Auto-hide after 10 seconds
		const timer = setTimeout(() => {
			setIsVisible(false);
			onClose();
		}, 10000);

		return () => clearTimeout(timer);
	}, [onClose]);

	if (!isVisible) return null;

	return (
		<Card className='fixed top-4 right-4 w-96 z-50 shadow-lg border-red-200 bg-gradient-to-r from-red-50 to-orange-50'>
			<CardContent className='p-4'>
				<div className='flex items-start justify-between mb-3'>
					<div className='flex items-center gap-2'>
						<div className='p-2 bg-red-100 rounded-lg'>
							<Icon className='w-5 h-5 text-red-600' />
						</div>
						<div>
							<h3 className='font-semibold text-gray-900'>
								Plan Limit Reached
							</h3>
							<p className='text-sm text-gray-600'>
								You've reached your {currentPlan} plan limit
							</p>
						</div>
					</div>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => {
							setIsVisible(false);
							onClose();
						}}
						className='text-gray-400 hover:text-gray-600'>
						<X className='w-4 h-4' />
					</Button>
				</div>

				<div className='space-y-3'>
					<div className='flex items-center justify-between p-3 bg-white rounded-lg border'>
						<div className='flex items-center gap-2'>
							<Icon className='w-4 h-4 text-gray-600' />
							<span className='text-sm font-medium text-gray-900'>{label}</span>
						</div>
						<Badge variant='destructive' className='text-xs'>
							{current} / {limit}
						</Badge>
					</div>

					<div className='text-sm text-gray-600'>
						<p>
							Your {currentPlan} plan allows you to create up to {limit}{" "}
							{label.toLowerCase()}.
						</p>
						<p className='mt-1'>
							Upgrade to Pro or Enterprise for more resources.
						</p>
					</div>

					<div className='flex gap-2'>
						<Button
							onClick={onUpgrade}
							className='flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'>
							<Upgrade className='w-4 h-4 mr-2' />
							Upgrade Plan
						</Button>
						<Button
							variant='outline'
							onClick={() => {
								setIsVisible(false);
								onClose();
							}}
							className='flex-1'>
							Maybe Later
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
