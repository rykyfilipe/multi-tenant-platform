'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  mode: 'view' | 'edit';
  isPublic: boolean;
  isDefault: boolean;
  _count: { widgets: number };
}

interface DashboardDetailsEditorProps {
  dashboard: Dashboard;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<void>;
}

export function DashboardDetailsEditor({ 
  dashboard, 
  isOpen, 
  onClose, 
  onSave 
}: DashboardDetailsEditorProps) {
  const [formData, setFormData] = useState({
    name: dashboard.name,
    description: dashboard.description || '',
    isPublic: dashboard.isPublic,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when dashboard changes
  useEffect(() => {
    setFormData({
      name: dashboard.name,
      description: dashboard.description || '',
      isPublic: dashboard.isPublic,
    });
  }, [dashboard]);

  // Check for changes
  useEffect(() => {
    const hasNameChange = formData.name !== dashboard.name;
    const hasDescriptionChange = formData.description !== (dashboard.description || '');
    const hasPublicChange = formData.isPublic !== dashboard.isPublic;
    
    setHasChanges(hasNameChange || hasDescriptionChange || hasPublicChange);
  }, [formData, dashboard]);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        name: formData.name,
        description: formData.description || undefined,
        isPublic: formData.isPublic,
      });
      onClose();
    } catch (error) {
      console.error('Error saving dashboard details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: dashboard.name,
      description: dashboard.description || '',
      isPublic: dashboard.isPublic,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5" />
            <span>Edit Dashboard Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Dashboard Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter dashboard name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter dashboard description"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="isPublic">Make this dashboard public</Label>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{dashboard._count.widgets} widgets</span>
            <span>•</span>
            <span>{dashboard.mode} mode</span>
            {dashboard.isDefault && (
              <>
                <span>•</span>
                <span className="text-blue-600 font-medium">Default</span>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
