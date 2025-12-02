import { useState } from "react";
import { WidgetConfig, WIDGET_DEFAULTS, WidgetType } from "@/types/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

interface Props {
  widgets: WidgetConfig[];
  selectedWidgetId: string | null;
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onSelectWidget: (id: string | null) => void;
}

export function WidgetManager({
  widgets,
  selectedWidgetId,
  onWidgetsChange,
  onSelectWidget,
}: Props) {
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>("weather");

  const addWidget = () => {
    const defaults = WIDGET_DEFAULTS[newWidgetType];
    const newWidget: WidgetConfig = {
      id: String(Date.now()),
      type: newWidgetType,
      x: defaults.x ?? 0,
      y: defaults.y ?? 0,
      width: defaults.width ?? 20,
      height: defaults.height ?? 20,
      rotation: (defaults as any).rotation ?? 0,
      config: defaults.config || {},
    };
    onWidgetsChange([...widgets, newWidget]);
    onSelectWidget(newWidget.id);
  };

  const removeWidget = (id: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== id));
    if (selectedWidgetId === id) onSelectWidget(null);
  };

  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    onWidgetsChange(
      widgets.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Adicionar Widget</h3>
        <div className="flex gap-2">
          <Select value={newWidgetType} onValueChange={(v) => setNewWidgetType(v as WidgetType)}>
            <option value="weather">Weather</option>
            <option value="clock">Clock</option>
            <option value="text">Text</option>
          </Select>
          <Button size="sm" onClick={addWidget}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Widgets ({widgets.length})</h3>
        <div className="max-h-40 overflow-auto space-y-1">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              onClick={() => onSelectWidget(widget.id)}
              className={`flex items-center justify-between p-2 rounded cursor-pointer border ${
                selectedWidgetId === widget.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <div className="text-sm flex-1">
                <div className="font-medium">{widget.type}</div>
                <div className="text-xs text-muted-foreground">
                  {widget.x.toFixed(0)}%, {widget.y.toFixed(0)}%
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(widget.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedWidget && (
        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/50">
          <h4 className="text-sm font-medium">Editar {selectedWidget.type}</h4>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">X (%)</label>
              <Input
                type="number"
                value={selectedWidget.x}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { x: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Y (%)</label>
              <Input
                type="number"
                value={selectedWidget.y}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { y: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Largura (%)</label>
              <Input
                type="number"
                value={selectedWidget.width}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { width: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Altura (%)</label>
              <Input
                type="number"
                value={selectedWidget.height}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { height: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Rotação (°)</label>
              <select
                value={(selectedWidget.rotation || 0).toString()}
                onChange={(e) =>
                  updateWidget(selectedWidget.id, { rotation: Number(e.target.value) as 0 | 90 | 180 | 270 })
                }
                className="w-full bg-background text-xs border rounded px-2 h-9"
              >
                <option value="0">0°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
                <option value="270">270°</option>
              </select>
            </div>
          </div>

          {selectedWidget.type === "weather" && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Cidade</label>
                <Input
                  value={selectedWidget.config.city || "São Paulo"}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...selectedWidget.config,
                        city: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedWidget.config.showHumidity !== false}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, {
                        config: {
                          ...selectedWidget.config,
                          showHumidity: e.target.checked,
                        },
                      })
                    }
                  />
                  Mostrar Umidade
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedWidget.config.showWind !== false}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, {
                        config: {
                          ...selectedWidget.config,
                          showWind: e.target.checked,
                        },
                      })
                    }
                  />
                  Mostrar Vento
                </label>
              </div>
            </div>
          )}

          {selectedWidget.type === "clock" && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Formato</label>
              <Select
                value={selectedWidget.config.format || "24h"}
                onValueChange={(v) =>
                  updateWidget(selectedWidget.id, {
                    config: { ...selectedWidget.config, format: v },
                  })
                }
              >
                <option value="24h">24h</option>
                <option value="12h">12h</option>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedWidget.config.showSeconds !== false}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: {
                        ...selectedWidget.config,
                        showSeconds: e.target.checked,
                      },
                    })
                  }
                />
                Mostrar Segundos
              </label>
            </div>
          )}

          {selectedWidget.type === "text" && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Texto</label>
                <Input
                  value={selectedWidget.config.text || ""}
                  onChange={(e) =>
                    updateWidget(selectedWidget.id, {
                      config: { ...selectedWidget.config, text: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cor</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedWidget.config.color || "#ffffff"}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, {
                        config: {
                          ...selectedWidget.config,
                          color: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    value={selectedWidget.config.color || "#ffffff"}
                    onChange={(e) =>
                      updateWidget(selectedWidget.id, {
                        config: {
                          ...selectedWidget.config,
                          color: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Tamanho da Fonte</label>
            <Select
              value={selectedWidget.config.fontSize || "medium"}
              onValueChange={(v) =>
                updateWidget(selectedWidget.id, {
                  config: { ...selectedWidget.config, fontSize: v },
                })
              }
            >
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
