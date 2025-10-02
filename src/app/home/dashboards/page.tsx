'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { isWidgetsV2Enabled } from '@/lib/featureFlag';
import { WidgetCanvasNew } from '@/widgets/ui/WidgetCanvasNew';
import { Plus, LayoutDashboard, Edit3, Eye, Settings, MoreHorizontal, Trash2, Edit } from 'lucide-react';

interface DashboardSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export default function DashboardsPage() {
  const { tenant, user, token } = useApp();
  const toast = useToast();
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [actorId, setActorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const loadingRef = useRef(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', isPublic: false });
  const [editForm, setEditForm] = useState({ name: '', description: '', isPublic: false });
  const [isEditMode, setIsEditMode] = useState(false);

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
      console.log('📊 Starting to load dashboards...', { tenantId: tenant?.id, userId: user?.id });

      // Prevent multiple concurrent requests
      if (loadingRef.current) {
        console.log('🔄 Already loading, skipping...');
        return;
      }

      try {
        loadingRef.current = true;
        setIsLoading(true);
        console.log('🌐 Fetching from /api/dashboards');

        // Add authentication headers if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        console.log('🔐 Token available:', !!token);
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔐 Adding Authorization header');
        } else {
          console.log('❌ No token available');
        }

        const res = await fetch('/api/dashboards', { headers });
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
        loadingRef.current = false;
      }
    };

    // Only load if we have tenant and user context and not already loading
    if (tenant?.id && user?.id && !loadingRef.current) {
      loadDashboards();
    }
  }, [tenant?.id, user?.id, token]); // Reload when authentication context changes

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

      // Refresh dashboard list after a short delay to ensure consistency
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('💥 Error creating dashboard:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to create dashboard.',
        variant: 'destructive',
      });
    }
  };

  const handleEditDashboard = () => {
    const currentDashboard = dashboards.find(d => d.id === selectedDashboardId);
    if (currentDashboard) {
      setEditForm({
        name: currentDashboard.name,
        description: currentDashboard.description || '',
        isPublic: false // We'll need to add this field to DashboardSummary
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateDashboard = async () => {
    if (!editForm.name.trim() || !selectedDashboardId) {
      toast.toast({
        title: 'Error',
        description: 'Dashboard name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('✏️ Updating dashboard with data:', editForm);
      const res = await fetch(`/api/dashboards/${selectedDashboardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      console.log('📡 Update dashboard response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Failed to update dashboard:', errorData);
        throw new Error(`Failed to update dashboard: ${res.status} ${res.statusText}`);
      }

      const updatedDashboard = await res.json();
      console.log('✅ Dashboard updated successfully:', updatedDashboard);
      
      setDashboards(prev => prev.map(d => d.id === selectedDashboardId ? updatedDashboard : d));
      setIsEditModalOpen(false);
      setEditForm({ name: '', description: '', isPublic: false });
      
      toast.toast({
        title: 'Success',
        description: 'Dashboard updated successfully.',
      });
    } catch (error) {
      console.error('💥 Error updating dashboard:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to update dashboard.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDashboard = async () => {
    if (!selectedDashboardId) return;

    try {
      console.log('🗑️ Deleting dashboard:', selectedDashboardId);
      const res = await fetch(`/api/dashboards/${selectedDashboardId}`, {
        method: 'DELETE',
      });

      console.log('📡 Delete dashboard response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Failed to delete dashboard:', errorData);
        throw new Error(`Failed to delete dashboard: ${res.status} ${res.statusText}`);
      }

      console.log('✅ Dashboard deleted successfully');
      
      setDashboards(prev => prev.filter(d => d.id !== selectedDashboardId));
      
      // Select another dashboard or create default
      const remainingDashboards = dashboards.filter(d => d.id !== selectedDashboardId);
      if (remainingDashboards.length > 0) {
        setSelectedDashboardId(remainingDashboards[0].id);
      } else {
        setSelectedDashboardId(null);
      }
      
      setIsDeleteModalOpen(false);
      
      toast.toast({
        title: 'Success',
        description: 'Dashboard deleted successfully.',
      });
    } catch (error) {
      console.error('💥 Error deleting dashboard:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to delete dashboard.',
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
        mode: 'view',
        isPublic: false,
        isDefault: false
      };

      console.log('🆕 Creating default dashboard with data:', defaultForm);
      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

  console.log('🔍 Feature flag check:', {
    isWidgetsV2Enabled: isWidgetsV2Enabled(),
    envVar: process.env.NEXT_PUBLIC_WIDGETS_V2,
    envType: typeof process.env.NEXT_PUBLIC_WIDGETS_V2
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

  console.log('🔍 Loading state check:', {
    isLoading,
    actorId,
    actorIdType: typeof actorId,
    dashboardsLength: dashboards.length,
    selectedDashboardId,
    tenantId: tenant?.id
  });

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
  console.log('🔍 Empty state check:', {
    dashboardsLength: dashboards.length,
    dashboards: dashboards
  });

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

  console.log('🎯 Rendering main dashboard view - all conditions passed!');

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Top Header Bar - Minimal and Clean */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/20">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Dashboard Selector and Info */}
          <div className="flex items-center space-x-4">
            {/* Dashboard Selector */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center space-x-3">
                <Select value={selectedDashboardId?.toString() || ''} onValueChange={(value) => setSelectedDashboardId(parseInt(value))}>
                  <SelectTrigger className="w-64 h-9 bg-background/50 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder="Select a dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{dashboard.name}</span>
                          {dashboard.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Dashboard Info */}
            {selectedDashboardId && (
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">{dashboardName}</h1>
                <p className="text-xs text-muted-foreground">Dashboard Management</p>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Create Dashboard Button */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 px-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-3 w-3 mr-1" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
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

            {/* Edit/View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={isEditMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="h-8 px-3"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </>
                )}
              </Button>
            </div>

            {/* Dashboard Settings Menu */}
            {selectedDashboardId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditDashboard}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Dashboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Edit Dashboard Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editName">Name</Label>
                    <Input
                      id="editName"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter dashboard name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editDescription">Description</Label>
                    <Textarea
                      id="editDescription"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter dashboard description"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateDashboard}>
                      Update Dashboard
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Dashboard Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Delete Dashboard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete this dashboard? This action cannot be undone and will remove all widgets and data associated with it.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteDashboard}
                    >
                      Delete Dashboard
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Screen */}
      <div className="pt-16 h-full">
        {selectedDashboardId && (
          <WidgetCanvasNew 
            tenantId={tenant?.id ?? 0} 
            dashboardId={selectedDashboardId} 
            actorId={actorId ?? 0}
            isEditMode={isEditMode}
          />
        )}
        {!selectedDashboardId && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <LayoutDashboard className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Dashboard Selected</h3>
              <p className="text-sm text-muted-foreground/70">Select a dashboard to view widgets</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
