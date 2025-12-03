const TechBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradiente suave para ambos os modos */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />

      {/* Linhas orgânicas SVG com Bézier curves */}
      <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" preserveAspectRatio="none">
        <defs>
          <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        
        {/* Linha 1: canto superior esquerdo para centro */}
        <path
          d="M 0 50 Q 200 100, 400 150 T 800 250"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          filter="url(#blur)"
        />
        
        {/* Linha 2: canto superior direito para centro */}
        <path
          d="M 100% 100 Q 800 200, 600 400 T 400 600"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          filter="url(#blur)"
        />
        
        {/* Linha 3: canto inferior esquerdo diagonal */}
        <path
          d="M 0 100% Q 300 600, 600 400 T 900 200"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          filter="url(#blur)"
        />
        
        {/* Linha 4: canto inferior direito para centro */}
        <path
          d="M 100% 100% Q 700 700, 500 400 T 200 100"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          filter="url(#blur)"
        />

        {/* Nós/pontos nas intersecções */}
        <circle cx="400" cy="150" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="600" cy="400" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="500" cy="400" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="200" cy="100" r="2" fill="currentColor" opacity="0.3" />
      </svg>

      {/* Acentos com amarelo em modo escuro */}
      <div className="absolute top-1/3 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-[#ffdd00]/5 to-transparent dark:via-[#ffdd00]/15 opacity-0 dark:opacity-100" />
      <div className="absolute bottom-1/3 right-1/3 w-px h-24 bg-gradient-to-b from-transparent via-[#ffdd00]/5 to-transparent dark:via-[#ffdd00]/15 opacity-0 dark:opacity-100" />
    </div>
  );
};

export default TechBackground;

