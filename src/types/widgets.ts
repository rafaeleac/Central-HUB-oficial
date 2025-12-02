// Widget system types and configuration
export type WidgetType = "weather" | "clock" | "text";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  x: number; // percent
  y: number; // percent
  width: number; // percent
  height: number; // percent
  rotation?: 0 | 90 | 180 | 270;
  config: Record<string, any>;
}

export interface WeatherWidgetConfig extends WidgetConfig {
  type: "weather";
  config: {
    city: string;
    latitude?: number;
    longitude?: number;
    showHumidity?: boolean;
    showWind?: boolean;
    fontSize?: "small" | "medium" | "large";
  };
}

export interface ClockWidgetConfig extends WidgetConfig {
  type: "clock";
  config: {
    format?: "12h" | "24h";
    showSeconds?: boolean;
    fontSize?: "small" | "medium" | "large";
    timezone?: string;
  };
}

export interface TextWidgetConfig extends WidgetConfig {
  type: "text";
  config: {
    text: string;
    fontSize?: "small" | "medium" | "large";
    color?: string;
    alignment?: "left" | "center" | "right";
  };
}

export const WIDGET_DEFAULTS: Record<WidgetType, Partial<WidgetConfig>> = {
  weather: {
    width: 25,
    height: 30,
    rotation: 0,
    config: {
      city: "São Paulo",
      showHumidity: true,
      showWind: true,
      fontSize: "medium",
    },
  },
  clock: {
    width: 20,
    height: 15,
    rotation: 0,
    config: {
      format: "24h",
      showSeconds: false,
      fontSize: "large",
    },
  },
  text: {
    width: 30,
    height: 10,
    rotation: 0,
    config: {
      text: "Texto",
      fontSize: "medium",
      color: "#ffffff",
      alignment: "center",
    },
  },
};
