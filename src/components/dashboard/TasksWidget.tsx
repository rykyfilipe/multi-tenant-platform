'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, Edit3, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import BaseWidget from './BaseWidget';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface TasksConfig {
  title?: string;
  showCompleted?: boolean;
  showPriority?: boolean;
  maxTasks?: number;
  sortBy?: 'created' | 'priority' | 'alphabetical';
  style?: {
    showDates?: boolean;
    compactMode?: boolean;
  };
}

interface TasksWidgetProps {
  widget: {
    id: number | string;
    title?: string | null;
    type: string;
    config?: TasksConfig;
  };
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TasksWidget({ widget, isEditMode, onEdit, onDelete }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const config = (widget.config || {}) as TasksConfig;
  const {
    showCompleted = true,
    showPriority = true,
    maxTasks = 50,
    sortBy = 'created',
    style = {}
  } = config;

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(`tasks_${widget.id}`);
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, [widget.id]);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem(`tasks_${widget.id}`, JSON.stringify(tasks));
  }, [tasks, widget.id]);

  const addTask = () => {
    if (!newTaskText.trim() || tasks.length >= maxTasks) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      priority: 'medium'
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined
          }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = () => {
    if (!editingText.trim()) return;

    setTasks(prev => prev.map(task => 
      task.id === editingTaskId 
        ? { ...task, text: editingText.trim() }
        : task
    ));
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const setPriority = (taskId: string, priority: 'low' | 'medium' | 'high') => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, priority } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort tasks based on configuration
  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority || 'medium'] || 0) - (priorityOrder[a.priority || 'medium'] || 0);
      case 'alphabetical':
        return a.text.localeCompare(b.text);
      case 'created':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const visibleTasks = showCompleted 
    ? sortedTasks 
    : sortedTasks.filter(task => !task.completed);

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={false}
      error={null}
    >
      <div className="h-full flex flex-col p-2 sm:p-3">
        {/* Add Task Input */}
        <div className="flex space-x-2 mb-3 flex-shrink-0">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="text-xs sm:text-sm"
            disabled={tasks.length >= maxTasks}
          />
          <Button 
            onClick={addTask} 
            size="sm"
            disabled={!newTaskText.trim() || tasks.length >= maxTasks}
            className="px-2 sm:px-3"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Task Stats */}
        {totalCount > 0 && (
          <div className="text-xs text-muted-foreground mb-2 flex-shrink-0">
            {completedCount}/{totalCount} completed
            {tasks.length >= maxTasks && (
              <span className="text-red-500 ml-2">(Max reached)</span>
            )}
          </div>
        )}

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {visibleTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <CheckSquare className="h-8 w-8 sm:h-12 sm:w-12 mb-2 opacity-50" />
              <p className="text-xs sm:text-sm text-center">
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks to show'}
              </p>
              {!showCompleted && completedCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {completedCount} completed task{completedCount !== 1 ? 's' : ''} hidden
                </p>
              )}
            </div>
          ) : (
            visibleTasks.map((task) => (
              <Card key={task.id} className={`p-2 ${task.completed ? 'opacity-60' : ''}`}>
                <CardContent className="p-0">
                  <div className="flex items-start space-x-2">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckSquare className="h-4 w-4 text-green-500" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <div className="flex space-x-1">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                            className="text-xs sm:text-sm h-6"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit} className="h-6 px-2">
                            ✓
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-6 px-2">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className={`text-xs sm:text-sm ${task.completed ? 'line-through' : ''}`}>
                            {task.text}
                          </div>
                          
                          {/* Task Meta */}
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {showPriority && (
                              <div className="flex items-center space-x-1">
                                <span 
                                  className={`cursor-pointer ${getPriorityColor(task.priority || 'medium')}`}
                                  onClick={() => {
                                    const priorities = ['low', 'medium', 'high'] as const;
                                    const currentIndex = priorities.indexOf(task.priority || 'medium');
                                    const nextIndex = (currentIndex + 1) % priorities.length;
                                    setPriority(task.id, priorities[nextIndex]);
                                  }}
                                >
                                  {getPriorityIcon(task.priority || 'medium')}
                                </span>
                              </div>
                            )}
                            
                            {style.showDates && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(task.createdAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!task.completed && editingTaskId !== task.id && (
                      <div className="flex space-x-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(task)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTask(task.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
