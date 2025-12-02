import { useState } from "react";
import { WidgetConfig, WidgetType, WIDGET_DEFAULTS, WeatherWidgetConfig, ClockWidgetConfig, TextWidgetConfig } from "@/types/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

interface WidgetsManagerProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  selectedWidgetId: string | null;
  onSelectedChange: (id: string | null) => void;
}

export function WidgetsManager({
  widgets,
  onWidgetsChange,
  selectedWidgetId,
  onSelectedChange,
}: WidgetsManagerProps) {
  const addWidget = (type: WidgetType) => {
    const defaults = WIDGET_DEFAULTS[type];
    const newWidget: WidgetConfig = {
      id: `${type}_${Date.now()}`,
      type,
      x: 5,
      y: 5,
      ...(defaults as any),
    };
    onWidgetsChange([...widgets, newWidget]);
    onSelectedChange(newWidget.id);
  };

  const removeWidget = (id: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== id));
    if (selectedWidgetId === id) onSelectedChange(null);
  };

  const updateWidget = (id: string, patch: Partial<WidgetConfig>) => {
    onWidgetsChange(
      widgets.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" onClick={() => addWidget("weather")} className="text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Weather
        </Button>
        <Button size="sm" onClick={() => addWidget("clock")} className="text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Clock
        </Button>
        <Button size="sm" onClick={() => addWidget("text")} className="text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Text
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Widgets ({widgets.length})</label>
        <div className="max-h-64 overflow-auto space-y-1">
          {widgets.map((w) => (
            <div
              key={w.id}
              onClick={() => onSelectedChange(w.id)}
              className={`p-2 rounded text-sm cursor-pointer border ${
                selectedWidgetId === w.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="capitalize font-medium">{w.type}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(w.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWidget && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium">Editar {selectedWidget.type}</h4>

          {/* Common properties */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">X (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(selectedWidget.x)}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { x: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Y (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(selectedWidget.y)}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { y: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">W (%)</label>
              <Input
                type="number"
                min={5}
                max={100}
                value={String(selectedWidget.width)}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { width: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">H (%)</label>
              <Input
                type="number"
                min={5}
                max={100}
                value={String(selectedWidget.height)}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { height: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Weather-specific */}
          {selectedWidget.type === "weather" && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Cidade</label>
                <Input
                  value={(selectedWidget as WeatherWidgetConfig).config.city || "São Paulo"}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...(selectedWidget as WeatherWidgetConfig).config,
                        city: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={(selectedWidget as WeatherWidgetConfig).config.showHumidity}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, {
                        config: {
                          ...(selectedWidget as WeatherWidgetConfig).config,
                          showHumidity: e.target.checked,
                        },
                      })
                    }
                  />
                  Umidade
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={(selectedWidget as WeatherWidgetConfig).config.showWind}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, {
                        config: {
                          ...(selectedWidget as WeatherWidgetConfig).config,
                          showWind: e.target.checked,
                        },
                      })
                    }
                  />
                  Vento
                </label>
              </div>
            </div>
          )}

          {/* Clock-specific */}
          {selectedWidget.type === "clock" && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Formato</label>
                <select
                  value={(selectedWidget as ClockWidgetConfig).config.format}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...(selectedWidget as ClockWidgetConfig).config,
                        format: e.target.value as "12h" | "24h",
                      },
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-input text-sm"
                >
                  <option value="24h">24h</option>
                  <option value="12h">12h</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={(selectedWidget as ClockWidgetConfig).config.showSeconds}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...(selectedWidget as ClockWidgetConfig).config,
                        showSeconds: e.target.checked,
                      },
                    })
                  }
                />
                Mostrar segundos
              </label>
            </div>
          )}

          {/* Text-specific */}
          {selectedWidget.type === "text" && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Texto</label>
                <Input
                  value={(selectedWidget as TextWidgetConfig).config.text}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...(selectedWidget as TextWidgetConfig).config,
                        text: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cor</label>
                <Input
                  type="color"
                  value={(selectedWidget as TextWidgetConfig).config.color || "#ffffff"}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...(selectedWidget as TextWidgetConfig).config,
                        color: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
