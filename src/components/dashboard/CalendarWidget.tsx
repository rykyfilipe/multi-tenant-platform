'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BaseWidget from './BaseWidget';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  duration?: number; // in minutes
  location?: string;
  color?: string;
  allDay?: boolean;
  createdAt: string;
}

export interface CalendarConfig {
  title?: string;
  viewMode?: 'month' | 'week' | 'day' | 'list';
  showWeekends?: boolean;
  startOfWeek?: 'sunday' | 'monday';
  maxEvents?: number;
  style?: {
    compactMode?: boolean;
    showTime?: boolean;
    showLocation?: boolean;
  };
}

interface CalendarWidgetProps {
  widget: {
    id: number | string;
    title?: string | null;
    type: string;
    config?: CalendarConfig;
  };
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CalendarWidget({ widget, isEditMode, onEdit, onDelete }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: 60,
    location: '',
    color: '#3B82F6',
    allDay: false
  });

  const config = (widget.config || {}) as CalendarConfig;
  const {
    viewMode = 'month',
    showWeekends = true,
    startOfWeek = 'monday',
    maxEvents = 100,
    style = {}
  } = config;

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem(`calendar_events_${widget.id}`);
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (error) {
        console.error('Error loading calendar events:', error);
      }
    }
  }, [widget.id]);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem(`calendar_events_${widget.id}`, JSON.stringify(events));
  }, [events, widget.id]);

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description || '',
      date: newEvent.date,
      time: newEvent.time || undefined,
      duration: newEvent.duration || 60,
      location: newEvent.location || '',
      color: newEvent.color || '#3B82F6',
      allDay: newEvent.allDay || false,
      createdAt: new Date().toISOString()
    };

    setEvents(prev => [...prev, event].slice(0, maxEvents));
    setNewEvent({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      duration: 60,
      location: '',
      color: '#3B82F6',
      allDay: false
    });
    setShowAddEvent(false);
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ));
    setEditingEvent(null);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getEventsForCurrentView = () => {
    const today = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderMonthView = () => {
    const today = new Date();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + (startOfWeek === 'monday' ? 1 : 0));
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const weekDays = startOfWeek === 'monday' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="h-full flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 className="text-sm sm:text-base font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-1">
            <Button size="sm" variant="outline" onClick={() => navigateMonth('prev')} className="h-6 w-6 p-0">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigateMonth('next')} className="h-6 w-6 p-0">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
          {weekDays.map(day => (
            <div key={day} className="text-xs text-center text-muted-foreground p-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 gap-1 min-h-0">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const dayEvents = getEventsForDate(day);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            if (!showWeekends && isWeekend) return null;

            return (
              <div
                key={index}
                className={`p-1 text-xs border rounded ${
                  isCurrentMonth ? 'bg-background' : 'bg-muted/20'
                } ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <div className={`text-center mb-1 ${isCurrentMonth ? 'font-medium' : 'text-muted-foreground'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, style.compactMode ? 1 : 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > (style.compactMode ? 1 : 2) && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - (style.compactMode ? 1 : 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const upcomingEvents = getEventsForCurrentView().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= new Date();
    });

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-sm sm:text-base font-semibold">Upcoming Events</h3>
          <Button size="sm" onClick={() => setShowAddEvent(true)} className="h-6 px-2">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No upcoming events</p>
            </div>
          ) : (
            upcomingEvents.map(event => (
              <Card key={event.id} className="p-2">
                <CardContent className="p-0">
                  <div className="flex items-start space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(event.date)}
                        {event.time && ` • ${formatTime(event.time)}`}
                        {event.location && (
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingEvent(event)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEvent(event.id)}
                        className="h-6 w-6 p-0 text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

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
        {viewMode === 'month' ? renderMonthView() : renderListView()}

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Add Event</h3>
                
                <Input
                  placeholder="Event title"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <Textarea
                  placeholder="Description (optional)"
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={newEvent.date || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  />
                  <Input
                    type="time"
                    value={newEvent.time || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                
                <Input
                  placeholder="Location (optional)"
                  value={newEvent.location || ''}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                />
                
                <div className="flex space-x-2">
                  <Button onClick={addEvent} className="flex-1">
                    Add Event
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddEvent(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
