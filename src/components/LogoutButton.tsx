import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export const LogoutButton = ({ 
  variant = "outline", 
  size = "sm",
  className = "",
  showText = true 
}: LogoutButtonProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      {showText && <span className="hidden sm:inline mr-2">Sign Out</span>}
      <LogOut className="h-4 w-4" />
    </Button>
  );
};
