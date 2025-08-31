'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Dashboard, Widget } from '@/types/dashboard';
import WidgetRenderer from './WidgetRenderer';

interface DashboardViewerProps {
  dashboard: Dashboard;
  widgets: Widget[];
}

export default function DashboardViewer({ dashboard, widgets }: DashboardViewerProps) {
  const router = useRouter();

  const handleEditMode = () => {
    router.push(`/home/dashboards/${dashboard.id}/edit`);
  };

  const handleBackToList = () => {
    router.push('/home/dashboards');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboards
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{dashboard.name}</h1>
            <p className="text-sm text-muted-foreground">View Mode</p>
          </div>
        </div>
        
        <Button onClick={handleEditMode}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Dashboard
        </Button>
      </div>

      {/* Dashboard Content */}
      <div className="p-4">
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-center">
            <div className="text-muted-foreground">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
              <p className="text-sm mb-4">
                This dashboard doesn't have any widgets yet.
              </p>
              <Button onClick={handleEditMode}>
                <Edit className="h-4 w-4 mr-2" />
                Add Widgets
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-card rounded-lg border border-border p-4 shadow-sm"
                style={{
                  gridColumn: `span ${Math.min(widget.position.w, 4)}`,
                  gridRow: `span ${Math.min(widget.position.h, 4)}`,
                }}
              >
                <WidgetRenderer
                  widget={widget}
                  isSelected={false}
                  onDelete={() => {}} // No delete in view mode
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
