"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard, HelpCircle } from "lucide-react";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Widget Creation
  { keys: ["Ctrl", "Shift", "C"], description: "Add Chart Widget", category: "Widget Creation" },
  { keys: ["Ctrl", "Shift", "T"], description: "Add Table Widget", category: "Widget Creation" },
  { keys: ["Ctrl", "Shift", "K"], description: "Add KPI Widget", category: "Widget Creation" },
  { keys: ["Ctrl", "Shift", "W"], description: "Add Weather Widget", category: "Widget Creation" },
  { keys: ["Ctrl", "Shift", "L"], description: "Add Clock Widget", category: "Widget Creation" },
  { keys: ["Ctrl", "Shift", "U"], description: "Add Chart Widget", category: "Widget Creation" },
  
  // General Operations
  { keys: ["Ctrl", "S"], description: "Save Pending Changes", category: "General" },
  { keys: ["Ctrl", "Z"], description: "Undo", category: "General" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Redo", category: "General" },
  { keys: ["Ctrl", "A"], description: "Select All Widgets", category: "General" },
  { keys: ["Ctrl", "D"], description: "Duplicate Selected Widget", category: "General" },
  { keys: ["Ctrl", "Delete"], description: "Delete Selected Widget", category: "General" },
  { keys: ["Escape"], description: "Cancel Selection", category: "General" },
  { keys: ["/"], description: "Open Search", category: "General" },
];

export const KeyboardShortcutsDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">Tip:</p>
              <p>Use <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl</kbd> on Windows/Linux or <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Cmd</kbd> on Mac</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
