"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { useAuth, useTenant } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";
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

const TasksWidgetRendererComponent: React.FC<TasksWidgetRendererProps> = ({
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
  
  // Get initial tasks from widget data or use default
  const getInitialTasks = useCallback((): Task[] => {
    console.log('[TasksWidget] getInitialTasks - config:', config);
    console.log('[TasksWidget] config.data:', config?.data);
    console.log('[TasksWidget] config.data.tasks:', config?.data?.tasks);
    
    if (config?.data?.tasks && Array.isArray(config.data.tasks)) {
      const loadedTasks = config.data.tasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      }));
      console.log('[TasksWidget] Loaded tasks from config:', loadedTasks);
      return loadedTasks;
    }
    
    console.log('[TasksWidget] No tasks in config, using default tasks');
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
  }, [config]);

  // Optimistic updates hook
  const { data: tasks, setData: setTasks, isSaving, syncData } = useOptimisticUpdate<Task[]>(
    getInitialTasks(),
    {
      onSave: async (updatedTasks: Task[]) => {
        if (isEditMode || !token) {
          console.log('[TasksWidget] Skipping save - edit mode or no token');
          return;
        }

        console.log('[TasksWidget] Saving tasks:', updatedTasks);
        
        // Convert tasks to serializable format (Date → ISO string)
        const serializableTasks = updatedTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
        }));
        
        const updatedConfig = {
          ...widget.config,
          data: {
            ...(widget.config as any)?.data,
            tasks: serializableTasks
          }
        };

        console.log('[TasksWidget] Saving tasks via PATCH:', `/api/dashboards/${widget.dashboardId}/widgets/${widget.id}`);
        
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
          throw new Error(`Failed to save tasks: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[TasksWidget] Tasks saved successfully:', result);
        
        // Update local store with the response from server
        updateLocal(widget.id, { config: result.config });
      },
      showToast: true,
      successMessage: "Tasks saved",
      errorMessage: "Failed to save tasks",
      debounceMs: 500, // Debounce rapid changes
    }
  );

  // Sync tasks when widget.config changes from outside (e.g., refresh or server update)
  // DON'T include 'tasks' in dependencies to avoid circular updates
  useEffect(() => {
    console.log('[TasksWidget] useEffect - widget.config changed');
    if (config?.data?.tasks && Array.isArray(config.data.tasks)) {
      const loadedTasks = config.data.tasks.map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined
      }));
      
      // Always sync when config changes (from server or external source)
      console.log('[TasksWidget] Syncing tasks from widget.config:', loadedTasks.length);
      syncData(loadedTasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.id, widget.config]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'title'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // CRUD operations - optimistic
  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setTasks([...tasks, newTask]);
  }, [tasks, setTasks]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, [tasks, setTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  }, [tasks, setTasks]);

  const toggleTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { completed: !task.completed });
    }
  }, [tasks, updateTask]);

  const layout = settings.layout || 'list';
  const showCompleted = settings.showCompleted !== false;
  const showProgress = settings.showProgress !== false;
  const maxTasks = settings.maxTasks || 50;
  const showPriorityColors = style.showPriorityColors !== false;
  const showDueDates = style.showDueDates !== false;

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
  }, [widget.id, tasks, filter, showCompleted, searchTerm, sortBy, sortOrder, maxTasks]);


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
      key={task.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "group relative p-3 @md:p-4 rounded-lg border transition-all duration-200",
        task.completed
          ? "bg-muted/50 border-muted"
          : "bg-card border-border hover:shadow-md",
        "min-h-[140px]"
      )}
    >
      <div className="flex items-start gap-2 @md:gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => toggleTask(task.id)}
          className="mt-1"
          disabled={isSaving}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2 flex-wrap">
            <h4 className={cn(
              "font-medium flex-1 min-w-0",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>

            {showPriorityColors && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white whitespace-nowrap flex-shrink-0",
                getPriorityColor(task.priority)
              )}>
                {getPriorityIcon(task.priority)}
                <span className="capitalize @sm:inline">{task.priority}</span>
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {showDueDates && task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{task.assignee}</span>
              </div>
            )}

            {showProgress && task.progress !== undefined && (
              <div className="flex items-center gap-2">
                <span>{task.progress}%</span>
                <Progress value={task.progress} className="w-12 @md:w-16 h-2" />
              </div>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions - always visible on small widgets, hover on larger widgets */}
        <div className="opacity-100 @md:opacity-0 @md:group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditingTask(task)}
                disabled={isSaving}
                title="Edit task"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
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
            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => deleteTask(task.id)}
            disabled={isSaving}
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
        "group flex items-center gap-2 @md:gap-3 p-2 @md:p-3 rounded-lg border transition-all duration-200",
        task.completed
          ? "bg-muted/50 border-muted"
          : "bg-card border-border hover:shadow-sm"
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing hidden @md:block"
        draggable
        onDragStart={() => setDraggedTask(task.id)}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id)}
        disabled={isSaving}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={cn(
            "font-medium truncate flex-1 min-w-0",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>

          {showPriorityColors && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white whitespace-nowrap flex-shrink-0",
              getPriorityColor(task.priority)
            )}>
              {getPriorityIcon(task.priority)}
              <span className="capitalize @md:inline">{task.priority}</span>
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1 hidden @md:block">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {showDueDates && task.dueDate && (
          <span className="hidden @lg:inline truncate">{formatDate(task.dueDate)}</span>
        )}

        {showProgress && task.progress !== undefined && (
          <div className="hidden @2xl:flex items-center gap-1">
            <span>{task.progress}%</span>
            <Progress value={task.progress} className="w-12 h-1" />
          </div>
        )}

        <div className="flex gap-0.5 @md:gap-1 opacity-100 @md:opacity-0 @md:group-hover:opacity-100 transition-opacity">
          <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditingTask(task)}
                disabled={isSaving}
                title="Edit task"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
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
            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => deleteTask(task.id)}
            disabled={isSaving}
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
      <div className="h-full w-full flex flex-col p-4 bg-card">
        <div className="flex-shrink-0 space-y-3">
        {/* Controls - Responsive using container queries */}
        <div className="space-y-3">
          {/* Progress Overview & Filters - Responsive */}
          <div className="flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between gap-3">
            {/* Progress */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium">{completedCount}/{totalCount}</span>
              </div>
              <Progress value={progressPercentage} className="w-24 @md:w-32" />
            </div>

            {/* Filter Buttons - Responsive */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="flex-1 @md:flex-none"
              >
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className="flex-1 @md:flex-none"
              >
                Pending
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
                className="flex-1 @md:flex-none"
              >
                Completed
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" className="w-full @md:w-auto" disabled={isSaving}>
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="@sm:inline">Add </span>Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
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

          {/* Search and Sort - Responsive using container queries */}
          <div className="flex flex-col @md:flex-row items-stretch @md:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full @md:w-36">
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
                className="px-3"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tasks List/Grid - Scrollable Container */}
        <div className="flex-1 overflow-auto pr-1 @md:pr-2">
          <AnimatePresence mode="popLayout">
            {layout === 'card' ? (
              <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-3 @md:gap-4">
                {filteredTasks.map(renderTaskCard)}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task, index) => renderTaskList(task, index))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 @md:py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm @md:text-base">No tasks found</p>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
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
      </div>
    </BaseWidget>
  );
};

// OPTIMISTIC RENDERING: Tasks widget stores data in config, re-render only on data change
export const TasksWidgetRenderer = React.memo(
  TasksWidgetRendererComponent,
  (prevProps, nextProps) => {
    const prevConfig = prevProps.widget.config as any;
    const nextConfig = nextProps.widget.config as any;
    
    if (prevProps.widget.id !== nextProps.widget.id) {
      console.log('🔄 [TasksWidget] Re-render: widget ID changed');
      return false;
    }
    
    // Tasks data changed (stored in config.data.tasks)
    if (JSON.stringify(prevConfig?.data?.tasks) !== JSON.stringify(nextConfig?.data?.tasks)) {
      console.log('🔄 [TasksWidget] Re-render: tasks data changed');
      return false;
    }
    
    // Settings changed (filters, sorting)
    if (JSON.stringify(prevConfig?.settings) !== JSON.stringify(nextConfig?.settings)) {
      console.log('🔄 [TasksWidget] Re-render: settings changed');
      return false;
    }
    
    if (prevProps.isEditMode !== nextProps.isEditMode) {
      console.log('🔄 [TasksWidget] Re-render: edit mode changed');
      return false;
    }
    
    // Style-only change? Optimistic
    if (JSON.stringify(prevConfig?.style) !== JSON.stringify(nextConfig?.style)) {
      console.log('✨ [TasksWidget] Style-only change - optimistic');
      return false;
    }
    
    console.log('⚡ [TasksWidget] Props equal - SKIP re-render');
    return true;
  }
);

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
