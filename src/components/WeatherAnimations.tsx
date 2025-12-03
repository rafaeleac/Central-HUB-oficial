import React from "react";

// ===================================================================
// 🌤️ WEATHER ANIMATIONS COMPONENT
// ===================================================================
// 
// 🎯 RESPONSABILIDADE: Renderizar animações de clima em SVG
// 
// 📝 O QUE ALTERAR AQUI:
//   - Adicionar novo tipo de clima (ex: "fog", "hail")
//   - Modificar cores de fundo (gradientes)
//   - Ajustar velocidade de animações (@keyframes)
//   - Alterar elementos SVG (nuvens, chuva, raios)
// 
// 💡 COMO ADICIONAR NOVO CLIMA:
//   1. Adicione um novo case no switch() abaixo
//   2. Crie novo componente SVG (ex: FogAnimation)
//   3. Defina @keyframes com animações CSS
//   4. Retorne SVG com elementos animados
// 
// 🔗 USADO POR:
//   - WeatherWidget.tsx (renderiza fundo baseado em weather.main)
//   - LayoutEditorPreview.tsx (pode mostrar preview de clima)
// 
// ⚠️ NOTA: Tipos de clima vêm de OpenWeatherMap ou Open-Meteo
//    Exemplos: "Clear", "Clouds", "Rain", "Snow", "Thunderstorm"
// ===================================================================

interface WeatherAnimationsProps {
  weatherType: string; // Ex: "Clear", "Clouds", "Rain", "Snow", "Thunderstorm"
  className?: string; // Classes Tailwind adicionais
}

// 🎨 Componente principal que seleciona qual animação exibir
export const WeatherAnimations: React.FC<WeatherAnimationsProps> = ({
  weatherType,
  className = "",
}) => {
  // 🔧 ALTERE AQUI: Adicione novos tipos de clima
  // Para cada case, retorne o componente SVG correspondente
  switch (weatherType.toLowerCase()) {
    case "clear":
    case "sunny":
      return <ClearSkyAnimation className={className} />;
    case "clouds":
    case "cloudy":
      return <CloudyAnimation className={className} />;
    case "rain":
    case "drizzle":
      return <RainAnimation className={className} />;
    case "snow":
      return <SnowAnimation className={className} />;
    case "thunderstorm":
    case "mist":
    case "smoke":
    case "haze":
    case "dust":
    case "fog":
    case "sand":
    case "ash":
    case "squall":
    case "tornado":
      return <ThunderstormAnimation className={className} />;
    default:
      return <DefaultAnimation className={className} />;
  }
};

// ==================== ANIMAÇÕES ESPECÍFICAS ====================

// 🌞 CÉU ABERTO: Sol brilhante + nuvens leves
// 🔧 Para alterar:
//    - Cor do fundo: mude o gradient em style={{ background: ... }}
//    - Posição do sol: altere cx="400" cy="150"
//    - Velocidade: mude @keyframes sunRotate duration (8s)
const ClearSkyAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 600"
    className={`w-full h-full ${className}`}
    // 🎨 Gradient azul do céu (altere para outros azuis)
    style={{ background: "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)" }}
  >
    <defs>
      <style>{`
        @keyframes sunRotate {
          0% { transform: translateX(-100px); opacity: 0.7; }
          50% { transform: translateX(0px); opacity: 1; }
          100% { transform: translateX(100px); opacity: 0.7; }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(50px); }
        }
        .sun {
          animation: sunRotate 8s ease-in-out infinite;
        }
        .cloud {
          animation: cloudDrift 15s ease-in-out infinite;
        }
      `}</style>
    </defs>
    <circle className="sun" cx="400" cy="150" r="50" fill="#FFD700" />
    <g className="cloud" opacity="0.6">
      <ellipse cx="150" cy="100" rx="50" ry="30" fill="white" />
      <ellipse cx="200" cy="95" rx="60" ry="35" fill="white" />
      <ellipse cx="100" cy="95" rx="45" ry="28" fill="white" />
    </g>
    <g className="cloud" opacity="0.4" style={{ animationDelay: "5s" }}>
      <ellipse cx="650" cy="120" rx="55" ry="32" fill="white" />
      <ellipse cx="710" cy="115" rx="65" ry="38" fill="white" />
      <ellipse cx="590" cy="115" rx="50" ry="30" fill="white" />
    </g>
  </svg>
);

const CloudyAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 600"
    className={`w-full h-full ${className}`}
    style={{ background: "linear-gradient(180deg, #A9C5D6 0%, #D3E0E8 100%)" }}
  >
    <defs>
      <style>{`
        @keyframes cloudFloat {
          0% { transform: translateX(-100px); }
          50% { transform: translateX(50px); }
          100% { transform: translateX(-100px); }
        }
        .clouds {
          animation: cloudFloat 20s ease-in-out infinite;
        }
      `}</style>
    </defs>
    <g className="clouds">
      <ellipse cx="200" cy="150" rx="80" ry="50" fill="rgba(255,255,255,0.8)" />
      <ellipse cx="280" cy="140" rx="90" ry="55" fill="rgba(255,255,255,0.7)" />
      <ellipse cx="120" cy="140" rx="75" ry="48" fill="rgba(255,255,255,0.75)" />
    </g>
    <g className="clouds" style={{ animationDelay: "10s" }}>
      <ellipse cx="600" cy="100" rx="70" ry="45" fill="rgba(200,200,200,0.7)" />
      <ellipse cx="670" cy="95" rx="80" ry="50" fill="rgba(200,200,200,0.6)" />
      <ellipse cx="530" cy="95" rx="65" ry="42" fill="rgba(200,200,200,0.65)" />
    </g>
    <g className="clouds" style={{ animationDelay: "5s" }}>
      <ellipse cx="400" cy="300" rx="85" ry="52" fill="rgba(220,220,220,0.6)" />
      <ellipse cx="490" cy="290" rx="95" ry="57" fill="rgba(220,220,220,0.5)" />
      <ellipse cx="310" cy="290" rx="80" ry="50" fill="rgba(220,220,220,0.55)" />
    </g>
  </svg>
);

const RainAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 600"
    className={`w-full h-full ${className}`}
    style={{ background: "linear-gradient(180deg, #4A5F7F 0%, #6B7D93 100%)" }}
  >
    <defs>
      <style>{`
        @keyframes rainDrop {
          0% { transform: translateY(-50px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
        }
        .raindrops {
          animation: rainDrop 2s linear infinite;
        }
        @keyframes cloudMove {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(50px); }
        }
        .darkCloud {
          animation: cloudMove 15s ease-in-out infinite;
        }
      `}</style>
    </defs>
    <g className="darkCloud">
      <ellipse cx="200" cy="100" rx="80" ry="50" fill="rgba(100,100,120,0.9)" />
      <ellipse cx="280" cy="90" rx="90" ry="55" fill="rgba(100,100,120,0.85)" />
      <ellipse cx="120" cy="90" rx="75" ry="48" fill="rgba(100,100,120,0.9)" />
    </g>
    <g className="darkCloud" style={{ animationDelay: "8s" }}>
      <ellipse cx="600" cy="80" rx="70" ry="45" fill="rgba(80,80,100,0.8)" />
      <ellipse cx="670" cy="75" rx="80" ry="50" fill="rgba(80,80,100,0.75)" />
      <ellipse cx="530" cy="75" rx="65" ry="42" fill="rgba(80,80,100,0.8)" />
    </g>
    {/* Rain drops */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
      <line
        key={i}
        className="raindrops"
        x1={100 + i * 70}
        y1={200}
        x2={100 + i * 70}
        y2={230}
        stroke="rgba(200,220,255,0.6)"
        strokeWidth="3"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <line
        key={`bottom-${i}`}
        className="raindrops"
        x1={150 + i * 100}
        y1={400}
        x2={150 + i * 100}
        y2={430}
        stroke="rgba(200,220,255,0.4)"
        strokeWidth="2"
        style={{ animationDelay: `${i * 0.25 + 1}s` }}
      />
    ))}
  </svg>
);

const SnowAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 600"
    className={`w-full h-full ${className}`}
    style={{ background: "linear-gradient(180deg, #B8D4E8 0%, #E5EEF7 100%)" }}
  >
    <defs>
      <style>{`
        @keyframes snowFall {
          0% { transform: translateY(-50px) translateX(-30px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(600px) translateX(30px); opacity: 0; }
        }
        .snowflake {
          animation: snowFall 4s linear infinite;
        }
        @keyframes cloudDriftSnow {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(50px); }
        }
        .snowCloud {
          animation: cloudDriftSnow 15s ease-in-out infinite;
        }
      `}</style>
    </defs>
    <g className="snowCloud">
      <ellipse cx="200" cy="120" rx="80" ry="50" fill="rgba(200,210,220,0.85)" />
      <ellipse cx="280" cy="110" rx="90" ry="55" fill="rgba(200,210,220,0.8)" />
      <ellipse cx="120" cy="110" rx="75" ry="48" fill="rgba(200,210,220,0.85)" />
    </g>
    <g className="snowCloud" style={{ animationDelay: "8s" }}>
      <ellipse cx="600" cy="100" rx="70" ry="45" fill="rgba(180,190,210,0.7)" />
      <ellipse cx="670" cy="95" rx="80" ry="50" fill="rgba(180,190,210,0.65)" />
      <ellipse cx="530" cy="95" rx="65" ry="42" fill="rgba(180,190,210,0.7)" />
    </g>
    {/* Snowflakes */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
      <circle
        key={i}
        className="snowflake"
        cx={50 + (i * 50) % 700}
        cy={200}
        r="4"
        fill="white"
        opacity="0.8"
        style={{ animationDelay: `${i * 0.3}s` }}
      />
    ))}
  </svg>
);

const ThunderstormAnimation: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    viewBox="0 0 800 600"
    className={`w-full h-full ${className}`}
    style={{ background: "linear-gradient(180deg, #2C3E50 0%, #34495E 100%)" }}
  >
    <defs>
      <style>{`
        @keyframes lightning {
          0%, 10% { opacity: 0; }
          11% { opacity: 1; }
          15% { opacity: 0; }
          16% { opacity: 1; }
          20% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes rainDrop {
          0% { transform: translateY(-50px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
        }
        .lightning {
          animation: lightning 4s ease-in-out infinite;
        }
        .raindrops {
          animation: rainDrop 1.5s linear infinite;
        }
        @keyframes stormCloud {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(50px); }
        }
        .stormClouds {
          animation: stormCloud 15s ease-in-out infinite;
        }
      `}</style>
    </defs>
    {/* Storm Clouds */}
    <g className="stormClouds">
      <ellipse cx="200" cy="100" rx="90" ry="60" fill="rgba(40,40,60,0.95)" />
      <ellipse cx="300" cy="90" rx="100" ry="65" fill="rgba(40,40,60,0.9)" />
      <ellipse cx="100" cy="90" rx="85" ry="58" fill="rgba(40,40,60,0.95)" />
    </g>
    <g className="stormClouds" style={{ animationDelay: "8s" }}>
      <ellipse cx="600" cy="80" rx="80" ry="55" fill="rgba(30,30,50,0.85)" />
      <ellipse cx="700" cy="70" rx="90" ry="60" fill="rgba(30,30,50,0.8)" />
      <ellipse cx="500" cy="70" rx="75" ry="52" fill="rgba(30,30,50,0.85)" />
    </g>
    {/* Lightning */}
    <polyline
      className="lightning"
      points="250,150 280,250 260,350 300,450 280,550"
      stroke="#FFFF00"
      strokeWidth="3"
      fill="none"
      style={{ animationDelay: "0s", filter: "drop-shadow(0 0 10px #FFFF00)" }}
    />
    <polyline
      className="lightning"
      points="600,140 580,240 620,340 600,440 640,550"
      stroke="#FFFF00"
      strokeWidth="2"
      fill="none"
      style={{ animationDelay: "2s", filter: "drop-shadow(0 0 8px #FFFF00)" }}
    />
    {/* Rain drops */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
      <line
        key={i}
        className="raindrops"
        x1={50 + (i * 50) % 700}
        y1={200}
        x2={50 + (i * 50) % 700}
        y2={240}
        stroke="rgba(200,220,255,0.7)"
        strokeWidth="3"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </svg>
);

const DefaultAnimation: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 800 600"
    className={`w-full h-full ${className}`}
    style={{ background: "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)" }}
  >
    <defs>
      <style>{`
        @keyframes cloudFloat {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(100px); }
        }
        .clouds {
          animation: cloudFloat 20s ease-in-out infinite;
        }
      `}</style>
    </defs>
    <circle cx="400" cy="150" r="40" fill="#FFD700" opacity="0.7" />
    <g className="clouds">
      <ellipse cx="150" cy="100" rx="50" ry="30" fill="rgba(255,255,255,0.6)" />
      <ellipse cx="200" cy="95" rx="60" ry="35" fill="rgba(255,255,255,0.5)" />
      <ellipse cx="100" cy="95" rx="45" ry="28" fill="rgba(255,255,255,0.55)" />
    </g>
  </svg>
);
