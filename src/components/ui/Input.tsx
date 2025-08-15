import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'glass' | 'premium' | 'cyber' | 'neural';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant = 'default',
    size = 'default',
    leftIcon,
    rightIcon,
    error = false,
    success = false,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      "flex w-full rounded-xl border bg-transparent text-sm transition-all duration-300",
      "placeholder:text-muted-foreground/60",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transform-gpu"
    );

    const variantClasses = {
      default: cn(
        "border-border bg-card/80 backdrop-blur-sm",
        "hover:border-border/60 hover:bg-card/90",
        "focus:border-primary focus:bg-card/95 focus:shadow-lg",
        "hover:shadow-md focus:shadow-xl"
      ),
      glass: cn(
        "border-glass-border/50 bg-glass-bg backdrop-blur-2xl",
        "hover:border-glass-border hover:bg-glass-bg/80",
        "focus:border-primary/50 focus:bg-glass-bg/90 focus:shadow-glass",
        "hover:shadow-glass focus:shadow-elevated"
      ),
      premium: cn(
        "border-primary/30 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl",
        "hover:border-primary/50 hover:from-card/90 hover:via-card/70 hover:to-card/90",
        "focus:border-primary focus:from-card/95 focus:via-card/80 focus:to-card/95 focus:shadow-premium",
        "hover:shadow-elevated focus:shadow-premium"
      ),
      cyber: cn(
        "border-2 border-primary/30 bg-card/80 backdrop-blur-xl",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus:border-primary focus:bg-primary/10 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)]",
        "hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] focus:shadow-[0_0_25px_rgba(99,102,241,0.4)]"
      ),
      neural: cn(
        "border border-primary/30 bg-card/80 backdrop-blur-xl",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus:border-primary focus:bg-primary/10 focus:shadow-lg",
        "hover:shadow-md focus:shadow-xl animate-neural-pulse"
      )
    };

    const sizeClasses = {
      sm: "h-9 px-3 py-2 text-sm",
      default: "h-11 px-4 py-3 text-sm",
      lg: "h-12 px-5 py-4 text-base",
      xl: "h-14 px-6 py-5 text-lg"
    };

    const stateClasses = cn(
      error && "border-destructive/50 focus:border-destructive focus:ring-destructive/30",
      success && "border-success/50 focus:border-success focus:ring-success/30"
    );

    return (
      <div className="relative group">
        {/* Input Container */}
        <div className={cn(
          "relative flex items-center",
          leftIcon && "pl-4",
          rightIcon && "pr-4"
        )}>
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 z-10 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300">
              {leftIcon}
            </div>
          )}

          {/* Input Element */}
          <input
            type={type}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[size],
              stateClasses,
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 z-10 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Focus Glow Effect */}
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none",
          "group-focus-within:opacity-100",
          variant === 'cyber' && "bg-gradient-to-r from-primary/0 via-primary/10 to-secondary/0 blur-sm",
          variant === 'premium' && "bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 blur-sm",
          variant === 'neural' && "bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 blur-sm"
        )} />

        {/* Success/Error Indicators */}
        {success && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Premium Glass Input
export const GlassInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      variant="glass"
      className={cn(
        "group relative overflow-hidden",
        "backdrop-blur-2xl border border-glass-border/50",
        "hover:bg-glass-bg/80 hover:border-glass-border",
        "focus:bg-glass-bg/90 focus:border-primary/50",
        "transition-all duration-300 ease-glass",
        className
      )}
      {...props}
    />
  )
);
GlassInput.displayName = "GlassInput";

// Premium Cyber Input
export const CyberInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      variant="cyber"
      className={cn(
        "group relative overflow-hidden",
        "border-2 border-primary/30 bg-card/80 backdrop-blur-xl",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus:border-primary focus:bg-primary/10",
        "hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]",
        "focus:shadow-[0_0_25px_rgba(99,102,241,0.4)]",
        "transition-all duration-500 ease-cyber",
        className
      )}
      {...props}
    />
  )
);
CyberInput.displayName = "CyberInput";

// Premium Neural Input
export const NeuralInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      variant="neural"
      className={cn(
        "group relative overflow-hidden",
        "border border-primary/30 bg-card/80 backdrop-blur-xl",
        "hover:border-primary/50 hover:bg-primary/5",
        "focus:border-primary focus:bg-primary/10",
        "animate-neural-pulse",
        "transition-all duration-700 ease-neural",
        className
      )}
      {...props}
    />
  )
);
NeuralInput.displayName = "NeuralInput";

// Premium Holographic Input
export const HolographicInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      variant="premium"
      className={cn(
        "group relative overflow-hidden",
        "bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10",
        "border border-primary/30 backdrop-blur-2xl",
        "hover:from-primary/15 hover:via-secondary/15 hover:to-accent/15",
        "focus:from-primary/20 focus:via-secondary/20 focus:to-accent/20",
        "hover:border-primary/50 focus:border-primary",
        "transition-all duration-500 ease-cyber",
        className
      )}
      {...props}
    />
  )
);
HolographicInput.displayName = "HolographicInput";

export { Input };
export type { InputProps };