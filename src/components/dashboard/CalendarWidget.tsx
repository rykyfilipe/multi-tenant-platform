'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  color?: string;
}

export interface CalendarConfig {
  title?: string;
  dataSource?: {
    type: 'manual';
    events?: CalendarEvent[];
  };
  options?: {
    view: 'month' | 'week' | 'day';
    showWeekends: boolean;
    allowAdd: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
    maxEvents: number;
  };
}

interface CalendarWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
  data?: any;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWidget({ widget, isEditMode, onEdit, onDelete }: CalendarWidgetProps) {
  const config = (widget.config || {}) as CalendarConfig;
  const options = config.options || {
    view: 'month',
    showWeekends: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    maxEvents: 10,
  };

  const [events, setEvents] = useState<CalendarEvent[]>(config.dataSource?.events || []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '',
    location: '',
  });

  const addEvent = () => {
    if (!newEvent.title.trim() || !selectedDate) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      date: selectedDate,
      time: newEvent.time,
      location: newEvent.location.trim(),
      color: '#3b82f6',
    };

    setEvents(prev => [...prev, event]);
    setNewEvent({ title: '', description: '', time: '', location: '' });
    setIsAddingEvent(false);
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getTodaysEvents = () => {
    const today = new Date();
    return events
      .filter(event => event.date.toDateString() === today.toDateString())
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const days = getDaysInMonth(currentDate);
  const todaysEvents = getTodaysEvents();

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
            {/* Header */}
            <div className={getMinimalistStyles.layout.between}>
              <h3 className={getMinimalistStyles.titleStyle('md')}>
                {config.title || 'Calendar'}
              </h3>
              {options.allowAdd && (
                <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
                  <DialogTrigger asChild>
                    <Button className={getMinimalistStyles.button.primary}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className={getMinimalistStyles.subtitleStyle('block mb-1')}>
                          Title
                        </label>
                        <Input
                          value={newEvent.title}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Event title"
                          className={getMinimalistStyles.input.base}
                        />
                      </div>
                      <div>
                        <label className={getMinimalistStyles.subtitleStyle('block mb-1')}>
                          Description
                        </label>
                        <Textarea
                          value={newEvent.description}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Event description"
                          className={getMinimalistStyles.input.base}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={getMinimalistStyles.subtitleStyle('block mb-1')}>
                            Time
                          </label>
                          <Input
                            type="time"
                            value={newEvent.time}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                            className={getMinimalistStyles.input.base}
                          />
                        </div>
                        <div>
                          <label className={getMinimalistStyles.subtitleStyle('block mb-1')}>
                            Location
                          </label>
                          <Input
                            value={newEvent.location}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Event location"
                            className={getMinimalistStyles.input.base}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => setIsAddingEvent(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addEvent}
                          disabled={!newEvent.title.trim()}
                          className={getMinimalistStyles.button.primary}
                        >
                          Add Event
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Calendar Navigation */}
            <div className={getMinimalistStyles.layout.between}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className={getMinimalistStyles.button.icon}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h4 className={getMinimalistStyles.titleStyle('sm')}>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h4>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className={getMinimalistStyles.button.icon}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map(day => (
                  <div key={day} className="text-center py-2">
                    <span className={getMinimalistStyles.mutedStyle()}>{day}</span>
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-8" />;
                  }

                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();

                  return (
                    <button
                      key={day.getTime()}
                      onClick={() => setSelectedDate(day)}
                      className={`h-8 w-full rounded-lg text-sm transition-colors ${
                        isToday
                          ? 'bg-blue-100 text-blue-900 font-semibold'
                          : isSelected
                          ? 'bg-gray-100 text-gray-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{day.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <div className="w-1 h-1 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Events */}
            {todaysEvents.length > 0 && (
              <div className="space-y-2">
                <h5 className={getMinimalistStyles.subtitleStyle()}>Today's Events</h5>
                <div className="space-y-1">
                  {todaysEvents.slice(0, options.maxEvents).map(event => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <p className={getMinimalistStyles.textStyle()}>{event.title}</p>
                          {event.time && (
                            <p className={getMinimalistStyles.mutedStyle()}>{event.time}</p>
                          )}
                        </div>
                      </div>
                      {options.allowDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BaseWidget>
      )}
    </WidgetDataProvider>
  );
}
