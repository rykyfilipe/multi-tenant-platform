/** @format */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { TenantLoadingState } from "@/components/ui/loading-states";
import { useLanguage } from "@/contexts/LanguageContext";

function Page() {
	const { user, loading, tenant } = useApp();
	const router = useRouter();
	const { t } = useLanguage();

	useEffect(() => {
		// Redirect to the new tenant management page
		if (!loading && tenant) {
			router.replace("/home/tenant-management");
		}
	}, [loading, tenant, router]);

	if (loading) {
		return <TenantLoadingState />;
	}

	if (!tenant) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Card className="w-full max-w-md mx-4">
					<CardHeader className="text-center">
						<div className="p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-6 shadow-lg">
							<Building2 className="w-12 h-12 text-primary" />
						</div>
						<CardTitle className="text-2xl font-bold">
							{t("tenant.management.noOrganization.title")}
						</CardTitle>
						<p className="text-muted-foreground">
							{t("tenant.management.noOrganization.subtitle")}
						</p>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-sm text-muted-foreground">
							{t("tenant.management.noOrganization.description")}
						</p>
						<Button
							onClick={() => router.push("/home/tenant-management")}
							className="w-full">
							{t("tenant.management.launchOrganization")}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show loading while redirecting
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<Card className="w-full max-w-md mx-4">
				<CardHeader className="text-center">
					<div className="p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full w-fit mx-auto mb-6 shadow-lg">
						<Building2 className="w-12 h-12 text-primary" />
					</div>
					<CardTitle className="text-2xl font-bold">
						Redirecting...
					</CardTitle>
					<p className="text-muted-foreground">
						Taking you to the new tenant management interface
					</p>
				</CardHeader>
				<CardContent className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
				</CardContent>
			</Card>
		</div>
	);
}

export default Page;