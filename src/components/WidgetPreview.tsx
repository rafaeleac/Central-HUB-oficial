import { WidgetConfig } from "@/types/widgets";
import { WeatherWidget } from "@/components/WeatherWidget";
import { Clock } from "@/components/Clock";
import { useState, useEffect } from "react";

interface Props {
  widget: WidgetConfig;
}

export function WidgetPreview({ widget }: Props) {
  const baseClasses = "absolute border border-dashed border-primary/50 bg-black/20 overflow-hidden flex items-center justify-center text-xs";

  const sizeClasses: Record<string, string> = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  const fontSizeKey = (widget.config as any).fontSize || "medium";
  const fontSize = typeof fontSizeKey === "string" && fontSizeKey in sizeClasses ? sizeClasses[fontSizeKey] : sizeClasses["medium"];

  switch (widget.type) {
    case "weather":
      return (
        <div
          className={`${baseClasses} ${fontSize}`}
          style={{
            left: `${widget.x}%`,
            top: `${widget.y}%`,
            width: `${widget.width}%`,
            height: `${widget.height}%`,
          }}
        >
          <div className="w-full h-full p-1">
            <WeatherWidget
              city={widget.config.city || "São Paulo"}
              latitude={widget.config.latitude}
              longitude={widget.config.longitude}
              className="w-full h-full text-xs"
              apiKey={import.meta.env.VITE_WEATHER_API_KEY}
            />
          </div>
        </div>
      );

    case "clock":
      return (
        <div
          className={`${baseClasses} ${fontSize}`}
          style={{
            left: `${widget.x}%`,
            top: `${widget.y}%`,
            width: `${widget.width}%`,
            height: `${widget.height}%`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Clock
              format={(widget.config as any).format || "24h"}
              showSeconds={(widget.config as any).showSeconds !== false}
              fontSize={fontSizeKey as "small" | "medium" | "large"}
            />
          </div>
        </div>
      );

    case "text":
      return (
        <div
          className={`${baseClasses} ${fontSize}`}
          style={{
            left: `${widget.x}%`,
            top: `${widget.y}%`,
            width: `${widget.width}%`,
            height: `${widget.height}%`,
            color: widget.config.color || "#ffffff",
            textAlign: widget.config.alignment || "center",
          }}
        >
          <div className="break-words p-1 font-semibold">
            {widget.config.text || "Texto"}
          </div>
        </div>
      );

    default:
      return (
        <div
          className={baseClasses}
          style={{
            left: `${widget.x}%`,
            top: `${widget.y}%`,
            width: `${widget.width}%`,
            height: `${widget.height}%`,
          }}
        >
          {widget.type}
        </div>
      );
  }
}
