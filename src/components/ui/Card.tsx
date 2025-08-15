import * as React from "react";
import { cn } from "@/lib/utils";

// Base Card Component
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl text-card-foreground shadow-glass",
      "transition-all duration-300 ease-cyber hover:shadow-elevated hover:scale-[1.01]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// Premium Glass Card
const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass-card group relative overflow-hidden",
      "bg-glass-bg backdrop-blur-2xl border border-glass-border",
      "hover:shadow-elevated hover:scale-[1.02] hover:-translate-y-1",
      "transition-all duration-500 ease-cyber",
      className
    )}
    {...props}
  >
    {/* Glass Reflection Effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {/* Subtle Glow on Hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
    
    {/* Content */}
    <div className="relative z-10">{props.children}</div>
  </div>
));
GlassCard.displayName = "GlassCard";

// Premium Holographic Card
const HolographicCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10",
      "border border-primary/30 backdrop-blur-2xl",
      "shadow-glass hover:shadow-elevated hover:scale-[1.02] hover:-translate-y-1",
      "transition-all duration-500 ease-cyber",
      className
    )}
    {...props}
  >
    {/* Holographic Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    {/* Holographic Pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(99,102,241,0.1)_50%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    
    {/* Electric Particles */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-2 left-2 w-1 h-1 bg-primary/60 rounded-full animate-ping" />
      <div className="absolute top-4 right-4 w-0.5 h-0.5 bg-secondary/60 rounded-full animate-ping delay-200" />
      <div className="absolute bottom-4 left-4 w-0.5 h-0.5 bg-accent/60 rounded-full animate-ping delay-400" />
    </div>
    
    {/* Content */}
    <div className="relative z-10">{props.children}</div>
  </div>
));
HolographicCard.displayName = "HolographicCard";

// Premium Quantum Card
const QuantumCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-card via-card/90 to-card/80",
      "border border-primary/20 backdrop-blur-2xl",
      "shadow-glass hover:shadow-premium hover:scale-[1.02] hover:-translate-y-1",
      "transition-all duration-700 ease-quantum",
      className
    )}
    {...props}
  >
    {/* Quantum Field Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    
    {/* Quantum Grid Pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,rgba(99,102,241,0.05)_50%),linear-gradient(0deg,transparent_50%,rgba(139,92,246,0.05)_50%)] bg-[length:12px_12px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    
    {/* Quantum Glow Effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-sm" />
    
    {/* Content */}
    <div className="relative z-10">{props.children}</div>
  </div>
));
QuantumCard.displayName = "QuantumCard";

// Premium Neural Card
const NeuralCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group relative overflow-hidden rounded-2xl",
      "bg-card/80 backdrop-blur-2xl border border-primary/30",
      "shadow-glass hover:shadow-elevated hover:scale-[1.02] hover:-translate-y-1",
      "transition-all duration-700 ease-neural animate-neural-pulse",
      className
    )}
    {...props}
  >
    {/* Neural Network Background */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    
    {/* Data Stream Lines */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
      <div className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-b from-transparent via-secondary to-transparent animate-pulse delay-300" />
      <div className="absolute top-1/2 left-0 w-0.5 h-0.5 bg-gradient-to-b from-transparent via-accent to-transparent animate-pulse delay-600" />
    </div>
    
    {/* Content */}
    <div className="relative z-10">{props.children}</div>
  </div>
));
NeuralCard.displayName = "NeuralCard";

// Card Header Component
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// Premium Card Header with Glass Effect
const PremiumCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 border-b border-border/20",
      "bg-gradient-to-r from-card/50 via-card/30 to-card/50",
      "backdrop-blur-sm",
      className
    )}
    {...props}
  />
));
PremiumCardHeader.displayName = "PremiumCardHeader";

// Card Title Component
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// Premium Card Title with Gradient
const PremiumCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight",
      "bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
));
PremiumCardTitle.displayName = "PremiumCardTitle";

// Card Description Component
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// Card Content Component
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Premium Card Content with Enhanced Spacing
const PremiumCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0 space-y-4",
      "bg-gradient-to-b from-transparent via-card/20 to-transparent",
      className
    )} 
    {...props} 
  />
));
PremiumCardContent.displayName = "PremiumCardContent";

// Card Footer Component
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Premium Card Footer with Glass Effect
const PremiumCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-6 pt-0",
      "border-t border-border/20 bg-card/30 backdrop-blur-sm",
      "rounded-b-2xl",
      className
    )}
    {...props}
  />
));
PremiumCardFooter.displayName = "PremiumCardFooter";

export {
  Card,
  GlassCard,
  HolographicCard,
  QuantumCard,
  NeuralCard,
  CardHeader,
  PremiumCardHeader,
  CardTitle,
  PremiumCardTitle,
  CardDescription,
  CardContent,
  PremiumCardContent,
  CardFooter,
  PremiumCardFooter,
};