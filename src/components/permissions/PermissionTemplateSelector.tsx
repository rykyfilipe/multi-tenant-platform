/** @format */

"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSION_TEMPLATES, PermissionTemplate } from "@/lib/permission-templates";
import { useApp } from "@/contexts/AppContext";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";

interface PermissionTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: number[];
  onSuccess?: () => void;
}

export const PermissionTemplateSelector: React.FC<PermissionTemplateSelectorProps> = ({
  open,
  onOpenChange,
  selectedUserIds,
  onSuccess,
}) => {
  const { tenant, token, showAlert } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [applyToTables, setApplyToTables] = useState(true);
  const [applyToDashboards, setApplyToDashboards] = useState(true);
  const [loading, setLoading] = useState(false);

  const generalTemplates = PERMISSION_TEMPLATES.filter(t => t.category === 'general');
  const departmentalTemplates = PERMISSION_TEMPLATES.filter(t => t.category === 'departmental');
  const projectTemplates = PERMISSION_TEMPLATES.filter(t => t.category === 'project');

  const handleApply = async () => {
    if (!selectedTemplate || !tenant || !token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/tenants/${tenant.id}/permissions/templates/apply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            userIds: selectedUserIds,
            applyToTables,
            applyToDashboards,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply template");
      }

      const data = await response.json();
      showAlert(
        `Template applied successfully to ${selectedUserIds.length} user(s)!`,
        "success"
      );

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showAlert(error.message || "Failed to apply template", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderTemplateCard = (template: PermissionTemplate) => (
    <button
      key={template.id}
      onClick={() => setSelectedTemplate(template)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        selectedTemplate?.id === template.id
          ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-3xl flex-shrink-0`}>
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{template.name}</h4>
            {selectedTemplate?.id === template.id && (
              <CheckCircle className="w-4 h-4 text-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {template.description}
          </p>
          
          {/* Permission Preview */}
          <div className="flex flex-wrap gap-1">
            {template.permissions.tables && (
              <>
                {template.permissions.tables.canRead && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">👁️ Read</Badge>
                )}
                {template.permissions.tables.canEdit && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">✏️ Edit</Badge>
                )}
                {template.permissions.tables.canDelete && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">🗑️ Delete</Badge>
                )}
              </>
            )}
            {template.permissions.dashboards?.canShare && (
              <Badge variant="secondary" className="text-xs px-2 py-0">🔗 Share</Badge>
            )}
          </div>
        </div>
        <Badge className={`bg-gradient-to-r ${template.color} text-white border-0 text-xs`}>
          {template.category}
        </Badge>
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <DialogTitle className="text-2xl">Apply Permission Template</DialogTitle>
          </div>
          <DialogDescription>
            Choose a template to quickly assign permissions to {selectedUserIds.length} selected user(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General ({generalTemplates.length})</TabsTrigger>
              <TabsTrigger value="departmental">Departmental ({departmentalTemplates.length})</TabsTrigger>
              <TabsTrigger value="project">Project ({projectTemplates.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-3 mt-4">
              {generalTemplates.map(renderTemplateCard)}
            </TabsContent>

            <TabsContent value="departmental" className="space-y-3 mt-4">
              {departmentalTemplates.map(renderTemplateCard)}
            </TabsContent>

            <TabsContent value="project" className="space-y-3 mt-4">
              {projectTemplates.map(renderTemplateCard)}
            </TabsContent>
          </Tabs>

          {/* Options */}
          {selectedTemplate && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Application Options
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-tables"
                    checked={applyToTables}
                    onCheckedChange={(checked) => setApplyToTables(checked as boolean)}
                  />
                  <Label htmlFor="apply-tables" className="text-sm cursor-pointer">
                    Apply to all tables
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apply-dashboards"
                    checked={applyToDashboards}
                    onCheckedChange={(checked) => setApplyToDashboards(checked as boolean)}
                  />
                  <Label htmlFor="apply-dashboards" className="text-sm cursor-pointer">
                    Apply to all dashboards
                  </Label>
                </div>
              </div>

              {!applyToTables && !applyToDashboards && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Please select at least one option to apply
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedTemplate || loading || (!applyToTables && !applyToDashboards)}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

