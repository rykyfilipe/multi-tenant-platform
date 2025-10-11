"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PremiumWidgetContainer } from "../components/PremiumWidgetContainer";
import { getPremiumTheme } from "@/widgets/styles/premiumThemes";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { useAuth, useTenant } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Flag,
  Calendar,
  User,
  GripVertical,
  Edit,
  Trash2,
  Plus,
  Search,
  ArrowUpDown,
  Filter,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TasksWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignee?: string;
  progress?: number;
  tags?: string[];
}

export const TasksWidgetRenderer: React.FC<TasksWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode = false
}) => {
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const { user, token } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const config = widget.config as any;
  const settings = config?.settings || {};
  const style = config?.style || {};
  
  // Get tasks from widget data or use default
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (config?.data?.tasks && Array.isArray(config.data.tasks)) {
      return config.data.tasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      }));
    }
    return [
      {
        id: '1',
        title: 'Complete project proposal',
        description: 'Finalize the Q1 project proposal document',
        completed: false,
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        assignee: 'John Doe',
        progress: 75,
        tags: ['work', 'urgent']
      },
      {
        id: '2',
        title: 'Review design mockups',
        description: 'Review and approve the new dashboard designs',
        completed: true,
        priority: 'medium',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        assignee: 'Jane Smith',
        progress: 100,
        tags: ['design', 'review']
      },
      {
        id: '3',
        title: 'Update documentation',
        description: 'Update API documentation with new endpoints',
        completed: false,
        priority: 'low',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assignee: 'Mike Johnson',
        progress: 30,
        tags: ['documentation']
      }
    ];
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'title'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Save tasks directly to API via PATCH - no pending changes
  const saveTasksToApi = useCallback(async (newTasks: Task[]) => {
    if (isEditMode || !token) {
      // Don't save while editing dashboard layout
      return;
    }

    setIsSaving(true);
    try {
      // Convert tasks to serializable format (Date → ISO string)
      const serializableTasks = newTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      }));
      
      // Get current widget config
      const currentWidget = useWidgetsStore.getState().widgets[widget.id];
      const currentConfig = currentWidget?.config || widget.config;
      
      const updatedConfig = {
        ...currentConfig,
        data: {
          ...(currentConfig as any)?.data,
          tasks: serializableTasks
        }
      };

      console.log('[TasksWidget] Saving tasks via PATCH:', `/api/dashboards/${widget.dashboardId}/widgets/${widget.id}`);
      console.log('[TasksWidget] Updated config being sent:', updatedConfig);
      console.log('[TasksWidget] Payload:', { config: updatedConfig });
      
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
        throw new Error(`PATCH failed: ${response.statusText}`);
      }

      const updatedWidget = await response.json();
      console.log('[TasksWidget] PATCH successful');
      
      // Update local store with the response from server
      updateLocal(widget.id, { config: updatedWidget.config });
      
    } catch (error) {
      console.error('[TasksWidget] Save failed:', error);
      toast({
        title: "Save failed",
        description: "Could not save task changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [isEditMode, token, widget.dashboardId, widget.id, updateLocal, toast]);

  // CRUD operations - each one directly calls the API
  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    await saveTasksToApi(newTasks);
  }, [tasks, saveTasksToApi]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const newTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(newTasks);
    await saveTasksToApi(newTasks);
  }, [tasks, saveTasksToApi]);

  const deleteTask = useCallback(async (taskId: string) => {
    const newTasks = tasks.filter(task => task.id !== taskId);
    setTasks(newTasks);
    await saveTasksToApi(newTasks);
  }, [tasks, saveTasksToApi]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  }, [tasks, updateTask]);

  const layout = settings.layout || 'list';
  const showCompleted = settings.showCompleted !== false;
  const showProgress = settings.showProgress !== false;
  const maxTasks = settings.maxTasks || 50;
  const showPriorityColors = style.showPriorityColors !== false;
  const showDueDates = style.showDueDates !== false;

  // Get theme and apply styles
  const theme = getPremiumTheme(style.theme || 'premium-light');

  // Advanced filtering and sorting
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply status filter
    if (!showCompleted && filter === 'all') {
      filtered = filtered.filter(task => !task.completed);
    } else {
      switch (filter) {
        case 'pending':
          filtered = filtered.filter(task => !task.completed);
          break;
        case 'completed':
          filtered = filtered.filter(task => task.completed);
          break;
      }
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.assignee?.toLowerCase().includes(term) ||
        task.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'dueDate':
          aValue = a.dueDate?.getTime() || Infinity;
          bValue = b.dueDate?.getTime() || Infinity;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered.slice(0, maxTasks);
  }, [tasks, filter, showCompleted, searchTerm, sortBy, sortOrder, maxTasks]);


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3" />;
      case 'high': return <Flag className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <Circle className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const renderTaskCard = (task: Task) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-200",
        task.completed
          ? "bg-muted/50 border-muted"
          : "bg-card border-border hover:shadow-md",
        layout === 'card' && "min-h-[120px]"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => toggleTask(task.id)}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className={cn(
              "font-medium truncate",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>

            {showPriorityColors && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white",
                getPriorityColor(task.priority)
              )}>
                {getPriorityIcon(task.priority)}
                <span className="capitalize">{task.priority}</span>
              </div>
            )}
          </div>

          {task.description && layout === 'card' && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {showDueDates && task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{task.assignee}</span>
              </div>
            )}

            {showProgress && task.progress !== undefined && (
              <div className="flex items-center gap-2">
                <span>{task.progress}%</span>
                <Progress value={task.progress} className="w-16 h-2" />
              </div>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingTask(task)}
              >
                <Edit className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <TaskForm 
                task={task}
                onSubmit={(taskData) => {
                  updateTask(task.id, taskData);
                  setEditingTask(null);
                }}
                onCancel={() => setEditingTask(null)}
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => deleteTask(task.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderTaskList = (task: Task, index: number) => (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
        task.completed
          ? "bg-muted/50 border-muted"
          : "bg-card border-border hover:shadow-sm"
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={() => setDraggedTask(task.id)}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id)}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>

          {showPriorityColors && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white",
              getPriorityColor(task.priority)
            )}>
              {getPriorityIcon(task.priority)}
              <span className="capitalize">{task.priority}</span>
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {showDueDates && task.dueDate && (
          <span>{formatDate(task.dueDate)}</span>
        )}

        {showProgress && task.progress !== undefined && (
          <div className="flex items-center gap-1">
            <span>{task.progress}%</span>
            <Progress value={task.progress} className="w-12 h-1" />
          </div>
        )}

        <div className="flex gap-1">
          <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingTask(task)}
              >
                <Edit className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <TaskForm 
                task={task}
                onSubmit={(taskData) => {
                  updateTask(task.id, taskData);
                  setEditingTask(null);
                }}
                onCancel={() => setEditingTask(null)}
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => deleteTask(task.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer style={style} className="h-full w-full">
        <div className="space-y-4">
        {/* Controls */}
        <div className="space-y-3">
          {/* Progress Overview */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{completedCount}/{totalCount}</span>
              </div>
              <Progress value={progressPercentage} className="w-20" />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm 
                    onSubmit={(taskData) => {
                      addTask(taskData);
                      setShowAddDialog(false);
                    }}
                    onCancel={() => setShowAddDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Tasks List/Grid */}
        <AnimatePresence mode="popLayout">
          {layout === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map(renderTaskCard)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task, index) => renderTaskList(task, index))}
            </div>
          )}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found</p>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <TaskForm 
                  onSubmit={(taskData) => {
                    addTask(taskData);
                    setShowAddDialog(false);
                  }}
                  onCancel={() => setShowAddDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
        </div>
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};

// Task Form Component
interface TaskFormProps {
  task?: Task;
  onSubmit: (taskData: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium' as const,
    dueDate: task?.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
    assignee: task?.assignee || '',
    progress: task?.progress || 0,
    tags: task?.tags?.join(', ') || '',
    completed: task?.completed || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData: Omit<Task, 'id'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      assignee: formData.assignee.trim() || undefined,
      progress: formData.progress || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      completed: formData.completed
    };

    onSubmit(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
              setFormData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Input
            id="assignee"
            value={formData.assignee}
            onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
            placeholder="Enter assignee name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="Enter tags separated by commas"
        />
      </div>

      {task && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="completed"
            checked={formData.completed}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, completed: !!checked }))}
          />
          <Label htmlFor="completed">Mark as completed</Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};
