import logoReference from "@/assets/logo-reference.png";

interface SwimmerHeaderProps {
  swimmerName?: string;
  currentLevel?: string;
}

export const SwimmerHeader = ({ 
  swimmerName = "Swimmer", 
  currentLevel = "Tadpole" 
}: SwimmerHeaderProps) => {
  return (
    <header className="w-full bg-gradient-to-r from-primary via-accent to-secondary p-6 rounded-2xl shadow-lg mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-xl shadow-md">
            <img 
              src={logoReference} 
              alt="I CAN SWIM" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="text-white">
            <h1 className="text-3xl font-bold">Welcome, {swimmerName}! 🌊</h1>
            <p className="text-white/90 text-sm mt-1">
              Current Level: <span className="font-semibold">{currentLevel}</span>
            </p>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="text-right text-white/90 text-sm">
            <p className="font-semibold">I CAN SWIM</p>
            <p className="text-xs">Adaptive Swim Lessons</p>
          </div>
        </div>
      </div>
    </header>
  );
};
