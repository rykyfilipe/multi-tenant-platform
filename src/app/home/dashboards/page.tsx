'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { isWidgetsV2Enabled } from '@/lib/featureFlag';
import { WidgetCanvas } from '@/widgets/ui/WidgetCanvas';
import { Plus, LayoutDashboard } from 'lucide-react';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', mode: 'PRIVATE' as 'PRIVATE' | 'PUBLIC' });

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

  const handleCreateDashboard = async () => {
    if (!createForm.name.trim()) {
      toast.toast({
        title: 'Error',
        description: 'Dashboard name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) throw new Error('Failed to create dashboard');

      const newDashboard = await res.json();
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboardId(newDashboard.id);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '', mode: 'PRIVATE' });
      
      toast.toast({
        title: 'Success',
        description: 'Dashboard created successfully.',
      });
    } catch {
      toast.toast({
        title: 'Error',
        description: 'Failed to create dashboard.',
        variant: 'destructive',
      });
    }
  };

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

  if (isLoading || actorId === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  // Empty state when no dashboards exist
  if (dashboards.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">No Dashboards Found</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create your first dashboard to start building widget layouts.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter dashboard name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter dashboard description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mode">Mode</Label>
                    <Select value={createForm.mode} onValueChange={(value) => setCreateForm(prev => ({ ...prev, mode: value as 'PRIVATE' | 'PUBLIC' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDashboard}>
                      Create Dashboard
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                {dashboardName ? `${dashboardName} Widgets` : 'Dashboard Widgets'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Build, preview, and save widget layouts with conflict-aware pending changes.
              </p>
            </div>
            {dashboards.length > 1 && (
              <Select value={selectedDashboardId?.toString()} onValueChange={(value) => setSelectedDashboardId(Number(value))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter dashboard name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter dashboard description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mode">Mode</Label>
                    <Select value={createForm.mode} onValueChange={(value) => setCreateForm(prev => ({ ...prev, mode: value as 'PRIVATE' | 'PUBLIC' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDashboard}>
                      Create Dashboard
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Badge variant="outline">WIDGETS_V2 Enabled</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDashboardId && (
            <WidgetCanvas tenantId={tenant?.id ?? 0} dashboardId={selectedDashboardId} actorId={actorId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
