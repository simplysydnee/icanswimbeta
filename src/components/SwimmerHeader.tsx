import logo from "@/assets/logo.jpg";
import logoHeader from "@/assets/logo-header.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface SwimmerHeaderProps {
  swimmerName?: string;
  currentLevel?: string;
  swimmerPhotoUrl?: string;
}

export const SwimmerHeader = ({ 
  swimmerName = "Swimmer", 
  currentLevel = "Tadpole",
  swimmerPhotoUrl
}: SwimmerHeaderProps) => {
  return (
    <header className="w-full bg-gradient-to-r from-primary via-accent to-secondary p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg mb-6 sm:mb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 sm:border-4 border-white shadow-lg shrink-0">
            <AvatarImage src={swimmerPhotoUrl} alt={swimmerName} />
            <AvatarFallback className="bg-white text-primary">
              <User className="h-6 w-6 sm:h-8 sm:w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="text-white min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Welcome, {swimmerName}! 🌊</h1>
            <p className="text-white/90 text-xs sm:text-sm mt-1">
              Current Level: <span className="font-semibold">{currentLevel}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:block shrink-0">
          <img 
            src={logoHeader} 
            alt="I CAN SWIM" 
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>
    </header>
  );
};
