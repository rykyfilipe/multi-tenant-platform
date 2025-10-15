"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AppContext";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import {
  Plus,
  Trash2,
  Save,
  X,
  StickyNote,
  Search,
  Pin,
  PinOff,
  Tag,
  CheckSquare,
  List,
  Bell,
  BellOff,
  Link2,
  Eye,
  Code,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteItem, ChecklistItem, noteColors } from "@/widgets/schemas/notes-v1";
import ReactMarkdown from 'react-markdown';

interface NotesWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

const NotesWidgetRendererComponent: React.FC<NotesWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode = false
}) => {
  const { toast } = useToast();
  const { token } = useAuth();
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  
  const config = widget.config as any;
  const settings = config?.settings || {};
  const styleConfig = config?.style || {};
  
  // Initialize notes from widget data
  const getInitialNotes = useCallback((): NoteItem[] => {
    if (config?.data?.notes && Array.isArray(config.data.notes)) {
      return config.data.notes.map((note: any) => ({
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
        tags: note.tags || [],
        isPinned: note.isPinned || false,
        isChecklist: note.isChecklist || false,
        checklistItems: note.checklistItems || [],
        isMarkdown: note.isMarkdown || false,
        linkedWidgetIds: note.linkedWidgetIds || [],
        reminder: note.reminder || undefined,
      }));
    }
    return [];
  }, [config]);

  // Optimistic updates hook
  const { data: notes, setData: setNotes, isSaving, syncData } = useOptimisticUpdate<NoteItem[]>(
    getInitialNotes(),
    {
      onSave: async (updatedNotes: NoteItem[]) => {
        if (isEditMode || !token) {
          console.log('[NotesWidget] Skipping save - edit mode or no token');
          return;
        }

        const serializedNotes = updatedNotes.map(note => ({
          ...note,
          createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
          updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
        }));

        const updatedConfig = {
          ...widget.config,
          data: {
            ...(widget.config as any)?.data,
            notes: serializedNotes
          }
        };

        console.log('[NotesWidget] Saving notes via PATCH:', `/api/dashboards/${widget.dashboardId}/widgets/${widget.id}`);

        const response = await fetch(`/api/dashboards/${widget.dashboardId}/widgets/${widget.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            config: updatedConfig,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save notes: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[NotesWidget] Notes saved successfully:', result);
        
        // Update local store with the response from server
        updateLocal(widget.id, { config: result.config });
      },
      showToast: true,
      successMessage: "Notes saved",
      errorMessage: "Failed to save notes",
      debounceMs: 500, // Debounce rapid changes
    }
  );

  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState<NoteItem['color']>("yellow");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIsChecklist, setEditIsChecklist] = useState(false);
  const [editChecklistItems, setEditChecklistItems] = useState<ChecklistItem[]>([]);
  const [editIsMarkdown, setEditIsMarkdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTag, setNewTag] = useState("");
  const [markdownPreview, setMarkdownPreview] = useState(false);

  // Sync notes when widget.config changes from outside (e.g., refresh or server update)
  // DON'T include 'notes' in dependencies to avoid circular updates
  useEffect(() => {
    if (config?.data?.notes && Array.isArray(config.data.notes)) {
      const loadedNotes = config.data.notes.map((note: any) => ({
        ...note,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
        tags: note.tags || [],
        isPinned: note.isPinned || false,
        isChecklist: note.isChecklist || false,
        checklistItems: note.checklistItems || [],
        isMarkdown: note.isMarkdown || false,
        linkedWidgetIds: note.linkedWidgetIds || [],
        reminder: note.reminder || undefined,
      }));
      
      // Always sync when config changes (from server or external source)
      console.log('[NotesWidget] Syncing notes from widget.config:', loadedNotes.length);
      syncData(loadedNotes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.id, widget.config]);

  // Extract settings
  const showDates = settings.showDates ?? true;
  const dateFormat = settings.dateFormat || "relative";
  const layout = settings.layout || "grid";
  const columns = settings.columns || 2;
  const allowInlineEdit = settings.allowInlineEdit ?? true;
  const allowDelete = settings.allowDelete ?? true;
  const defaultColor = settings.defaultColor || "yellow";
  const enableSearch = settings.enableSearch ?? true;
  const enableTags = settings.enableTags ?? true;
  const enablePinning = settings.enablePinning ?? true;
  const enableChecklists = settings.enableChecklists ?? true;
  const showPinnedFirst = settings.showPinnedFirst ?? true;
  const enableMarkdown = settings.enableMarkdown ?? false;
  const enableReminders = settings.enableReminders ?? false;

  // Extract style
  const backgroundColor = styleConfig.backgroundColor || "transparent";
  const textColor = styleConfig.textColor || "#000000";
  const containerBorderRadius = styleConfig.borderRadius ?? 0;
  const border = styleConfig.border || { enabled: false, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" };
  const cardBorderRadius = styleConfig.cardBorderRadius ?? 12;
  const cardShadow = styleConfig.cardShadow || "md";
  const cardPadding = styleConfig.cardPadding ?? 16;
  const titleFontSize = styleConfig.titleFontSize ?? 16;
  const contentFontSize = styleConfig.contentFontSize ?? 14;
  const gap = styleConfig.gap ?? 12;

  // Format date
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "";
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (dateFormat === "relative") {
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString();
    }
    
    switch (dateFormat) {
      case "DD/MM/YYYY":
        return d.toLocaleDateString("en-GB");
      case "MM/DD/YYYY":
        return d.toLocaleDateString("en-US");
      case "YYYY-MM-DD":
        return d.toISOString().split('T')[0];
      default:
        return d.toLocaleDateString();
    }
  };

  // Add new note - optimistic
  const handleAddNote = (type: 'note' | 'checklist' = 'note') => {
    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: type === 'checklist' ? "New Checklist" : "New Note",
      content: "",
      color: defaultColor as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      isPinned: false,
      isChecklist: type === 'checklist',
      checklistItems: type === 'checklist' ? [{ id: '1', text: '', checked: false }] : [],
      isMarkdown: false,
      linkedWidgetIds: [],
    };
    setNotes([...notes, newNote]);
  };

  // Delete note - optimistic
  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // Toggle pin - optimistic
  const handleTogglePin = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() } : note
    ));
  };

  // Open edit dialog
  const openEditDialog = (note: NoteItem) => {
    if (!allowInlineEdit) return;
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
    setEditTags(note.tags || []);
    setEditIsChecklist(note.isChecklist || false);
    setEditChecklistItems(note.checklistItems || []);
    setEditIsMarkdown(note.isMarkdown || false);
    setMarkdownPreview(false);
    setIsEditDialogOpen(true);
  };

  // Save edit from dialog - optimistic
  const handleSaveEdit = () => {
    if (!editingNote) return;
    
    setNotes(notes.map(note =>
      note.id === editingNote.id
        ? { 
            ...note, 
            title: editTitle, 
            content: editContent,
            color: editColor,
            tags: editTags,
            isChecklist: editIsChecklist,
            checklistItems: editChecklistItems,
            isMarkdown: editIsMarkdown,
            updatedAt: new Date() 
          }
        : note
    ));
    
    setIsEditDialogOpen(false);
    setEditingNote(null);
  };

  // Change note color - optimistic
  const handleChangeColor = (id: string, color: NoteItem['color']) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, color, updatedAt: new Date() } : note
    ));
  };

  // Add tag
  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter(t => t !== tag));
  };

  // Toggle checklist item - optimistic
  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId && note.checklistItems) {
        return {
          ...note,
          checklistItems: note.checklistItems.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
          updatedAt: new Date()
        };
      }
      return note;
    }));
  };

  // Add checklist item in edit mode
  const handleAddChecklistItem = () => {
    setEditChecklistItems([
      ...editChecklistItems,
      { id: Date.now().toString(), text: '', checked: false }
    ]);
  };

  // Update checklist item text
  const handleUpdateChecklistItem = (itemId: string, text: string) => {
    setEditChecklistItems(editChecklistItems.map(item =>
      item.id === itemId ? { ...item, text } : item
    ));
  };

  // Remove checklist item
  const handleRemoveChecklistItem = (itemId: string) => {
    setEditChecklistItems(editChecklistItems.filter(item => item.id !== itemId));
  };

  // Filter notes
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Sort: pinned first if enabled
    if (showPinnedFirst) {
      filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    }
    
    return filtered;
  }, [notes, searchQuery, showPinnedFirst]);

  // Shadow classes
  const getShadowClass = () => {
    switch (cardShadow) {
      case "none": return "";
      case "sm": return "shadow-sm";
      case "md": return "shadow-md";
      case "lg": return "shadow-lg";
      default: return "shadow-md";
    }
  };

  // Grid layout classes - responsive using container queries
  const getGridClass = () => {
    if (layout === "list") return "flex flex-col";
    
    // Use container queries (@sm, @md, @lg) based on widget size, not viewport
    const gridClasses: Record<number, string> = {
      1: "grid grid-cols-1",
      2: "grid grid-cols-1 @md:grid-cols-2",
      3: "grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3",
      4: "grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-4",
      5: "grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-5",
      6: "grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-6",
    };
    
    return gridClasses[columns] || gridClasses[2];
  };

  return (
    <BaseWidget 
      title={widget.title} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
    >
      <div 
        className="h-full w-full flex flex-col"
        style={{
          backgroundColor,
          color: textColor,
          borderRadius: `${containerBorderRadius}px`,
          border: border.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
        }}
      >
        {/* Search Bar */}
        {enableSearch && notes.length > 0 && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="pl-9 h-9"
              />
            </div>
          </div>
        )}

        {/* Add Note Buttons - Responsive using container queries */}
        <div className="mb-4 flex flex-col @sm:flex-row gap-2">
          <Button
            onClick={() => handleAddNote('note')}
            size="sm"
            className="flex-1"
            variant="outline"
            disabled={isSaving}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="@sm:inline">Add </span>Note
          </Button>
          {enableChecklists && (
            <Button
              onClick={() => handleAddNote('checklist')}
              size="sm"
              className="flex-1"
              variant="outline"
              disabled={isSaving}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              <span className="@sm:inline">Add </span>Checklist
            </Button>
          )}
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length === 0 && !searchQuery ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notes yet</p>
              {isEditMode && (
                <p className="text-xs mt-1">Click "Add Note" to create one</p>
              )}
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notes match your search</p>
            </div>
          </div>
        ) : (
          <div 
            className={cn(
              getGridClass(),
              "flex-1 overflow-auto"
            )}
            style={{ gap: `${gap}px` }}
          >
            <AnimatePresence>
              {filteredNotes.map((note) => {
                const colorTheme = noteColors[note.color];

                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "relative group",
                      colorTheme.bg,
                      colorTheme.border,
                      "border",
                      getShadowClass(),
                      "transition-all duration-200",
                      colorTheme.hover,
                      note.isPinned && "ring-2 ring-primary/30"
                    )}
                    style={{
                      borderRadius: `${cardBorderRadius}px`,
                      padding: `${cardPadding}px`,
                    }}
                  >
                    {/* View Mode */}
                    <div className="space-y-2">
                        {/* Title with pin icon */}
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn("font-semibold flex-1", colorTheme.text)}
                            style={{ fontSize: `${titleFontSize}px` }}
                          >
                            {note.title}
                          </h3>
                          {note.isPinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                        </div>

                        {/* Checklist items */}
                        {note.isChecklist && note.checklistItems && note.checklistItems.length > 0 ? (
                          <div className="space-y-1">
                            {note.checklistItems.map(item => (
                              <div key={item.id} className="flex items-start gap-2">
                                <Checkbox
                                  checked={item.checked}
                                  onCheckedChange={() => handleToggleChecklistItem(note.id, item.id)}
                                  className="mt-0.5"
                                />
                                <span className={cn(
                                  "text-sm",
                                  item.checked && "line-through opacity-60"
                                )}
                                  style={{ fontSize: `${contentFontSize}px` }}
                                >
                                  {item.text}
                                </span>
                              </div>
                            ))}
                            <div className="text-xs text-muted-foreground mt-2">
                              {note.checklistItems.filter(i => i.checked).length} / {note.checklistItems.length} completed
                            </div>
                          </div>
                        ) : note.content && (
                          /* Regular content or markdown */
                          note.isMarkdown ? (
                            <div className="prose prose-sm max-w-none" style={{ fontSize: `${contentFontSize}px` }}>
                              <ReactMarkdown>{note.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p
                              className={cn("whitespace-pre-wrap", colorTheme.text, "opacity-80")}
                              style={{ fontSize: `${contentFontSize}px` }}
                            >
                              {note.content}
                            </p>
                          )
                        )}

                        {/* Tags */}
                        {enableTags && note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {note.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Date */}
                        {showDates && note.updatedAt && (
                          <p className="text-xs opacity-60">
                            Last edited: {formatDate(note.updatedAt)}
                          </p>
                        )}
                      </div>

                    {/* Actions (visible on hover on larger widgets, always visible on small widgets) */}
                    <div className="absolute top-2 right-2 opacity-100 @md:opacity-0 @md:group-hover:opacity-100 transition-opacity flex flex-col gap-1.5">
                      <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-border/50">
                        {/* Edit button */}
                        {allowInlineEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(note);
                            }}
                            title="Edit note"
                            disabled={isSaving}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {/* Pin button */}
                        {enablePinning && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(note.id);
                            }}
                            title={note.isPinned ? "Unpin" : "Pin"}
                            disabled={isSaving}
                          >
                            {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                          </Button>
                        )}

                        {/* Delete button */}
                        {allowDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            title="Delete note"
                            disabled={isSaving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Color picker - separate row */}
                      <div className="flex flex-wrap gap-1 bg-background/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border border-border/50 max-w-[140px]">
                        {(Object.keys(noteColors) as Array<keyof typeof noteColors>).map((color) => (
                          <button
                            key={color}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeColor(note.id, color);
                            }}
                            disabled={isSaving}
                            className={cn(
                              "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                              noteColors[color].bg,
                              note.color === color && "ring-2 ring-offset-1 ring-primary scale-110"
                            )}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Note Dialog - Responsive (uses viewport queries as it's a modal) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title */}
            <div>
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note title..."
                className="mt-2"
              />
            </div>

            {/* Color */}
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {(Object.keys(noteColors) as Array<keyof typeof noteColors>).map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      noteColors[color].bg,
                      editColor === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Checklist toggle */}
            {enableChecklists && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={editIsChecklist}
                  onCheckedChange={(checked) => setEditIsChecklist(!!checked)}
                />
                <Label>Checklist mode</Label>
              </div>
            )}

            {/* Content */}
            {editIsChecklist ? (
              <div>
                <Label>Checklist Items</Label>
                <div className="space-y-2 mt-2">
                  {editChecklistItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.text}
                        onChange={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                        placeholder={`Item ${index + 1}...`}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddChecklistItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add item
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Label>Content</Label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Note content..."
                  className="mt-2 min-h-[150px]"
                />
              </div>
            )}

            {/* Tags */}
            {enableTags && (
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mt-2 mb-2">
                  {editTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Markdown toggle */}
            {enableMarkdown && !editIsChecklist && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={editIsMarkdown}
                  onCheckedChange={(checked) => setEditIsMarkdown(!!checked)}
                />
                <Label className="flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  Markdown format
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseWidget>
  );
};

// OPTIMISTIC RENDERING: Only re-render when data changes
export const NotesWidgetRenderer = React.memo(
  NotesWidgetRendererComponent,
  (prevProps, nextProps) => {
    const prevConfig = prevProps.widget.config as any;
    const nextConfig = nextProps.widget.config as any;
    
    if (prevProps.widget.id !== nextProps.widget.id) {
      console.log('🔄 [NotesWidget] Re-render: widget ID changed');
      return false;
    }
    
    // Data changed (notes)
    if (JSON.stringify(prevConfig?.data) !== JSON.stringify(nextConfig?.data)) {
      console.log('🔄 [NotesWidget] Re-render: notes data changed');
      return false;
    }
    
    // Settings changed
    if (JSON.stringify(prevConfig?.settings) !== JSON.stringify(nextConfig?.settings)) {
      console.log('🔄 [NotesWidget] Re-render: settings changed');
      return false;
    }
    
    // Style changed
    if (JSON.stringify(prevConfig?.style) !== JSON.stringify(nextConfig?.style)) {
      console.log('✨ [NotesWidget] Style changed - optimistic');
      return false;
    }
    
    if (prevProps.isEditMode !== nextProps.isEditMode) {
      console.log('🔄 [NotesWidget] Re-render: edit mode changed');
      return false;
    }
    
    console.log('⚡ [NotesWidget] Props equal - SKIP re-render');
    return true;
  }
);
