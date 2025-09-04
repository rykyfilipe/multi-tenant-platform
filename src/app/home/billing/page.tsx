/** @format */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import BillingDashboard from "@/components/billing/BillingDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CreditCard, Receipt, Settings } from "lucide-react";

export default function BillingPage() {
	const { data: session } = useSession();
	const { user, loading } = useApp();
	const { t } = useLanguage();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	// Show loading state if session is not available or user data is not available
	if (loading || !session?.user || !user) {
		return (
			<div className="h-full bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading billing information...</p>
				</div>
			</div>
		);
	}

	// Check if user has access to billing
	if (!user.tenantId) {
		return (
			<div className="h-full bg-background flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
							<AlertCircle className="w-8 h-8 text-red-600" />
						</div>
						<CardTitle>Access Denied</CardTitle>
						<CardDescription>
							You don't have access to billing information. Please contact your administrator.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button 
							onClick={() => window.history.back()} 
							className="w-full"
						>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Check if billing module is enabled
	if (!user.tenant?.enabledModules?.includes("billing")) {
		return (
			<div className="h-full bg-background flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
							<CreditCard className="w-8 h-8 text-yellow-600" />
						</div>
						<CardTitle>Billing Module Disabled</CardTitle>
						<CardDescription>
							The billing module is not enabled for your organization. Contact your administrator to enable it.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								This feature requires the billing module to be enabled in your organization settings.
							</AlertDescription>
						</Alert>
						<Button 
							onClick={() => window.history.back()} 
							className="w-full mt-4"
						>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<BillingDashboard tenantId={user.tenantId.toString()} />
		</div>
	);
}
