'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { isWidgetsV2Enabled } from '@/lib/featureFlag';
import { WidgetCanvas } from '@/widgets/ui/WidgetCanvas';

interface DashboardSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export default function DashboardsPage() {
  const { tenant, user } = useApp();
  const toast = useToast();
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [actorId, setActorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id && actorId !== user.id) {
      setActorId(user.id);
    }
  }, [user?.id, actorId]);

  useEffect(() => {
    const loadDashboards = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/dashboards');
        if (!res.ok) throw new Error('Failed to load dashboards');
        const data = (await res.json()) as { dashboards?: DashboardSummary[]; pagination?: unknown };
        const dashboardList = data.dashboards ?? [];
        setDashboards(dashboardList);
        const defaultDashboard = dashboardList.find((d) => d.isDefault) ?? dashboardList[0];
        setSelectedDashboardId(defaultDashboard?.id ?? null);
      } catch {
        toast.toast({
          title: 'Error',
          description: 'Unable to load dashboards.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboards();
  }, [toast]);

  const dashboardName = useMemo(() => {
    if (!selectedDashboardId) return null;
    return dashboards.find((dash) => dash.id === selectedDashboardId)?.name ?? null;
  }, [dashboards, selectedDashboardId]);

  if (!isWidgetsV2Enabled()) {
    return (
      <div className="space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Legacy Dashboard Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Enable the <code>WIDGETS_V2</code> feature flag to access the new widget canvas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !selectedDashboardId || actorId === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {dashboardName ? `${dashboardName} Widgets` : 'Dashboard Widgets'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Build, preview, and save widget layouts with conflict-aware pending changes.
            </p>
          </div>
          <Badge variant="outline">WIDGETS_V2 Enabled</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <WidgetCanvas tenantId={tenant?.id ?? 0} dashboardId={selectedDashboardId} actorId={actorId} />
        </CardContent>
      </Card>
    </div>
  );
}
