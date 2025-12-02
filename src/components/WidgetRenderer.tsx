import { WidgetConfig, WeatherWidgetConfig, ClockWidgetConfig, TextWidgetConfig } from "@/types/widgets";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Clock } from "@/components/Clock";

interface WidgetRendererProps {
  widget: WidgetConfig;
  isPreview?: boolean;
}

export function WidgetRenderer({ widget, isPreview = false }: WidgetRendererProps) {
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${widget.x}%`,
    top: `${widget.y}%`,
    width: `${widget.width}%`,
    height: `${widget.height}%`,
    overflow: "hidden",
    transform: `rotate(${(widget as any).rotation || 0}deg)`,
    transformOrigin: "center center",
  };

  try {
    switch (widget.type) {
      case "weather": {
        const wConfig = widget as WeatherWidgetConfig;
        return (
          <div style={containerStyle} className="rounded-lg overflow-hidden">
            <WeatherWidget
              city={wConfig.config.city}
              latitude={wConfig.config.latitude}
              longitude={wConfig.config.longitude}
              className="w-full h-full"
            />
          </div>
        );
      }

      case "clock": {
        const cConfig = widget as ClockWidgetConfig;
        return (
          <div style={containerStyle} className="flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg">
            <Clock
              format={cConfig.config.format}
              showSeconds={cConfig.config.showSeconds}
              fontSize={cConfig.config.fontSize}
              timezone={cConfig.config.timezone}
            />
          </div>
        );
      }

      case "text": {
        const tConfig = widget as TextWidgetConfig;
        const fontSizeClass = {
          small: "text-sm",
          medium: "text-base",
          large: "text-2xl",
        }[tConfig.config.fontSize || "medium"];

        const alignClass = {
          left: "text-left",
          center: "text-center",
          right: "text-right",
        }[tConfig.config.alignment || "center"];

        return (
          <div
            style={{
              ...containerStyle,
              color: tConfig.config.color || "#ffffff",
            }}
            className={`flex items-center justify-center p-2 ${fontSizeClass} ${alignClass}`}
          >
            {tConfig.config.text}
          </div>
        );
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error rendering widget ${widget.id}:`, error);
    return null;
  }
}
