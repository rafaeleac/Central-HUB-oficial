import { useEffect, useState } from "react";

interface ClockProps {
  format?: "12h" | "24h";
  showSeconds?: boolean;
  fontSize?: "small" | "medium" | "large";
  timezone?: string;
}

export function Clock({ format = "24h", showSeconds = false, fontSize = "medium", timezone }: ClockProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = timezone ? new Date(new Date().toLocaleString("en-US", { timeZone: timezone })) : new Date();
      const timeStr = now.toLocaleTimeString("pt-BR", {
        hour12: format === "12h",
        hour: "2-digit",
        minute: "2-digit",
        second: showSeconds ? "2-digit" : undefined,
      });
      setTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [format, showSeconds, timezone]);

  const sizeClass = {
    small: "text-lg",
    medium: "text-3xl",
    large: "text-5xl",
  }[fontSize];

  return <div className={`${sizeClass} font-bold text-white`}>{time || "--:--"}</div>;
}
