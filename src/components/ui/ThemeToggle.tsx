'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative group p-3 rounded-xl transition-all duration-500 ease-cyber",
        "bg-glass-bg backdrop-blur-xl border border-glass-border",
        "hover:shadow-elevated hover:scale-105 hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "transform-gpu"
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon Container */}
      <div className="relative z-10 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun 
          className={cn(
            "w-5 h-5 transition-all duration-500 ease-cyber",
            theme === 'light' 
              ? "text-amber-500 scale-100 rotate-0 opacity-100" 
              : "text-muted-foreground scale-75 rotate-90 opacity-0"
          )}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={cn(
            "absolute w-5 h-5 transition-all duration-500 ease-cyber",
            theme === 'dark' 
              ? "text-cyan-400 scale-100 rotate-0 opacity-100" 
              : "text-muted-foreground scale-75 -rotate-90 opacity-0"
          )}
        />
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Quantum Ripple Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 opacity-0 group-active:opacity-100 transition-opacity duration-200 scale-0 group-active:scale-150" />
    </button>
  );
}

// Premium Variant with Neural Pulse
export function ThemeToggleNeural() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative group p-4 rounded-2xl transition-all duration-500 ease-neural",
        "bg-card/80 backdrop-blur-xl border-2 border-primary/30",
        "hover:border-primary/60 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]",
        "hover:scale-110 hover:-translate-y-2",
        "focus:outline-none focus:ring-4 focus:ring-primary/20",
        "transform-gpu animate-neural-pulse"
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Neural Network Background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Icon with Enhanced Animation */}
      <div className="relative z-10 flex items-center justify-center">
        {theme === 'light' ? (
          <Sun className="w-6 h-6 text-amber-500 transition-all duration-700 ease-neural group-hover:rotate-180 group-hover:scale-125" />
        ) : (
          <Moon className="w-6 h-6 text-cyan-400 transition-all duration-700 ease-neural group-hover:-rotate-180 group-hover:scale-125" />
        )}
      </div>

      {/* Electric Particles Effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-2 bg-primary/60 rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-secondary/60 rounded-full animate-ping delay-100" />
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-accent/60 rounded-full animate-ping delay-200" />
      </div>

      {/* Quantum Field Effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 via-primary/10 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-sm" />
    </button>
  );
}

// Glassmorphism Variant
export function ThemeToggleGlass() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative group p-3 rounded-xl transition-all duration-300 ease-glass",
        "bg-glass-bg backdrop-blur-2xl border border-glass-border/50",
        "hover:bg-glass-bg/80 hover:border-glass-border hover:shadow-glass",
        "hover:scale-105 hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        "transform-gpu"
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Glass Reflection */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-amber-500 transition-all duration-300 ease-glass group-hover:scale-110" />
        ) : (
          <Moon className="w-5 h-5 text-cyan-400 transition-all duration-300 ease-glass group-hover:scale-110" />
        )}
      </div>

      {/* Subtle Glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
    </button>
  );
}