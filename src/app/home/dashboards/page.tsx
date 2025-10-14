'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { isWidgetsV2Enabled } from '@/lib/featureFlag';
import { WidgetCanvasNew } from '@/widgets/ui/WidgetCanvasNew';
import { SmartWidgetTemplatesModal } from '@/widgets/ui/components/SmartWidgetTemplatesModal';
import { Plus, LayoutDashboard, Edit3, Eye, Settings, Trash2, Edit, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

interface DashboardSummary {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
}

export default function DashboardsPage() {
  const { tenant, user, token } = useApp();
  const { toast } = useToast();
  const { isEditMode, setIsEditMode } = useEditMode();
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [actorId, setActorId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const loadingRef = useRef(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', isPublic: false });
  const [editForm, setEditForm] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    if (user?.id && actorId !== user.id) {
      setActorId(user.id);
    }
  }, [user?.id, actorId]);

  useEffect(() => {
    const loadDashboards = async () => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setIsLoading(true);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/dashboards', { headers });

        if (!res.ok) {
          throw new Error(`Failed to load dashboards: ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as { dashboards?: DashboardSummary[]; pagination?: unknown };
        const dashboardList = data.dashboards ?? [];

        setDashboards(dashboardList);

        const defaultDashboard = dashboardList.find((d) => d.isDefault) ?? dashboardList[0];
        setSelectedDashboardId(defaultDashboard?.id ?? null);
        setIsLoading(false);

      } catch (error) {
        toast({
          title: 'Error',
          description: 'Unable to load dashboards.',
          variant: 'destructive',
        });
        setIsLoading(false);
      } finally {
        loadingRef.current = false;
      }
    };

    if (tenant?.id && user?.id && !loadingRef.current) {
      loadDashboards();
    }
  }, [tenant?.id, user?.id, token, toast]);

  const dashboardName = useMemo(() => {
    if (!selectedDashboardId) return null;
    return dashboards.find((dash) => dash.id === selectedDashboardId)?.name ?? null;
  }, [dashboards, selectedDashboardId]);

  const handleCreateDashboard = async () => {
    if (!createForm.name.trim()) {
      toast({
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

      if (!res.ok) {
        throw new Error(`Failed to create dashboard: ${res.status} ${res.statusText}`);
      }

      const newDashboard = await res.json();
      
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboardId(newDashboard.id);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', description: '', isPublic: false });

      toast({
        title: 'Success',
        description: 'Dashboard created successfully.',
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
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
        isPublic: false
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateDashboard = async () => {
    if (!editForm.name.trim() || !selectedDashboardId) {
      toast({
        title: 'Error',
        description: 'Dashboard name is required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch(`/api/dashboards/${selectedDashboardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        throw new Error(`Failed to update dashboard: ${res.status} ${res.statusText}`);
      }

      const updatedDashboard = await res.json();
      
      setDashboards(prev => prev.map(d => d.id === selectedDashboardId ? updatedDashboard : d));
      setIsEditModalOpen(false);
      setEditForm({ name: '', description: '', isPublic: false });
      
      toast({
        title: 'Success',
        description: 'Dashboard updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update dashboard.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDashboard = async () => {
    if (!selectedDashboardId || isDeleting) return;

    const dashboardToDelete = selectedDashboardId;

    try {
      setIsDeleting(true);
      
      // Calculate next dashboard BEFORE deletion
      const remainingDashboards = dashboards.filter(d => d.id !== dashboardToDelete);
      const nextDashboard = remainingDashboards.length > 0 ? remainingDashboards[0] : null;
      
      console.log('[Delete Dashboard] Deleting dashboard:', dashboardToDelete);
      console.log('[Delete Dashboard] Next dashboard will be:', nextDashboard?.id);
      
      const res = await fetch(`/api/dashboards/${dashboardToDelete}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete dashboard: ${res.status} ${res.statusText}`);
      }
      
      // OPTIMISTIC UPDATE: Update local state immediately
      setDashboards(prev => prev.filter(d => d.id !== dashboardToDelete));
      
      // Navigate to next dashboard or clear selection
      if (nextDashboard) {
        console.log('[Delete Dashboard] Switching to dashboard:', nextDashboard.id);
        setSelectedDashboardId(nextDashboard.id);
      } else {
        console.log('[Delete Dashboard] No more dashboards, clearing selection');
        setSelectedDashboardId(null);
      }
      
      setIsDeleteModalOpen(false);
      
      // Refresh dashboards list from server to ensure sync
      setTimeout(async () => {
        try {
          const refreshRes = await fetch('/api/dashboards', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          });
          if (refreshRes.ok) {
            const refreshedDashboards = await refreshRes.json();
            setDashboards(refreshedDashboards);
            console.log('[Delete Dashboard] Refreshed dashboards:', refreshedDashboards.length);
          }
        } catch (error) {
          console.warn('[Delete Dashboard] Failed to refresh dashboards:', error);
        }
      }, 100);
      
      toast({
        title: 'Success',
        description: 'Dashboard deleted successfully.',
      });
    } catch (error) {
      console.error('[Delete Dashboard] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dashboard.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDefaultDashboard = async () => {
    try {
      const defaultForm = {
        name: 'My Dashboard',
        description: 'Default dashboard',
        mode: 'view',
        isPublic: false,
        isDefault: false
      };

      const res = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(defaultForm),
      });

      if (!res.ok) {
        throw new Error(`Failed to create default dashboard: ${res.status} ${res.statusText}`);
      }

      const newDashboard = await res.json();
      
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboardId(newDashboard.id);
      
      toast({
        title: 'Success',
        description: 'Default dashboard created successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create default dashboard.',
        variant: 'destructive',
      });
    }
  };

  // Feature flag check
  if (!isWidgetsV2Enabled()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4 mx-auto">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">Feature Not Available</CardTitle>
              <CardDescription>
                The new dashboard experience is not enabled. Please contact your administrator to enable the Widgets V2 feature.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || actorId === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty state
  if (dashboards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="text-center pb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 mb-6 mx-auto">
                <LayoutDashboard className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Create Your First Dashboard
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Start building your custom analytics workspace with widgets and visualizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleCreateDefaultDashboard}
                className="w-full gap-2 h-11 shadow-sm"
                size="lg"
              >
                <Sparkles className="h-4 w-4" />
                Create Default Dashboard
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    Or
                  </span>
                </div>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 h-11" size="lg">
                    <Plus className="h-4 w-4" />
                    Create Custom Dashboard
                  </Button>
                </DialogTrigger>
                <DashboardFormModal
                  isOpen={isCreateModalOpen}
                  onClose={() => setIsCreateModalOpen(false)}
                  title="Create New Dashboard"
                  description="Design your custom analytics workspace"
                  form={createForm}
                  setForm={setCreateForm}
                  onSubmit={handleCreateDashboard}
                  submitLabel="Create Dashboard"
                />
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - Responsive Toolbar */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-3 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {/* Top Row: Dashboard Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
              <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <Select value={selectedDashboardId?.toString() || ''} onValueChange={(value) => setSelectedDashboardId(parseInt(value))}>
                <SelectTrigger className="w-full h-9 sm:h-10 bg-card border-border text-sm sm:text-base">
                  <SelectValue placeholder="Select dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dashboard.name}</span>
                        {dashboard.isDefault && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dashboardName && (
                <p className="text-xs text-muted-foreground mt-1 truncate hidden sm:block">
                  {dashboards.find(d => d.id === selectedDashboardId)?.description || 'Dashboard workspace'}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Row: Action Buttons - Full Width on Mobile */}
          <div className="flex items-center justify-between gap-2">
            {/* Left Side: Main Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
              {/* New Dashboard Button */}
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                </DialogTrigger>
                <DashboardFormModal
                  isOpen={isCreateModalOpen}
                  onClose={() => setIsCreateModalOpen(false)}
                  title="Create New Dashboard"
                  description="Design your custom analytics workspace"
                  form={createForm}
                  setForm={setCreateForm}
                  onSubmit={handleCreateDashboard}
                  submitLabel="Create Dashboard"
                />
              </Dialog>

              {/* Templates Button */}
              {selectedDashboardId && (
                <SmartWidgetTemplatesModal dashboardId={selectedDashboardId}>
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Templates</span>
                  </Button>
                </SmartWidgetTemplatesModal>
              )}

              {/* Edit/View Mode Toggle */}
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
              >
                {isEditMode ? (
                  <>
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">View</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </>
                )}
              </Button>
            </div>

            {/* Right Side: Settings */}
            {selectedDashboardId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 sm:h-9 w-8 sm:w-9 p-0">
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {selectedDashboardId && actorId ? (
          <WidgetCanvasNew 
            tenantId={tenant?.id ?? 0} 
            dashboardId={selectedDashboardId} 
            actorId={actorId}
            isEditMode={isEditMode}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Dashboard Selected</h3>
              <p className="text-sm text-muted-foreground">Select a dashboard from the dropdown above to view and manage widgets</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dashboard Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DashboardFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Dashboard"
          description="Update your dashboard details"
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleUpdateDashboard}
          submitLabel="Update Dashboard"
        />
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isDeleting && setIsDeleteModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Dashboard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dashboard? This action cannot be undone and will remove all widgets and configurations.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDashboard}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Dashboard
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reusable Dashboard Form Modal Component
interface DashboardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  form: { name: string; description: string; isPublic: boolean };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; isPublic: boolean }>>;
  onSubmit: () => void;
  submitLabel: string;
}

function DashboardFormModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  form, 
  setForm, 
  onSubmit,
  submitLabel 
}: DashboardFormModalProps) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="mt-1">{description}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-5 py-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Dashboard Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Sales Analytics, Marketing Dashboard"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold">
            Description
          </Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this dashboard will track and display"
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <input
            type="checkbox"
            id="isPublic"
            checked={form.isPublic}
            onChange={(e) => setForm(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="w-4 h-4 mt-0.5 text-primary bg-background border-border rounded focus:ring-primary/20 focus:ring-2"
          />
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

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} className="gap-2">
          <LayoutDashboard className="h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </DialogContent>
  );
}
