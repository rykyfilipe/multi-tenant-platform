"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize, 
  Minimize,
  RotateCcw,
  Layout,
  Grid3X3,
  Grid2X2,
} from "lucide-react";

type ViewportSize = "desktop" | "tablet" | "mobile";
type LayoutMode = "grid" | "list" | "compact";

interface ResponsiveSettings {
  viewport: ViewportSize;
  layoutMode: LayoutMode;
  columns: number;
  isFullscreen: boolean;
  autoLayout: boolean;
}

interface ResponsiveProviderProps {
  children: React.ReactNode;
}

const defaultSettings: ResponsiveSettings = {
  viewport: "desktop",
  layoutMode: "grid",
  columns: 3,
  isFullscreen: false,
  autoLayout: true,
};

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ResponsiveSettings>(defaultSettings);
  const [isOpen, setIsOpen] = useState(false);

  // Detect viewport size
  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      let viewport: ViewportSize;
      
      if (width < 768) {
        viewport = "mobile";
      } else if (width < 1024) {
        viewport = "tablet";
      } else {
        viewport = "desktop";
      }

      setSettings(prev => ({
        ...prev,
        viewport,
        columns: viewport === "mobile" ? 1 : viewport === "tablet" ? 2 : 3,
      }));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const updateSetting = <K extends keyof ResponsiveSettings>(
    key: K,
    value: ResponsiveSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      updateSetting("isFullscreen", true);
    } else {
      document.exitFullscreen();
      updateSetting("isFullscreen", false);
    }
  };

  const getViewportIcon = (viewport: ViewportSize) => {
    switch (viewport) {
      case "desktop": return Monitor;
      case "tablet": return Tablet;
      case "mobile": return Smartphone;
    }
  };

  const getLayoutIcon = (mode: LayoutMode) => {
    switch (mode) {
      case "grid": return Grid3X3;
      case "list": return Layout;
      case "compact": return Grid2X2;
    }
  };

  return (
    <div className={`responsive-provider viewport-${settings.viewport} layout-${settings.layoutMode}`}>
      {children}
      
      {/* Responsive toolbar */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="gap-2 shadow-lg"
            aria-label="Open responsive settings"
          >
            {React.createElement(getViewportIcon(settings.viewport), { className: "h-4 w-4" })}
            {settings.viewport}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="gap-2 shadow-lg"
            aria-label={settings.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {settings.isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
        
        {isOpen && (
          <div className="absolute bottom-12 left-0 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Responsive Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close responsive settings"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Viewport Size</label>
                <div className="flex gap-2">
                  {(["desktop", "tablet", "mobile"] as const).map((viewport) => {
                    const Icon = getViewportIcon(viewport);
                    return (
                      <Button
                        key={viewport}
                        variant={settings.viewport === viewport ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting("viewport", viewport)}
                        className="gap-2 capitalize"
                      >
                        <Icon className="h-4 w-4" />
                        {viewport}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Layout Mode</label>
                <div className="flex gap-2">
                  {(["grid", "list", "compact"] as const).map((mode) => {
                    const Icon = getLayoutIcon(mode);
                    return (
                      <Button
                        key={mode}
                        variant={settings.layoutMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting("layoutMode", mode)}
                        className="gap-2 capitalize"
                      >
                        <Icon className="h-4 w-4" />
                        {mode}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Columns</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((cols) => (
                    <Button
                      key={cols}
                      variant={settings.columns === cols ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting("columns", cols)}
                    >
                      {cols}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Auto Layout</span>
                </div>
                <Button
                  variant={settings.autoLayout ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("autoLayout", !settings.autoLayout)}
                >
                  {settings.autoLayout ? "On" : "Off"}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                <p>Current: {settings.viewport} ({window.innerWidth}px)</p>
                <p className="mt-1">Layout: {settings.layoutMode} ({settings.columns} columns)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .viewport-mobile {
          --widget-columns: 1;
          --widget-gap: 0.5rem;
          --widget-padding: 0.75rem;
        }

        .viewport-tablet {
          --widget-columns: 2;
          --widget-gap: 1rem;
          --widget-padding: 1rem;
        }

        .viewport-desktop {
          --widget-columns: 3;
          --widget-gap: 1.5rem;
          --widget-padding: 1.5rem;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: repeat(var(--widget-columns), 1fr);
          gap: var(--widget-gap);
        }

        .layout-list {
          display: flex;
          flex-direction: column;
          gap: var(--widget-gap);
        }

        .layout-compact {
          display: grid;
          grid-template-columns: repeat(var(--widget-columns), 1fr);
          gap: calc(var(--widget-gap) * 0.5);
        }

        .layout-compact .widget-card {
          padding: calc(var(--widget-padding) * 0.5);
        }

        @media (max-width: 768px) {
          .responsive-provider {
            --widget-columns: 1;
            --widget-gap: 0.5rem;
            --widget-padding: 0.75rem;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .responsive-provider {
            --widget-columns: 2;
            --widget-gap: 1rem;
            --widget-padding: 1rem;
          }
        }

        @media (min-width: 1025px) {
          .responsive-provider {
            --widget-columns: 3;
            --widget-gap: 1.5rem;
            --widget-padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

// Hook for responsive features
export const useResponsive = () => {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      let newViewport: ViewportSize;
      
      if (width < 768) {
        newViewport = "mobile";
      } else if (width < 1024) {
        newViewport = "tablet";
      } else {
        newViewport = "desktop";
      }

      setViewport(newViewport);
      setIsMobile(newViewport === "mobile");
      setIsTablet(newViewport === "tablet");
      setIsDesktop(newViewport === "desktop");
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return {
    viewport,
    isMobile,
    isTablet,
    isDesktop,
  };
};
