import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1",
        destructive: "bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1",
        outline: "border border-border bg-card text-foreground shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 hover:bg-card/80",
        secondary: "bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1",
        ghost: "hover:bg-card/50 hover:shadow-lg hover:scale-105 hover:-translate-y-1",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Premium Tech Variants
        primary: "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:ring-2 focus:ring-primary/30",
        glass: "bg-glass-bg backdrop-blur-xl border border-glass-border text-foreground shadow-glass hover:shadow-elevated hover:scale-105 hover:-translate-y-1 focus:ring-2 focus:ring-primary/30",
        gradient: "bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 focus:ring-2 focus:ring-primary/30",
        cyber: "bg-card text-primary border-2 border-primary shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] focus:ring-2 focus:ring-primary/30",
        neural: "bg-card text-foreground shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 animate-neural-pulse focus:ring-2 focus:ring-primary/30",
        quantum: "bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] focus:ring-2 focus:ring-primary/30",
        electric: "bg-card text-primary border border-primary shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 hover:bg-primary hover:text-white focus:ring-2 focus:ring-primary/30",
        holographic: "bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 text-foreground border border-primary/30 backdrop-blur-xl shadow-glass hover:shadow-elevated hover:scale-105 hover:-translate-y-1 focus:ring-2 focus:ring-primary/30",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-3 py-2",
        lg: "h-12 rounded-2xl px-8 py-4 text-base",
        xl: "h-14 rounded-2xl px-10 py-5 text-lg",
        icon: "h-10 w-10",
      },
      loading: {
        true: "opacity-75 cursor-not-allowed",
        false: "",
      },
      shimmer: {
        true: "relative overflow-hidden",
        false: "",
      },
      glow: {
        true: "hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]",
        false: "",
      },
      pulse: {
        true: "animate-neural-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
      shimmer: false,
      glow: false,
      pulse: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  shimmer?: boolean;
  glow?: boolean;
  pulse?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false, 
    shimmer = false, 
    glow = false, 
    pulse = false,
    leftIcon, 
    rightIcon,
    asChild = false, 
    children, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ 
            variant, 
            size, 
            loading, 
            shimmer, 
            glow, 
            pulse 
          }), 
          className
        )}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {/* Shimmer Effect */}
        {shimmer && (
          <div className="absolute inset-0 -top-2 -bottom-2 -left-2 -right-2 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer" />
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}

        {/* Left Icon */}
        {leftIcon && !loading && (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        )}

        {/* Content */}
        <span className="relative z-10">{children}</span>

        {/* Right Icon */}
        {rightIcon && !loading && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Premium Button Variants with Enhanced Styling
export const PremiumButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      className={cn(
        "group relative overflow-hidden",
        "bg-gradient-to-r from-primary via-secondary to-accent",
        "text-white font-bold tracking-wide",
        "shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1",
        "focus:ring-4 focus:ring-primary/30",
        "transition-all duration-500 ease-cyber",
        className
      )}
      {...props}
    >
      {/* Quantum Field Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Electric Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-1 bg-white/60 rounded-full animate-ping" />
        <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-white/60 rounded-full animate-ping delay-100" />
        <div className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white/60 rounded-full animate-ping delay-200" />
      </div>

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </Button>
  )
);
PremiumButton.displayName = "PremiumButton";

// Glassmorphism Button
export const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="glass"
      className={cn(
        "group relative overflow-hidden",
        "backdrop-blur-2xl border border-glass-border/50",
        "hover:bg-glass-bg/80 hover:border-glass-border",
        "hover:shadow-elevated hover:scale-105 hover:-translate-y-1",
        "transition-all duration-300 ease-glass",
        className
      )}
      {...props}
    >
      {/* Glass Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </Button>
  )
);
GlassButton.displayName = "GlassButton";

// Cyber Tech Button
export const CyberButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="cyber"
      className={cn(
        "group relative overflow-hidden",
        "border-2 border-primary bg-card/80 backdrop-blur-xl",
        "hover:border-primary/60 hover:bg-primary/10",
        "hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]",
        "hover:scale-105 hover:-translate-y-1",
        "transition-all duration-500 ease-cyber",
        className
      )}
      {...props}
    >
      {/* Cyber Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(99,102,241,0.1)_50%),linear-gradient(0deg,transparent_50%,rgba(99,102,241,0.1)_50%)] bg-[length:8px_8px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Electric Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </Button>
  )
);
CyberButton.displayName = "CyberButton";

// Neural Network Button
export const NeuralButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button
      ref={ref}
      variant="neural"
      className={cn(
        "group relative overflow-hidden",
        "bg-card/80 backdrop-blur-xl border border-primary/30",
        "hover:border-primary/60 hover:bg-primary/10",
        "animate-neural-pulse",
        "hover:scale-110 hover:-translate-y-2",
        "transition-all duration-700 ease-neural",
        className
      )}
      {...props}
    >
      {/* Neural Network Connections */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      {/* Data Stream Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        <div className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-secondary to-transparent animate-pulse delay-300" />
      </div>
      
      {/* Content */}
      <span className="relative z-10">{children}</span>
    </Button>
  )
);
NeuralButton.displayName = "NeuralButton";

export { Button, buttonVariants };
export type { ButtonProps };