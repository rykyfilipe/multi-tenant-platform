'use client';

import { useState, useEffect } from 'react';
import { Clock, Globe, Settings } from 'lucide-react';
import BaseWidget from './BaseWidget';

// CSS for flip clock effect
const flipClockStyles = `
  .flip-card {
    background-color: transparent;
    width: 60px;
    height: 80px;
    perspective: 1000px;
  }

  .flip-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }

  .flip-card:hover .flip-card-inner {
    transform: rotateY(180deg);
  }

  .flip-card-front, .flip-card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    background: linear-gradient(145deg, #f0f0f0, #cacaca);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  .flip-card-back {
    transform: rotateY(180deg);
    background: linear-gradient(145deg, #e0e0e0, #b8b8b8);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = flipClockStyles;
  document.head.appendChild(styleSheet);
}

export interface ClockConfig {
  title?: string;
  timezone?: string;
  format?: '12h' | '24h';
  showDate?: boolean;
  showSeconds?: boolean;
  showTimezone?: boolean;
  clockType?: 'digital' | 'analog' | 'flip' | 'binary' | 'world' | 'stopwatch' | 'timer' | 'countdown';
  style?: {
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    fontFamily?: 'mono' | 'sans' | 'serif';
    color?: string;
    backgroundColor?: string;
    theme?: 'light' | 'dark' | 'neon' | 'vintage' | 'minimal' | 'glass';
    size?: 'small' | 'medium' | 'large' | 'xl';
    layout?: 'vertical' | 'horizontal' | 'compact';
  };
}

interface ClockWidgetProps {
  widget: {
    id: number | string;
    title?: string | null;
    type: string;
    config?: ClockConfig;
  };
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ClockWidget({ widget, isEditMode, onEdit, onDelete }: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('');

  const config = (widget.config || {}) as ClockConfig;
  const {
    timezone: configTimezone = 'local',
    format = '24h',
    showDate = true,
    showSeconds = true,
    showTimezone = true,
    clockType = 'digital',
    style = {}
  } = config;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Set timezone
  useEffect(() => {
    if (configTimezone === 'local') {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } else {
      setTimezone(configTimezone);
    }
  }, [configTimezone]);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: configTimezone === 'local' ? undefined : configTimezone,
      hour12: format === '12h',
      hour: '2-digit',
      minute: '2-digit',
    };

    if (showSeconds) {
      options.second = '2-digit';
    }

    return date.toLocaleTimeString('en-US', options);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: configTimezone === 'local' ? undefined : configTimezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  };

  const getFontSizeClass = () => {
    const size = style.fontSize || '2xl';
    return `text-${size}`;
  };

  const getFontFamilyClass = () => {
    const family = style.fontFamily || 'mono';
    return `font-${family}`;
  };

  // Digital Clock Component
  const DigitalClock = () => {
    const timeDisplay = formatTime(currentTime);
    const dateDisplay = formatDate(currentTime);
    
    return (
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="font-bold">{timeDisplay}</span>
        </div>
        {showDate && (
          <div className="text-sm sm:text-base text-muted-foreground mb-2">
            {dateDisplay}
          </div>
        )}
        {showTimezone && timezone && (
          <div className="flex items-center justify-center space-x-1 text-xs sm:text-sm text-muted-foreground">
            <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{timezone}</span>
          </div>
        )}
      </div>
    );
  };

  // Analog Clock Component
  const AnalogClock = () => {
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    const hourAngle = (hours * 30) + (minutes * 0.5);
    const minuteAngle = minutes * 6;
    const secondAngle = seconds * 6;
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Clock face */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"/>
          
          {/* Hour marks */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30) - 90;
            const x1 = 50 + 40 * Math.cos(angle * Math.PI / 180);
            const y1 = 50 + 40 * Math.sin(angle * Math.PI / 180);
            const x2 = 50 + 35 * Math.cos(angle * Math.PI / 180);
            const y2 = 50 + 35 * Math.sin(angle * Math.PI / 180);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2"/>
            );
          })}
          
          {/* Hour hand */}
          <line
            x1="50" y1="50"
            x2={50 + 25 * Math.cos((hourAngle - 90) * Math.PI / 180)}
            y2={50 + 25 * Math.sin((hourAngle - 90) * Math.PI / 180)}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Minute hand */}
          <line
            x1="50" y1="50"
            x2={50 + 35 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
            y2={50 + 35 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Second hand */}
          <line
            x1="50" y1="50"
            x2={50 + 40 * Math.cos((secondAngle - 90) * Math.PI / 180)}
            y2={50 + 40 * Math.sin((secondAngle - 90) * Math.PI / 180)}
            stroke="red"
            strokeWidth="1"
            strokeLinecap="round"
          />
          
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="currentColor"/>
        </svg>
      </div>
    );
  };

  // Flip Clock Component
  const FlipClock = () => {
    const timeDisplay = formatTime(currentTime);
    const [hours, minutes, seconds] = timeDisplay.split(':');
    
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="flip-card">
          <div className="flip-card-inner">
            <div className="flip-card-front">{hours}</div>
            <div className="flip-card-back">{hours}</div>
          </div>
        </div>
        <span className="text-2xl font-bold">:</span>
        <div className="flip-card">
          <div className="flip-card-inner">
            <div className="flip-card-front">{minutes}</div>
            <div className="flip-card-back">{minutes}</div>
          </div>
        </div>
        {showSeconds && (
          <>
            <span className="text-2xl font-bold">:</span>
            <div className="flip-card">
              <div className="flip-card-inner">
                <div className="flip-card-front">{seconds}</div>
                <div className="flip-card-back">{seconds}</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Binary Clock Component
  const BinaryClock = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    const toBinary = (num: number, digits: number) => {
      return num.toString(2).padStart(digits, '0');
    };
    
    const hourBinary = toBinary(hours, 6);
    const minuteBinary = toBinary(minutes, 6);
    const secondBinary = toBinary(seconds, 6);
    
    return (
      <div className="text-center">
        <div className="mb-4">
          <div className="text-sm font-mono mb-2">Hours: {hours}</div>
          <div className="flex justify-center space-x-1">
            {hourBinary.split('').map((bit, i) => (
              <div key={i} className={`w-4 h-4 rounded ${bit === '1' ? 'bg-blue-500' : 'bg-gray-300'}`} />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <div className="text-sm font-mono mb-2">Minutes: {minutes}</div>
          <div className="flex justify-center space-x-1">
            {minuteBinary.split('').map((bit, i) => (
              <div key={i} className={`w-4 h-4 rounded ${bit === '1' ? 'bg-green-500' : 'bg-gray-300'}`} />
            ))}
          </div>
        </div>
        {showSeconds && (
          <div>
            <div className="text-sm font-mono mb-2">Seconds: {seconds}</div>
            <div className="flex justify-center space-x-1">
              {secondBinary.split('').map((bit, i) => (
                <div key={i} className={`w-4 h-4 rounded ${bit === '1' ? 'bg-red-500' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // World Clock Component
  const WorldClock = () => {
    const timezones = [
      { name: 'New York', tz: 'America/New_York' },
      { name: 'London', tz: 'Europe/London' },
      { name: 'Tokyo', tz: 'Asia/Tokyo' },
      { name: 'Sydney', tz: 'Australia/Sydney' }
    ];
    
    return (
      <div className="space-y-3">
        {timezones.map((tz) => {
          const time = new Date().toLocaleTimeString('en-US', {
            timeZone: tz.tz,
            hour12: format === '12h',
            hour: '2-digit',
            minute: '2-digit',
            second: showSeconds ? '2-digit' : undefined
          });
          
          return (
            <div key={tz.name} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <span className="font-medium">{tz.name}</span>
              <span className="font-mono">{time}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Stopwatch Component
  const Stopwatch = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRunning && startTime) {
        interval = setInterval(() => {
          setElapsed(Date.now() - startTime);
        }, 10);
      }
      return () => clearInterval(interval);
    }, [isRunning, startTime]);
    
    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const centiseconds = Math.floor((ms % 1000) / 10);
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    };
    
    const handleStart = () => {
      if (!isRunning) {
        setStartTime(Date.now() - elapsed);
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    };
    
    const handleReset = () => {
      setIsRunning(false);
      setElapsed(0);
      setStartTime(null);
    };
    
    return (
      <div className="text-center">
        <div className="text-3xl font-mono mb-4">{formatTime(elapsed)}</div>
        <div className="flex justify-center space-x-2">
          <button
            onClick={handleStart}
            className={`px-4 py-2 rounded ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
          >
            Reset
          </button>
        </div>
      </div>
    );
  };

  // Timer Component
  const Timer = () => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [inputMinutes, setInputMinutes] = useState(5);
    
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isRunning && timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      } else if (timeLeft === 0) {
        setIsRunning(false);
      }
      return () => clearInterval(interval);
    }, [isRunning, timeLeft]);
    
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const handleStart = () => {
      if (timeLeft === 0) {
        setTimeLeft(inputMinutes * 60);
      }
      setIsRunning(!isRunning);
    };
    
    const handleReset = () => {
      setIsRunning(false);
      setTimeLeft(inputMinutes * 60);
    };
    
    return (
      <div className="text-center">
        <div className="text-3xl font-mono mb-4">{formatTime(timeLeft)}</div>
        <div className="mb-4">
          <input
            type="number"
            value={inputMinutes}
            onChange={(e) => setInputMinutes(parseInt(e.target.value) || 0)}
            className="w-20 px-2 py-1 border rounded text-center"
            min="1"
            max="60"
          />
          <span className="ml-2 text-sm">minutes</span>
        </div>
        <div className="flex justify-center space-x-2">
          <button
            onClick={handleStart}
            className={`px-4 py-2 rounded ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
          >
            Reset
          </button>
        </div>
      </div>
    );
  };

  // Countdown Component
  const Countdown = () => {
    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    
    useEffect(() => {
      if (!targetDate) return;
      
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;
        
        if (distance < 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          clearInterval(interval);
          return;
        }
        
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }, [targetDate]);
    
    const handleSetDate = () => {
      const dateStr = prompt('Enter target date (YYYY-MM-DD HH:MM):');
      if (dateStr) {
        setTargetDate(new Date(dateStr));
      }
    };
    
    return (
      <div className="text-center">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
            <div className="text-2xl font-bold">{timeLeft.days}</div>
            <div className="text-xs">Days</div>
          </div>
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
            <div className="text-2xl font-bold">{timeLeft.hours}</div>
            <div className="text-xs">Hours</div>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
            <div className="text-2xl font-bold">{timeLeft.minutes}</div>
            <div className="text-xs">Minutes</div>
          </div>
          <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
            <div className="text-2xl font-bold">{timeLeft.seconds}</div>
            <div className="text-xs">Seconds</div>
          </div>
        </div>
        <button
          onClick={handleSetDate}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Set Target Date
        </button>
      </div>
    );
  };

  // Render the selected clock type
  const renderClockType = () => {
    switch (clockType) {
      case 'analog':
        return <AnalogClock />;
      case 'flip':
        return <FlipClock />;
      case 'binary':
        return <BinaryClock />;
      case 'world':
        return <WorldClock />;
      case 'stopwatch':
        return <Stopwatch />;
      case 'timer':
        return <Timer />;
      case 'countdown':
        return <Countdown />;
      default:
        return <DigitalClock />;
    }
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
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div 
          className={`${getFontSizeClass()} ${getFontFamilyClass()} text-center`}
          style={{ 
            color: style.color || 'inherit',
            backgroundColor: style.backgroundColor || 'transparent'
          }}
        >
          {renderClockType()}
        </div>

        {/* Configuration hint for edit mode */}
        {isEditMode && !config.timezone && (
          <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
            <div className="flex items-center space-x-1">
              <Settings className="h-3 w-3" />
              <span>Click edit to configure clock type and settings</span>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
