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
    <header className="w-full bg-gradient-to-r from-primary via-accent to-secondary p-6 rounded-2xl shadow-lg mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
            <AvatarImage src={swimmerPhotoUrl} alt={swimmerName} />
            <AvatarFallback className="bg-white text-primary">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <h1 className="text-3xl font-bold">Welcome, {swimmerName}! 🌊</h1>
            <p className="text-white/90 text-sm mt-1">
              Current Level: <span className="font-semibold">{currentLevel}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:block">
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
