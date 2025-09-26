"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accessibility, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX,
  Keyboard,
  MousePointer,
  Focus,
} from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  fontSize: "small" | "medium" | "large";
  announceChanges: boolean;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: true,
  focusVisible: true,
  fontSize: "medium",
  announceChanges: true,
};

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isOpen, setIsOpen] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (settings.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    if (settings.fontSize !== "medium") {
      root.classList.add(`font-size-${settings.fontSize}`);
    } else {
      root.classList.remove("font-size-small", "font-size-large");
    }

    // Set focus visible
    if (settings.focusVisible) {
      root.classList.add("focus-visible");
    } else {
      root.classList.remove("focus-visible");
    }
  }, [settings]);

  // Announce changes to screen readers
  const announce = (message: string) => {
    if (settings.announceChanges && announcementRef.current) {
      announcementRef.current.textContent = message;
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = "";
        }
      }, 1000);
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    announce(`${key} ${value ? "enabled" : "disabled"}`);
  };

  return (
    <>
      <div className="accessibility-provider">
        {children}
        
        {/* Screen reader announcements */}
        <div
          ref={announcementRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
        
        {/* Accessibility toolbar */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="gap-2 shadow-lg"
            aria-label="Open accessibility settings"
          >
            <Accessibility className="h-4 w-4" />
            A11y
          </Button>
          
          {isOpen && (
            <div className="absolute bottom-12 right-0 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Accessibility Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close accessibility settings"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">High Contrast</span>
                  </div>
                  <Button
                    variant={settings.highContrast ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("highContrast", !settings.highContrast)}
                  >
                    {settings.highContrast ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm">Reduced Motion</span>
                  </div>
                  <Button
                    variant={settings.reducedMotion ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("reducedMotion", !settings.reducedMotion)}
                  >
                    {settings.reducedMotion ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    <span className="text-sm">Keyboard Navigation</span>
                  </div>
                  <Badge variant={settings.keyboardNavigation ? "default" : "secondary"}>
                    {settings.keyboardNavigation ? "On" : "Off"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Focus className="h-4 w-4" />
                    <span className="text-sm">Focus Indicators</span>
                  </div>
                  <Button
                    variant={settings.focusVisible ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("focusVisible", !settings.focusVisible)}
                  >
                    {settings.focusVisible ? <Focus className="h-3 w-3" /> : <MousePointer className="h-3 w-3" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Size</label>
                  <div className="flex gap-2">
                    {(["small", "medium", "large"] as const).map((size) => (
                      <Button
                        key={size}
                        variant={settings.fontSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting("fontSize", size)}
                        className="capitalize"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground">
                  <p>Accessibility features help make the interface usable for everyone.</p>
                  <p className="mt-1">Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd> to navigate with keyboard.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .high-contrast {
          --background: #ffffff;
          --foreground: #000000;
          --primary: #000000;
          --primary-foreground: #ffffff;
          --secondary: #f0f0f0;
          --secondary-foreground: #000000;
          --muted: #f5f5f5;
          --muted-foreground: #666666;
          --border: #000000;
          --input: #ffffff;
          --ring: #000000;
        }

        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        .font-size-small {
          font-size: 0.875rem;
        }

        .font-size-large {
          font-size: 1.125rem;
        }

        .focus-visible:focus-visible {
          outline: 2px solid #000000;
          outline-offset: 2px;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  );
};

// Hook for accessibility features
export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  const announce = (message: string) => {
    if (settings.announceChanges) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  return {
    settings,
    setSettings,
    announce,
  };
};
