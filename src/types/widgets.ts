// ===================================================================
// 📋 WIDGET SYSTEM TYPES AND CONFIGURATION
// ===================================================================
// 
// 🎯 RESPONSABILIDADE: Define o que pode ser adicionado ao canvas
// 
// 📝 O QUE ALTERAR AQUI:
//   - Adicionar novo tipo de widget (ex: "video", "rss", "calendar")
//   - Alterar propriedades de widgets existentes
//   - Mudar valores padrão (WIDGET_DEFAULTS)
// 
// 💡 COMO USAR:
//   1. Para adicionar novo widget, adicione à WidgetType union
//   2. Crie uma interface específica (ex: VideoWidgetConfig)
//   3. Adicione em WIDGET_DEFAULTS com valores padrão
//   4. Crie componente correspondente em src/components/
// 
// 🔗 CONECTA COM:
//   - WidgetManager.tsx (cria e edita widgets)
//   - WidgetPreview.tsx (renderiza widgets no canvas)
//   - LayoutEditor.tsx (salva widgets em layout_data)
// ===================================================================

// Lista de tipos de widgets suportados
// ⚠️ ALTERE AQUI para adicionar novo tipo (ex: "video", "rss")
export type WidgetType = "weather" | "clock" | "text";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  x: number; // percent (0-100)
  y: number; // percent (0-100)
  width: number; // percent (0-100)
  height: number; // percent (0-100)
  rotation?: 0 | 90 | 180 | 270; // Rotação em graus (nova propriedade)
  config: Record<string, any>; // Propriedades específicas do tipo
}

// ==================== WIDGET ESPECÍFICOS ====================

// Clima com informações meteorológicas
// ⚠️ ALTERE: config.city, showHumidity, showWind para customizar
export interface WeatherWidgetConfig extends WidgetConfig {
  type: "weather";
  config: {
    city: string; // Cidade para previsão
    latitude?: number; // Alternativa: latitude para precisão
    longitude?: number; // Alternativa: longitude
    showHumidity?: boolean; // Mostrar % umidade
    showWind?: boolean; // Mostrar velocidade vento
    fontSize?: "small" | "medium" | "large"; // Tamanho do texto
  };
}

// Relógio em tempo real
// ⚠️ ALTERE: format (12h/24h), showSeconds para customizar
export interface ClockWidgetConfig extends WidgetConfig {
  type: "clock";
  config: {
    format?: "12h" | "24h"; // Formato de hora
    showSeconds?: boolean; // Mostrar segundos
    fontSize?: "small" | "medium" | "large"; // Tamanho do texto
    timezone?: string; // Timezone IANA (ex: "America/Sao_Paulo")
  };
}

// Texto customizável com animações
// ⚠️ ALTERE: animation ("scroll-left"), animationSpeed para efeitos
export interface TextWidgetConfig extends WidgetConfig {
  type: "text";
  config: {
    text: string; // Conteúdo do texto
    fontSize?: "small" | "medium" | "large"; // Tamanho
    color?: string; // Cor (ex: "#ffffff", "red")
    alignment?: "left" | "center" | "right"; // Alinhamento
    animation?: "none" | "scroll-left"; // 🆕 Tipo de animação
    animationSpeed?: number; // Segundos para scroll completo
  };
}

// ==================== VALORES PADRÃO ====================
// 
// 🎯 Quando um novo widget é criado, usa estes valores
// 📝 ALTERE aqui para mudar defaults de novos widgets
// 
export const WIDGET_DEFAULTS: Record<WidgetType, Partial<WidgetConfig>> = {
  weather: {
    // Tamanho padrão: 25% largura × 30% altura
    width: 25,
    height: 30,
    rotation: 0, // Sem rotação padrão
    config: {
      city: "São Paulo", // 🔧 Altere para cidade padrão
      showHumidity: true,
      showWind: true,
      fontSize: "medium",
    },
  },
  clock: {
    // Tamanho padrão: 20% largura × 15% altura
    width: 20,
    height: 15,
    rotation: 0,
    config: {
      format: "24h", // 🔧 Mude para "12h" se preferir
      showSeconds: false,
      fontSize: "large",
    },
  },
  text: {
    // Tamanho padrão: 30% largura × 10% altura
    width: 30,
    height: 10,
    rotation: 0,
    config: {
      text: "Texto", // 🔧 Texto inicial
      fontSize: "medium",
      color: "#ffffff", // 🔧 Cor padrão (branco)
      alignment: "center",
      animation: "none", // 🔧 Mude para "scroll-left" para animar
      animationSpeed: 10, // Segundos
    },
  },
};

