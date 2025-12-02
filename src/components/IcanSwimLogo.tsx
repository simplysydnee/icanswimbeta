export default function IcanSwimLogo() {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Logo with gradient text */}
      <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight">
        I Can Swim
      </h1>

      {/* Optional decorative line */}
      <div className="w-24 h-1 bg-[#23a1c0] mx-auto mt-4"></div>
    </div>
  );
}