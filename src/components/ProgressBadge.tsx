import { cn } from "@/lib/utils";
import whiteIcon from "@/assets/level-white.svg";
import redIcon from "@/assets/level-red.svg";
import yellowIcon from "@/assets/level-yellow.svg";
import greenIcon from "@/assets/level-green.svg";
import blueIcon from "@/assets/level-blue.svg";

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
    icon: whiteIcon,
    bgColor: "bg-slate-100",
    activeColor: "bg-slate-200",
    description: "Water Readiness",
  },
  red: {
    name: "Red",
    icon: redIcon,
    bgColor: "bg-red-100",
    activeColor: "bg-red-200",
    description: "Body Position",
  },
  yellow: {
    name: "Yellow",
    icon: yellowIcon,
    bgColor: "bg-yellow-100",
    activeColor: "bg-yellow-200",
    description: "Forward Movement",
  },
  green: {
    name: "Green",
    icon: greenIcon,
    bgColor: "bg-green-100",
    activeColor: "bg-green-200",
    description: "Water Competency",
  },
  blue: {
    name: "Blue",
    icon: blueIcon,
    bgColor: "bg-blue-100",
    activeColor: "bg-blue-200",
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
          "rounded-full flex items-center justify-center transition-all duration-300 p-2",
          sizeClasses[size],
          (isCompleted || isActive) ? config.activeColor : config.bgColor,
          isCompleted && "shadow-lg scale-105 ring-4 ring-primary/20",
          isActive && !isCompleted && "shadow-xl ring-4 ring-primary/40",
          !isActive && !isCompleted && "shadow-md opacity-70"
        )}
      >
        <img
          src={config.icon}
          alt={`${config.name} level`}
          className={cn(
            "w-full h-full object-contain transition-all",
            !isActive && !isCompleted && "opacity-60"
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
