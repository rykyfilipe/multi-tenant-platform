'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority?: 'low' | 'medium' | 'high';
}

export interface TasksConfig {
  title?: string;
  dataSource?: {
    type: 'manual';
    tasks?: Task[];
  };
  options?: {
    showCompleted?: boolean;
    maxTasks?: number;
    allowAdd?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
    showPriority?: boolean;
  };
}

interface TasksWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
  data?: any;
}

export function TasksWidget({ widget, isEditMode, onEdit, onDelete }: TasksWidgetProps) {
  const config = (widget.config || {}) as TasksConfig;
  const options = config.options || {};
  
  const [tasks, setTasks] = useState<Task[]>(config.dataSource?.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const addTask = () => {
    if (!newTaskText.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date(),
      priority: 'medium',
    };
    
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = () => {
    if (!editingText.trim()) return;
    
    setTasks(prev => 
      prev.map(task => 
        task.id === editingTaskId 
          ? { ...task, text: editingText.trim() }
          : task
      )
    );
    setEditingTaskId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    if (!options.showCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }
    
    if (options.maxTasks) {
      filtered = filtered.slice(0, options.maxTasks);
    }
    
    return filtered.sort((a, b) => {
      // Sort by completion status, then by creation date
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [tasks, options.showCompleted, options.maxTasks]);

  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading, error, refetch }) => (
        <BaseWidget
          widget={widget}
          isEditMode={isEditMode}
          onEdit={onEdit}
          onDelete={onDelete}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
          showRefresh={false}
        >
          <div className={getMinimalistStyles.contentStyle('space-y-4')}>
            {/* Header with stats */}
            <div className={getMinimalistStyles.layout.between}>
              <div>
                <h3 className={getMinimalistStyles.titleStyle('md')}>
                  {config.title || 'Tasks'}
                </h3>
                <p className={getMinimalistStyles.mutedStyle()}>
                  {completedCount} of {totalCount} completed
                </p>
              </div>
              {options.showPriority && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Add new task */}
            {options.allowAdd !== false && (
              <div className="flex space-x-2">
                <Input
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a new task..."
                  className={getMinimalistStyles.input.base}
                />
                <Button
                  onClick={addTask}
                  disabled={!newTaskText.trim()}
                  className={getMinimalistStyles.button.primary}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Tasks list */}
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className={getMinimalistStyles.mutedStyle()}>
                    {tasks.length === 0 ? 'No tasks yet' : 'All tasks completed!'}
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      task.completed 
                        ? 'bg-gray-50 border-gray-100' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <div className="flex space-x-2">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                            className={getMinimalistStyles.input.base}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            className={getMinimalistStyles.button.primary}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            className={getMinimalistStyles.button.ghost}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <p
                          className={`${
                            task.completed 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900'
                          } ${getMinimalistStyles.typography.sizes.base}`}
                        >
                          {task.text}
                        </p>
                      )}
                    </div>

                    {!task.completed && (options.allowEdit !== false || options.allowDelete !== false) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={getMinimalistStyles.button.icon}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {options.allowEdit !== false && (
                            <DropdownMenuItem onClick={() => startEdit(task)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {options.allowDelete !== false && (
                            <DropdownMenuItem 
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </BaseWidget>
      )}
    </WidgetDataProvider>
  );
}
