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
  const [createForm, setCreateForm] = useState({ name: '', description: '', isPublic: false });

  // Debug logging
  console.log('🔍 DashboardsPage Debug:', {
    tenant: tenant ? { id: tenant.id, name: tenant.name } : null,
    user: user ? { id: user.id, email: user.email } : null,
    actorId,
    isLoading,
    dashboardsCount: dashboards.length,
    selectedDashboardId,
    isWidgetsV2Enabled: isWidgetsV2Enabled()
  });

  useEffect(() => {
    console.log('👤 User effect triggered:', { userId: user?.id, currentActorId: actorId });
    if (user?.id && actorId !== user.id) {
      console.log('✅ Setting actorId to:', user.id);
      setActorId(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadDashboards = async () => {
      console.log('📊 Starting to load dashboards...');
      try {
        setIsLoading(true);
        console.log('🌐 Fetching from /api/dashboards');
        const res = await fetch('/api/dashboards');
        console.log('📡 Response status:', res.status, res.statusText);
        
        if (!res.ok) {
          console.error('❌ Failed to load dashboards:', res.status, res.statusText);
          throw new Error(`Failed to load dashboards: ${res.status} ${res.statusText}`);
        }
        
        const data = (await res.json()) as { dashboards?: DashboardSummary[]; pagination?: unknown };
        console.log('📋 Raw API response:', data);
        
        const dashboardList = data.dashboards ?? [];
        console.log('📊 Dashboard list:', dashboardList);
        
        setDashboards(dashboardList);
        
        const defaultDashboard = dashboardList.find((d) => d.isDefault) ?? dashboardList[0];
        console.log('🎯 Default dashboard:', defaultDashboard);
        
        setSelectedDashboardId(defaultDashboard?.id ?? null);
        console.log('✅ Selected dashboard ID set to:', defaultDashboard?.id ?? null);
        setIsLoading(false);
        
      } catch (error) {
        console.error('💥 Error loading dashboards:', error);
        toast.toast({
          title: 'Error',
          description: 'Unable to load dashboards.',
          variant: 'destructive',
        });
      } finally {
        console.log('🏁 Loading completed, setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadDashboards();
  }, []); // Empty dependency array - load dashboards only once on mount

  const dashboardName = useMemo(() => {
    console.log('🏷️ Computing dashboard name:', { selectedDashboardId, dashboardsCount: dashboards.length });
    if (!selectedDashboardId) {
      console.log('❌ No selected dashboard ID');
      return null;
    }
    const name = dashboards.find((dash) => dash.id === selectedDashboardId)?.name ?? null;
    console.log('📝 Dashboard name:', name);
    return name;
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
      console.log('🆕 Creating dashboard with data:', createForm);
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      console.log('📡 Create dashboard response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Failed to create dashboard:', errorData);
        throw new Error(`Failed to create dashboard: ${res.status} ${res.statusText}`);
      }

      const newDashboard = await res.json();
      console.log('✅ Dashboard created successfully:', newDashboard);
      
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboardId(newDashboard.id);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '', isPublic: false });
      
      toast.toast({
        title: 'Success',
        description: 'Dashboard created successfully.',
      });
    } catch (error) {
      console.error('💥 Error creating dashboard:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to create dashboard.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateDefaultDashboard = async () => {
    console.log('🚀 Creating default dashboard...');
    try {
      const defaultForm = {
        name: 'My Dashboard',
        description: 'Default dashboard',
        isPublic: false
      };

      console.log('🆕 Creating default dashboard with data:', defaultForm);
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultForm),
      });

      console.log('📡 Create default dashboard response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Failed to create default dashboard:', errorData);
        throw new Error(`Failed to create default dashboard: ${res.status} ${res.statusText}`);
      }

      const newDashboard = await res.json();
      console.log('✅ Default dashboard created successfully:', newDashboard);
      
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboardId(newDashboard.id);
      
      toast.toast({
        title: 'Success',
        description: 'Default dashboard created successfully.',
      });
    } catch (error) {
      console.error('💥 Error creating default dashboard:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to create default dashboard.',
        variant: 'destructive',
      });
    }
  };

  // Debug render conditions
  console.log('🎨 Render conditions:', {
    isWidgetsV2Enabled: isWidgetsV2Enabled(),
    isLoading,
    actorId,
    dashboardsLength: dashboards.length,
    selectedDashboardId
  });

  if (!isWidgetsV2Enabled()) {
    console.log('🚫 Widgets V2 not enabled - showing legacy message');
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
    console.log('⏳ Showing loading state:', { isLoading, actorId });
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
        <div className="ml-4 text-xs text-gray-500">
          Debug: isLoading={isLoading.toString()}, actorId={actorId?.toString() || 'null'}
        </div>
      </div>
    );
  }

  // Empty state when no dashboards exist
  if (dashboards.length === 0) {
    console.log('📭 No dashboards found - showing empty state');
    return (
      <div className="space-y-4 p-6">
        <Card className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
              <LayoutDashboard className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              No Dashboards Found
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              Create your first dashboard to start building widget layouts and analytics.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleCreateDefaultDashboard}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                variant="default"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Create Default Dashboard
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or create custom
                  </span>
                </div>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 border-0" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Custom Dashboard
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm border-0 shadow-2xl">
                  <div className="relative overflow-hidden">
                    {/* Premium Header */}
                    <DialogHeader className="relative pb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
                      <div className="relative flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-lg">
                          <LayoutDashboard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                            Create New Dashboard
                          </DialogTitle>
                          <p className="text-sm text-muted-foreground font-medium mt-1">
                            Design your custom analytics workspace
                          </p>
                        </div>
                      </div>
                    </DialogHeader>

                    {/* Premium Form */}
                    <div className="space-y-6 relative">
                      {/* Name Field */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          Dashboard Name
                        </Label>
                        <div className="relative">
                          <Input
                            id="name"
                            value={createForm.name}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter a descriptive name for your dashboard"
                            className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none rounded-md" />
                        </div>
                      </div>

                      {/* Description Field */}
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          Description
                        </Label>
                        <div className="relative">
                          <Textarea
                            id="description"
                            value={createForm.description}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what this dashboard will track and display"
                            className="min-h-[80px] bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60 resize-none"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none rounded-md" />
                        </div>
                      </div>

                      {/* Privacy Setting */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          Privacy Settings
                        </Label>
                        <div className="p-4 bg-gradient-to-r from-muted/30 to-muted/20 rounded-xl border border-border/30">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <input
                                type="checkbox"
                                id="isPublic"
                                checked={createForm.isPublic}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20 focus:ring-2"
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="isPublic" className="text-sm font-medium cursor-pointer">
                                Make dashboard public
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Allow team members to view this dashboard
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Premium Footer */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-border/20">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-6 bg-background/50 border-border/50 hover:bg-muted/50 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateDashboard}
                        className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Create Dashboard
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('🎯 Rendering main dashboard view:', {
    dashboardName,
    selectedDashboardId,
    tenantId: tenant?.id,
    actorId,
    dashboardsCount: dashboards.length
  });

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
              <Select value={selectedDashboardId?.toString()} onValueChange={(value) => {
                console.log('🔄 Dashboard selection changed to:', value);
                setSelectedDashboardId(Number(value));
              }}>
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic2"
                      checked={createForm.isPublic}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="isPublic2">Make dashboard public</Label>
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
            <>
              {console.log('🎨 Rendering WidgetCanvas with:', { tenantId: tenant?.id ?? 0, dashboardId: selectedDashboardId, actorId })}
              <WidgetCanvas tenantId={tenant?.id ?? 0} dashboardId={selectedDashboardId} actorId={actorId} />
            </>
          )}
          {!selectedDashboardId && (
            <div className="text-center text-muted-foreground py-8">
              No dashboard selected
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
