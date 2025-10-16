/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { 
  Shield, 
  Eye, 
  Edit, 
  Trash, 
  Share2, 
  Save, 
  X, 
  Users,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { DashboardPermission } from "@/types/permissions";

interface UserPermission {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

interface DashboardPermissionManagerProps {
  dashboardId: number;
  dashboardName: string;
  onPermissionsUpdate?: () => void;
}

export const DashboardPermissionManager: React.FC<DashboardPermissionManagerProps> = ({
  dashboardId,
  dashboardName,
  onPermissionsUpdate,
}) => {
  const { tenant, token, showAlert } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserPermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialState, setInitialState] = useState<UserPermission[]>([]);

  // Fetch users and their permissions
  useEffect(() => {
    if (!tenant || !token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all tenant users
        const usersRes = await fetch(`/api/tenants/${tenant.id}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!usersRes.ok) throw new Error("Failed to fetch users");
        const usersData = await usersRes.json();

        // Fetch dashboard permissions
        const permsRes = await fetch(
          `/api/tenants/${tenant.id}/dashboards/${dashboardId}/permissions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!permsRes.ok) throw new Error("Failed to fetch permissions");
        const permsData: (DashboardPermission & { user: any })[] = await permsRes.json();

        // Merge data
        const userPermissions: UserPermission[] = usersData.map((user: any) => {
          const perm = permsData.find((p) => p.userId === user.id);
          return {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            canView: perm?.canView ?? false,
            canEdit: perm?.canEdit ?? false,
            canDelete: perm?.canDelete ?? false,
            canShare: perm?.canShare ?? false,
          };
        });

        setUsers(userPermissions);
        setInitialState(JSON.parse(JSON.stringify(userPermissions)));
      } catch (error: any) {
        showAlert(error.message || "Failed to load permissions", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant, token, dashboardId, showAlert]);

  const handlePermissionChange = (
    userId: number,
    field: keyof Pick<UserPermission, "canView" | "canEdit" | "canDelete" | "canShare">,
    value: boolean
  ) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.userId === userId ? { ...user, [field]: value } : user
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!tenant || !token) return;

    setSaving(true);
    try {
      // Only send changed permissions
      const permissions = users
        .filter((user) => {
          const initial = initialState.find((u) => u.userId === user.userId);
          return (
            !initial ||
            user.canView !== initial.canView ||
            user.canEdit !== initial.canEdit ||
            user.canDelete !== initial.canDelete ||
            user.canShare !== initial.canShare
          );
        })
        .map((user) => ({
          userId: user.userId,
          canView: user.canView,
          canEdit: user.canEdit,
          canDelete: user.canDelete,
          canShare: user.canShare,
        }));

      const response = await fetch(
        `/api/tenants/${tenant.id}/dashboards/${dashboardId}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save permissions");
      }

      showAlert("Dashboard permissions saved successfully!", "success");
      setHasChanges(false);
      setInitialState(JSON.parse(JSON.stringify(users)));
      
      if (onPermissionsUpdate) {
        onPermissionsUpdate();
      }
    } catch (error: any) {
      showAlert(error.message || "Failed to save permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsers(JSON.parse(JSON.stringify(initialState)));
    setHasChanges(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "EDITOR":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "VIEWER":
        return "bg-gradient-to-r from-slate-500 to-slate-600 text-white";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Loading permissions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border/50 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Dashboard Permissions
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage who can view and edit "{dashboardName}"
                </p>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="default" className="bg-amber-500 text-white">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Users List */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Team Members ({users.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.map((user, index) => (
              <div
                key={user.userId}
                className={`p-6 transition-colors hover:bg-muted/30 ${
                  index % 2 === 0 ? "bg-background" : "bg-muted/10"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">
                          {user.firstName} {user.lastName}
                        </h4>
                        <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-0.5`}>
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Permissions Toggles */}
                  <div className="grid grid-cols-4 gap-6">
                    {/* View Permission */}
                    <div className="flex flex-col items-center gap-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </Label>
                      <Switch
                        checked={user.canView}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(user.userId, "canView", checked)
                        }
                        className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
                      />
                    </div>

                    {/* Edit Permission */}
                    <div className="flex flex-col items-center gap-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Edit className="w-3 h-3" />
                        Edit
                      </Label>
                      <Switch
                        checked={user.canEdit}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(user.userId, "canEdit", checked)
                        }
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    {/* Delete Permission */}
                    <div className="flex flex-col items-center gap-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Trash className="w-3 h-3" />
                        Delete
                      </Label>
                      <Switch
                        checked={user.canDelete}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(user.userId, "canDelete", checked)
                        }
                        className="data-[state=checked]:bg-destructive"
                      />
                    </div>

                    {/* Share Permission */}
                    <div className="flex flex-col items-center gap-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        Share
                      </Label>
                      <Switch
                        checked={user.canShare}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(user.userId, "canShare", checked)
                        }
                        className="data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex justify-end gap-3 sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-lg">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

