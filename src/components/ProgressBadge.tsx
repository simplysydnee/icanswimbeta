import { Droplets, LifeBuoy, Glasses, User, Waves } from "lucide-react";
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
    bgColor: "bg-slate-200/60",
    iconColor: "text-slate-600",
    activeColor: "from-slate-300 to-slate-100",
    description: "Water Readiness",
  },
  red: {
    name: "Red",
    icon: LifeBuoy,
    bgColor: "bg-red-200/60",
    iconColor: "text-red-600",
    activeColor: "from-red-500 to-rose-400",
    description: "Body Position",
  },
  yellow: {
    name: "Yellow",
    icon: Glasses,
    bgColor: "bg-yellow-200/60",
    iconColor: "text-yellow-600",
    activeColor: "from-yellow-400 to-amber-300",
    description: "Forward Movement",
  },
  green: {
    name: "Green",
    icon: User,
    bgColor: "bg-green-200/60",
    iconColor: "text-green-600",
    activeColor: "from-green-500 to-emerald-400",
    description: "Water Competency",
  },
  blue: {
    name: "Blue",
    icon: Waves,
    bgColor: "bg-blue-200/60",
    iconColor: "text-blue-600",
    activeColor: "from-blue-500 to-cyan-400",
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
          "rounded-full flex items-center justify-center transition-all duration-300 shadow-md",
          sizeClasses[size],
          isCompleted && `bg-gradient-to-br ${config.activeColor} shadow-lg scale-105`,
          isActive && !isCompleted && `bg-gradient-to-br ${config.activeColor} shadow-xl ring-4 ring-offset-2`,
          !isActive && !isCompleted && `${config.bgColor} border-2 border-white/40`
        )}
      >
        <Icon
          size={iconSizes[size]}
          className={cn(
            "transition-all",
            (isActive || isCompleted) ? "text-white drop-shadow-sm" : config.iconColor
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
