import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useParentSwimmers } from "@/hooks/useParentSwimmers";

interface SwimmerSwitcherProps {
  currentSwimmerId?: string;
}

export const SwimmerSwitcher = ({ currentSwimmerId }: SwimmerSwitcherProps) => {
  const navigate = useNavigate();
  const { swimmers } = useParentSwimmers();

  const currentSwimmer = swimmers.find((s) => s.id === currentSwimmerId);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!currentSwimmer) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/parent-home")}
      >
        <Home className="h-4 w-4 mr-2" />
        Home
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentSwimmer.photo_url} />
            <AvatarFallback className="text-xs">
              {getInitials(currentSwimmer.first_name, currentSwimmer.last_name)}
            </AvatarFallback>
          </Avatar>
          <span>{currentSwimmer.first_name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Swimmer</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {swimmers.map((swimmer) => (
          <DropdownMenuItem
            key={swimmer.id}
            onClick={() => navigate(`/dashboard?swimmerId=${swimmer.id}`)}
            className="cursor-pointer"
          >
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={swimmer.photo_url} />
              <AvatarFallback className="text-xs">
                {getInitials(swimmer.first_name, swimmer.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">
                {swimmer.first_name} {swimmer.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {swimmer.current_level}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/parent-home")}
          className="cursor-pointer"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
