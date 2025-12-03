const TechBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradiente esmaecido */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 opacity-90" />

      {/* Grid de linhas horizontais */}
      <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Linhas verticais tech accent */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#ffdd00]/10 to-transparent opacity-30" />
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#ffdd00]/10 to-transparent opacity-30" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#ffdd00]/10 to-transparent opacity-30" />
    </div>
  );
};

export default TechBackground;
