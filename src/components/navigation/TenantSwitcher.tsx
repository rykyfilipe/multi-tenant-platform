/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";

interface TenantInfo {
  id: number;
  name: string;
  logoUrl: string | null;
  role: string;
  joinedAt: Date;
  lastAccessedAt: Date | null;
  isActive: boolean;
}

export const TenantSwitcher: React.FC = () => {
  const { tenant, token, showAlert, user } = useApp();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchTenants = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/user/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch tenants");

        const data = await response.json();
        setTenants(data.tenants || []);
      } catch (error: any) {
        console.error("Error fetching tenants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [token]);

  const handleSwitchTenant = async (tenantId: number) => {
    if (!token || tenantId === tenant?.id) return;

    setSwitching(true);
    try {
      const response = await fetch("/api/user/switch-tenant", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to switch tenant");
      }

      const data = await response.json();
      showAlert(`Switched to ${data.tenant.name}`, "success");

      // Reload the page to update all tenant-specific data
      window.location.reload();
    } catch (error: any) {
      showAlert(error.message || "Failed to switch tenant", "error");
    } finally {
      setSwitching(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      case "EDITOR":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "VIEWER":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (tenants.length <= 1) {
    // Don't show switcher if user only has access to one tenant
    return null;
  }

  const activeTenant = tenants.find((t) => t.isActive) || tenants[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-3 py-2 h-10 border-border hover:bg-muted/50 transition-all"
          disabled={switching}
        >
          {switching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(activeTenant?.name || "T")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {activeTenant?.name || "Select Tenant"}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2 py-3">
          <Building2 className="w-4 h-4" />
          <span>Switch Organization</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          tenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => handleSwitchTenant(t.id)}
              className="flex items-center justify-between gap-3 p-3 cursor-pointer"
              disabled={t.isActive || switching}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge className={`${getRoleBadgeColor(t.role)} text-[10px] px-1.5 py-0 border-0`}>
                      {t.role}
                    </Badge>
                  </div>
                </div>
              </div>
              {t.isActive && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

