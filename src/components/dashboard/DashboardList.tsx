'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Eye, BarChart3 } from 'lucide-react';
import { Dashboard } from '@/types/dashboard';
import { toast } from 'sonner';

interface DashboardListProps {
  initialDashboards: Dashboard[];
}

export default function DashboardList({ initialDashboards }: DashboardListProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>(initialDashboards);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast.error('Dashboard name is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newDashboardName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dashboard');
      }

      const newDashboard = await response.json();
      setDashboards(prev => [newDashboard, ...prev]);
      setNewDashboardName('');
      setIsCreateDialogOpen(false);
      toast.success('Dashboard created successfully');
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete dashboard');
      }

      setDashboards(prev => prev.filter(d => d.id !== dashboardId));
      toast.success('Dashboard deleted successfully');
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('Failed to delete dashboard');
    }
  };

  const handleEditDashboard = (dashboardId: string) => {
    router.push(`/home/dashboards/${dashboardId}/edit`);
  };

  const handleViewDashboard = (dashboardId: string) => {
    router.push(`/home/dashboards/${dashboardId}/view`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {dashboards.length === 0 ? 'No dashboards yet' : `${dashboards.length} Dashboard${dashboards.length !== 1 ? 's' : ''}`}
          </h2>
          {dashboards.length === 0 && (
            <p className="text-muted-foreground mt-1">
              Create your first dashboard to get started
            </p>
          )}
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dashboard-name">Dashboard Name</Label>
                <Input
                  id="dashboard-name"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  placeholder="Enter dashboard name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateDashboard();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDashboard}
                  disabled={isCreating || !newDashboardName.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {dashboards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Dashboard
            </h3>
            <p className="text-muted-foreground mb-4">
              Start building beautiful dashboards with our drag & drop editor
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{dashboard.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDashboard(dashboard.id)}
                      title="View Dashboard"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditDashboard(dashboard.id)}
                      title="Edit Dashboard"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDashboard(dashboard.id)}
                      title="Delete Dashboard"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Widgets</span>
                    <span className="font-medium">{dashboard.widgets.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Last Updated</span>
                    <span className="font-medium">
                      {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDashboard(dashboard.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditDashboard(dashboard.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
