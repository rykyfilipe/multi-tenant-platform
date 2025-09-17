'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Plus, Eye, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  mode: 'view' | 'edit';
  isPublic: boolean;
  isDefault: boolean;
  widgets: any[];
  _count: { widgets: number };
}

interface DashboardSelectorProps {
  dashboards: Dashboard[];
  selectedDashboard: Dashboard | null;
  onSelect: (dashboard: Dashboard) => void;
  onCreateNew: () => void;
}

export function DashboardSelector({ 
  dashboards, 
  selectedDashboard, 
  onSelect, 
  onCreateNew 
}: DashboardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Select
        value={selectedDashboard?.id.toString() || ''}
        onValueChange={(value) => {
          const dashboard = dashboards.find(d => d.id.toString() === value);
          if (dashboard) onSelect(dashboard);
        }}
      >
        <SelectTrigger className="w-80 h-10">
          <div className="flex items-center space-x-2">
            {selectedDashboard ? (
              <>
                <div className="flex items-center space-x-2">
                  {selectedDashboard.mode === 'edit' ? (
                    <Edit3 className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-500" />
                  )}
                  <span className="font-medium">{selectedDashboard.name}</span>
                  <span className="text-sm text-gray-500">
                    ({selectedDashboard._count.widgets} widgets)
                  </span>
                </div>
              </>
            ) : (
              <span className="text-gray-500">Select a dashboard</span>
            )}
          </div>
        </SelectTrigger>
        
        <SelectContent>
          {(dashboards ?? []).map((dashboard) => (
            <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
              <div className="flex items-center space-x-3 py-2">
                {dashboard.mode === 'edit' ? (
                  <Edit3 className="h-4 w-4 text-blue-500" />
                ) : (
                  <Eye className="h-4 w-4 text-green-500" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{dashboard.name}</span>
                    {dashboard.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                    {dashboard.isPublic && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                  </div>
                  {dashboard.description && (
                    <p className="text-sm text-gray-500 mt-1">{dashboard.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {dashboard._count.widgets} widgets • {dashboard.mode} mode
                  </p>
                </div>
              </div>
            </SelectItem>
          ))}
          
          <div className="border-t border-gray-200 mt-2 pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-10"
              onClick={onCreateNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Dashboard
            </Button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}
