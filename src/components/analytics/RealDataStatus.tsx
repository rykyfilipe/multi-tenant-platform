/** @format */

import React, { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	CheckCircle,
	AlertTriangle,
	XCircle,
	RefreshCw,
	Database,
	Activity,
	TrendingUp,
	Shield,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface VerificationResult {
	table: string;
	hasData: boolean;
	count: number;
	lastEntry?: string;
	status: "success" | "warning" | "error";
	message: string;
}

interface VerificationSummary {
	totalTables: number;
	successCount: number;
	warningCount: number;
	errorCount: number;
	overallStatus: "success" | "warning" | "error";
	verificationTime: number;
	verifiedAt: string;
}

interface RealDataStatusProps {
	className?: string;
}

export const RealDataStatus: React.FC<RealDataStatusProps> = ({
	className,
}) => {
	const { token, tenant } = useApp();
	const [verificationData, setVerificationData] = useState<{
		summary: VerificationSummary;
		results: VerificationResult[];
		recommendations: string[];
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const runVerification = async () => {
		if (!token || !tenant) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/analytics/verify-real`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				setVerificationData(data);
			} else {
				setError("Failed to verify real data");
			}
		} catch (err) {
			setError("Error verifying real data");
		} finally {
			setLoading(false);
		}
	};

	const populateRealData = async () => {
		if (!token || !tenant) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/tenants/${tenant.id}/analytics/populate-real`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				// Refresh verification after populating
				await runVerification();
			} else {
				setError("Failed to populate real data");
			}
		} catch (err) {
			setError("Error populating real data");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		runVerification();
	}, [token, tenant]);

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "success":
				return <CheckCircle className='h-4 w-4 text-green-500' />;
			case "warning":
				return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
			case "error":
				return <XCircle className='h-4 w-4 text-red-500' />;
			default:
				return <Activity className='h-4 w-4 text-gray-500' />;
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "success":
				return (
					<Badge variant='default' className='bg-green-100 text-green-800'>
						Real Data
					</Badge>
				);
			case "warning":
				return (
					<Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
						Partial
					</Badge>
				);
			case "error":
				return <Badge variant='destructive'>Mock Data</Badge>;
			default:
				return <Badge variant='outline'>Unknown</Badge>;
		}
	};

	if (!verificationData) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Database className='h-5 w-5' />
						Data Verification Status
					</CardTitle>
					<CardDescription>
						Verifying if analytics data is real or mock
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex items-center justify-center py-8'>
						<RefreshCw className='h-6 w-6 animate-spin text-muted-foreground' />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Database className='h-5 w-5' />
						Data Verification Status
					</div>
					{getStatusBadge(verificationData.summary.overallStatus)}
				</CardTitle>
				<CardDescription>
					Last verified:{" "}
					{new Date(verificationData.summary.verifiedAt).toLocaleString()}
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Summary */}
				<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
					<div className='text-center'>
						<div className='text-2xl font-bold text-green-600'>
							{verificationData.summary.successCount}
						</div>
						<div className='text-sm text-muted-foreground'>Real Tables</div>
					</div>
					<div className='text-center'>
						<div className='text-2xl font-bold text-yellow-600'>
							{verificationData.summary.warningCount}
						</div>
						<div className='text-sm text-muted-foreground'>Partial</div>
					</div>
					<div className='text-center'>
						<div className='text-2xl font-bold text-red-600'>
							{verificationData.summary.errorCount}
						</div>
						<div className='text-sm text-muted-foreground'>Errors</div>
					</div>
					<div className='text-center'>
						<div className='text-2xl font-bold text-blue-600'>
							{verificationData.summary.verificationTime}ms
						</div>
						<div className='text-sm text-muted-foreground'>Check Time</div>
					</div>
				</div>

				{/* Table Status */}
				<div className='space-y-2'>
					<h4 className='font-medium'>Table Status</h4>
					<div className='grid gap-2'>
						{verificationData.results.map((result) => (
							<div
								key={result.table}
								className='flex items-center justify-between p-2 rounded-lg border'>
								<div className='flex items-center gap-2'>
									{getStatusIcon(result.status)}
									<span className='font-medium'>{result.table}</span>
								</div>
								<div className='text-right'>
									<div className='text-sm font-medium'>
										{result.count} records
									</div>
									{result.lastEntry && (
										<div className='text-xs text-muted-foreground'>
											{new Date(result.lastEntry).toLocaleDateString()}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recommendations */}
				{verificationData.recommendations.length > 0 && (
					<div className='space-y-2'>
						<h4 className='font-medium'>Recommendations</h4>
						<div className='space-y-1'>
							{verificationData.recommendations.map((rec, index) => (
								<Alert key={index} className='text-sm'>
									<AlertDescription>{rec}</AlertDescription>
								</Alert>
							))}
						</div>
					</div>
				)}

				{/* Actions */}
				<div className='flex gap-2 pt-4'>
					<Button
						onClick={runVerification}
						disabled={loading}
						variant='outline'
						size='sm'>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					{verificationData.summary.warningCount > 0 && (
						<Button onClick={populateRealData} disabled={loading} size='sm'>
							<TrendingUp className='h-4 w-4 mr-2' />
							Populate Real Data
						</Button>
					)}
				</div>

				{error && (
					<Alert variant='destructive'>
						<XCircle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
};
