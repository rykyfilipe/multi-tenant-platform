/** @format */

"use client";

import { use, useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { DashboardPermissionManager } from "@/components/permissions/DashboardPermissionManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPermissionsPage({
  params,
}: {
  params: Promise<{ dashboardId: string }>;
}) {
  const resolvedParams = use(params);
  const { tenant, token } = useApp();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant || !token) return;

    const fetchDashboard = async () => {
      try {
        const response = await fetch(
          `/api/tenants/${tenant.id}/dashboards/${resolvedParams.dashboardId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch dashboard");

        const data = await response.json();
        setDashboard(data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [tenant, token, resolvedParams.dashboardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard permissions...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground mb-4">Dashboard not found</p>
          <Button asChild>
            <Link href="/home/dashboards">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboards
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Dashboard Permissions
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage access and permissions for "{dashboard.name}"
              </p>
            </div>
          </div>
        </div>

        {/* Permissions Manager */}
        <DashboardPermissionManager
          dashboardId={Number(resolvedParams.dashboardId)}
          dashboardName={dashboard.name}
        />
      </div>
    </div>
  );
}

