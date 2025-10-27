import { Droplets, Heart, Zap, Sparkles, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

export type SwimLevel = "white" | "red" | "yellow" | "green" | "blue";

interface ProgressBadgeProps {
  level: SwimLevel;
  isActive?: boolean;
  isCompleted?: boolean;
  size?: "sm" | "md" | "lg";
}

const levelConfig = {
  white: {
    name: "White",
    icon: Droplets,
    color: "from-slate-300 to-slate-100",
    textColor: "text-slate-700",
    description: "Water Readiness",
  },
  red: {
    name: "Red",
    icon: Heart,
    color: "from-red-500 to-rose-400",
    textColor: "text-white",
    description: "Body Position",
  },
  yellow: {
    name: "Yellow",
    icon: Zap,
    color: "from-yellow-400 to-amber-300",
    textColor: "text-amber-900",
    description: "Forward Movement",
  },
  green: {
    name: "Green",
    icon: Sparkles,
    color: "from-green-500 to-emerald-400",
    textColor: "text-white",
    description: "Water Competency",
  },
  blue: {
    name: "Blue",
    icon: Waves,
    color: "from-blue-500 to-cyan-400",
    textColor: "text-white",
    description: "Streamlines",
  },
};

export const ProgressBadge = ({ 
  level, 
  isActive = false, 
  isCompleted = false,
  size = "md" 
}: ProgressBadgeProps) => {
  const config = levelConfig[level];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300",
          sizeClasses[size],
          isCompleted && `bg-gradient-to-br ${config.color} shadow-lg scale-105`,
          isActive && !isCompleted && "bg-gradient-to-br from-primary to-accent shadow-xl ring-2 ring-primary/30",
          !isActive && !isCompleted && "bg-muted opacity-60"
        )}
      >
        <Icon
          size={iconSizes[size]}
          className={cn(
            "transition-all",
            (isActive || isCompleted) ? config.textColor : "text-muted-foreground"
          )}
        />
      </div>
      <div className="text-center">
        <p className={cn(
          "font-semibold",
          size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
          (isActive || isCompleted) ? "text-foreground" : "text-muted-foreground"
        )}>
          {config.name}
        </p>
        {size !== "sm" && (
          <p className="text-xs text-muted-foreground">{config.description}</p>
        )}
      </div>
    </div>
  );
};
