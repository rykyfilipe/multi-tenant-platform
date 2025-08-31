/** @format */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Receipt, Database, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllModules, ModuleDefinition } from "@/lib/modules";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModuleStatus {
  databaseId: number;
  databaseName: string;
  modules: {
    billing: {
      enabled: boolean;
      available: boolean;
    };
  };
}

interface ModulesResponse {
  enabledModules: string[];
  modulesStatus: ModuleStatus[];
}

export default function ModuleManager() {
  const { token, tenant } = useApp();
  const { t } = useLanguage();
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [modulesStatus, setModulesStatus] = useState<ModuleStatus[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Alert dialog state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [moduleToDisable, setModuleToDisable] = useState<{
    moduleId: string;
    databaseId: number;
    databaseName: string;
    moduleName: string;
  } | null>(null);

  useEffect(() => {
    if (token && tenant) {
      fetchModulesStatus();
    }
  }, [token, tenant]);

  useEffect(() => {
    setModules(getAllModules());
  }, []);

  const fetchModulesStatus = async () => {
    if (!token || !tenant) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/tenants/${tenant.id}/modules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: ModulesResponse = await response.json();
        setModulesStatus(data.modulesStatus);
        setEnabledModules(data.enabledModules);
      }
    } catch (error) {
      console.error("Error fetching modules status:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId: string, databaseId: number, action: "enable" | "disable") => {
    if (!token || !tenant) return;

    try {
      setUpdating(moduleId);
      const response = await fetch(`/api/tenants/${tenant.id}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          moduleId,
          action,
          databaseId,
        }),
      });

      if (response.ok) {
        // Refresh modules status
        await fetchModulesStatus();
      } else {
        const error = await response.json();
        console.error("Error toggling module:", error);
      }
    } catch (error) {
      console.error("Error toggling module:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case "billing":
        return <Receipt className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getModuleStatus = (moduleId: string, databaseId: number) => {
    const status = modulesStatus.find(s => s.databaseId === databaseId);
    if (!status) return { enabled: false, available: true };
    
    return status.modules[moduleId as keyof typeof status.modules] || { enabled: false, available: true };
  };

  const handleModuleToggle = (moduleId: string, databaseId: number, checked: boolean) => {
    if (checked) {
      // Enable module - no confirmation needed
      toggleModule(moduleId, databaseId, "enable");
    } else {
      // Disable module - show confirmation dialog
      const module = modules.find(m => m.id === moduleId);
      const database = modulesStatus.find(s => s.databaseId === databaseId);
      
      if (module && database) {
        setModuleToDisable({
          moduleId,
          databaseId,
          databaseName: database.databaseName,
          moduleName: module.name,
        });
        setShowDisableDialog(true);
      }
    }
  };

  const confirmDisableModule = async () => {
    if (moduleToDisable) {
      await toggleModule(moduleToDisable.moduleId, moduleToDisable.databaseId, "disable");
      setShowDisableDialog(false);
      setModuleToDisable(null);
    }
  };

  const cancelDisableModule = () => {
    setShowDisableDialog(false);
    setModuleToDisable(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Management</CardTitle>
          <CardDescription>Loading modules...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Module Management</h2>
        <p className="text-muted-foreground">
          Enable or disable optional modules for your databases. Module tables are excluded from plan limits.
        </p>
      </div>

      {modules.map((module) => (
        <Card key={module.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getModuleIcon(module.id)}
                <div>
                  <CardTitle>{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <Badge variant={enabledModules.includes(module.id) ? "default" : "secondary"}>
                {enabledModules.includes(module.id) ? "Enabled" : "Available"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  This module will create {module.tables.length} predefined tables
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Free</span>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </div>
              </div>

              <Separator />

              {modulesStatus.map((status) => (
                <div key={status.databaseId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{status.databaseName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getModuleStatus(module.id, status.databaseId).enabled ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Inactive</span>
                      </div>
                    )}
                    
                    <Switch
                      checked={getModuleStatus(module.id, status.databaseId).enabled}
                      onCheckedChange={(checked) => {
                        handleModuleToggle(module.id, status.databaseId, checked);
                      }}
                      disabled={updating === module.id}
                    />
                  </div>
                </div>
              ))}

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Note:</strong> Module tables are excluded from your plan's table limits. 
                You can safely enable modules without affecting your ability to create custom tables.
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {modules.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No modules available at the moment.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog for Module Disable Confirmation */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Module Disable
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable the <strong>{moduleToDisable?.moduleName}</strong> module 
              for database <strong>"{moduleToDisable?.databaseName}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogDescription className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <div className="space-y-2">
              <p className="font-medium text-foreground">⚠️ This action will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All module tables and their structure</li>
                <li>All data stored in module tables</li>
                <li>All related columns, rows, and cells</li>
                <li>All permissions associated with module tables</li>
              </ul>
              <p className="text-xs mt-3 text-muted-foreground">
                <strong>Note:</strong> This action cannot be undone. Make sure you have backed up any important data.
              </p>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDisableModule}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisableModule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Disable Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
