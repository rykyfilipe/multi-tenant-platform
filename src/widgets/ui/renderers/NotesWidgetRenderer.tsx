"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { useToast } from "@/hooks/use-toast";
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
  Code
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
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const { toast } = useToast();
  
  const config = widget.config as any;
  const settings = config?.settings || {};
  const styleConfig = config?.style || {};
  
  // Initialize notes from widget data
  const [notes, setNotes] = useState<NoteItem[]>(() => {
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
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIsChecklist, setEditIsChecklist] = useState(false);
  const [editChecklistItems, setEditChecklistItems] = useState<ChecklistItem[]>([]);
  const [editIsMarkdown, setEditIsMarkdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTag, setNewTag] = useState("");
  const [markdownPreview, setMarkdownPreview] = useState(false);

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

  // Save notes to widget config
  const saveNotes = useCallback((updatedNotes: NoteItem[]) => {
    const serializedNotes = updatedNotes.map(note => ({
      ...note,
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt,
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt,
    }));

    updateLocal(widget.id, {
      config: {
        ...config,
        data: {
          ...config.data,
          notes: serializedNotes
        }
      }
    });
    setNotes(updatedNotes);
  }, [widget.id, config, updateLocal]);

  // Add new note
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
    saveNotes([...notes, newNote]);
    toast({
      title: type === 'checklist' ? "Checklist added" : "Note added",
      description: `New ${type} created successfully`,
      variant: "default",
    });
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    saveNotes(updatedNotes);
    toast({
      title: "Note deleted",
      description: "Note removed successfully",
      variant: "default",
    });
  };

  // Toggle pin
  const handleTogglePin = (id: string) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() } : note
    );
    saveNotes(updatedNotes);
  };

  // Start editing
  const handleStartEdit = (note: NoteItem) => {
    if (!allowInlineEdit || !isEditMode) return;
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags || []);
    setEditIsChecklist(note.isChecklist || false);
    setEditChecklistItems(note.checklistItems || []);
    setEditIsMarkdown(note.isMarkdown || false);
    setMarkdownPreview(false);
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingId) return;
    
    const updatedNotes = notes.map(note =>
      note.id === editingId
        ? { 
            ...note, 
            title: editTitle, 
            content: editContent, 
            tags: editTags,
            isChecklist: editIsChecklist,
            checklistItems: editChecklistItems,
            isMarkdown: editIsMarkdown,
            updatedAt: new Date() 
          }
        : note
    );
    saveNotes(updatedNotes);
    setEditingId(null);
    toast({
      title: "Note updated",
      description: "Changes saved successfully",
      variant: "default",
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags([]);
    setEditChecklistItems([]);
    setMarkdownPreview(false);
  };

  // Change note color
  const handleChangeColor = (id: string, color: NoteItem['color']) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, color, updatedAt: new Date() } : note
    );
    saveNotes(updatedNotes);
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

  // Toggle checklist item
  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    const updatedNotes = notes.map(note => {
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
    });
    saveNotes(updatedNotes);
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

  // Grid layout classes
  const getGridClass = () => {
    if (layout === "list") return "flex flex-col";
    return `grid grid-cols-1 sm:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns}`;
  };

  return (
    <BaseWidget 
      title={widget.title} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
    >
      <div className="h-full w-full flex flex-col">
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

        {/* Add Note Buttons */}
        {isEditMode && (
          <div className="mb-4 flex gap-2">
            <Button
              onClick={() => handleAddNote('note')}
              size="sm"
              className="flex-1"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            {enableChecklists && (
              <Button
                onClick={() => handleAddNote('checklist')}
                size="sm"
                className="flex-1"
                variant="outline"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Add Checklist
              </Button>
            )}
          </div>
        )}

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
                const isEditing = editingId === note.id;
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
                      isEditMode && !isEditing && colorTheme.hover,
                      note.isPinned && "ring-2 ring-primary/30"
                    )}
                    style={{
                      borderRadius: `${cardBorderRadius}px`,
                      padding: `${cardPadding}px`,
                    }}
                  >
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-white/50 dark:bg-black/20 font-semibold"
                          style={{ fontSize: `${titleFontSize}px` }}
                          placeholder="Note title..."
                        />
                        
                        {/* Checklist mode toggle */}
                        {enableChecklists && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={editIsChecklist}
                              onCheckedChange={(checked) => setEditIsChecklist(!!checked)}
                            />
                            <label className="text-sm cursor-pointer">Checklist mode</label>
                          </div>
                        )}

                        {/* Checklist items */}
                        {editIsChecklist ? (
                          <div className="space-y-2">
                            {editChecklistItems.map((item, index) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <Input
                                  value={item.text}
                                  onChange={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                                  className="bg-white/50 dark:bg-black/20 text-sm flex-1"
                                  placeholder={`Item ${index + 1}...`}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveChecklistItem(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAddChecklistItem}
                              className="w-full"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add item
                            </Button>
                          </div>
                        ) : (
                          <>
                            {/* Markdown toggle */}
                            {enableMarkdown && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={editIsMarkdown}
                                  onCheckedChange={(checked) => setEditIsMarkdown(!!checked)}
                                />
                                <label className="text-sm cursor-pointer flex items-center gap-1">
                                  <Code className="h-3 w-3" />
                                  Markdown
                                </label>
                                {editIsMarkdown && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setMarkdownPreview(!markdownPreview)}
                                    className="h-6 ml-auto"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    {markdownPreview ? "Edit" : "Preview"}
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Content editor or preview */}
                            {editIsMarkdown && markdownPreview ? (
                              <div className="prose prose-sm max-w-none bg-white/50 dark:bg-black/20 p-3 rounded min-h-[80px]">
                                <ReactMarkdown>{editContent}</ReactMarkdown>
                              </div>
                            ) : (
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-white/50 dark:bg-black/20 min-h-[80px] resize-none"
                                style={{ fontSize: `${contentFontSize}px` }}
                                placeholder={editIsMarkdown ? "Markdown content..." : "Note content..."}
                              />
                            )}
                          </>
                        )}

                        {/* Tags */}
                        {enableTags && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
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
                                className="bg-white/50 dark:bg-black/20 text-sm flex-1"
                                placeholder="Add tag..."
                              />
                              <Button size="sm" variant="outline" onClick={handleAddTag}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div
                        onClick={() => handleStartEdit(note)}
                        className={cn(
                          "space-y-2",
                          isEditMode && allowInlineEdit && "cursor-pointer"
                        )}
                      >
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
                                  onCheckedChange={() => isEditMode && handleToggleChecklistItem(note.id, item.id)}
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
                    )}

                    {/* Actions (visible on hover in edit mode) */}
                    {!isEditing && isEditMode && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        {/* Pin button */}
                        {enablePinning && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 bg-background/90 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(note.id);
                            }}
                            title={note.isPinned ? "Unpin" : "Pin"}
                          >
                            {note.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                          </Button>
                        )}

                        {/* Color picker */}
                        <div className="flex gap-1 bg-background/90 p-1 rounded-md shadow-sm">
                          {(Object.keys(noteColors) as Array<keyof typeof noteColors>).map((color) => (
                            <button
                              key={color}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangeColor(note.id, color);
                              }}
                              className={cn(
                                "w-4 h-4 rounded-full border-2 transition-transform hover:scale-110",
                                noteColors[color].bg,
                                note.color === color && "ring-2 ring-offset-1 ring-primary"
                              )}
                              title={color}
                            />
                          ))}
                        </div>

                        {/* Delete button */}
                        {allowDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 bg-background/90 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
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
