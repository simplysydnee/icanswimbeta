import { Fish, Waves, Star, Flame, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type SwimLevel = "tadpole" | "minnow" | "starfish" | "dolphin" | "shark";

interface ProgressBadgeProps {
  level: SwimLevel;
  isActive?: boolean;
  isCompleted?: boolean;
  size?: "sm" | "md" | "lg";
}

const levelConfig = {
  tadpole: {
    name: "Tadpole",
    icon: Waves,
    color: "from-blue-400 to-cyan-400",
    description: "Water Introduction",
  },
  minnow: {
    name: "Minnow",
    icon: Fish,
    color: "from-teal-400 to-emerald-400",
    description: "Basic Skills",
  },
  starfish: {
    name: "Starfish",
    icon: Star,
    color: "from-orange-400 to-yellow-400",
    description: "Floating & Balance",
  },
  dolphin: {
    name: "Dolphin",
    icon: Flame,
    color: "from-blue-500 to-indigo-500",
    description: "Swim Strokes",
  },
  shark: {
    name: "Shark",
    icon: Shield,
    color: "from-purple-500 to-pink-500",
    description: "Advanced Skills",
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
          isActive && !isCompleted && "bg-gradient-to-br from-primary to-accent animate-pulse shadow-xl",
          !isActive && !isCompleted && "bg-muted opacity-60"
        )}
      >
        <Icon
          size={iconSizes[size]}
          className={cn(
            "transition-all",
            (isActive || isCompleted) ? "text-white" : "text-muted-foreground"
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
