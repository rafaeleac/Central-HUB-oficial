import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { WidgetConfig } from "@/types/widgets";
import { WidgetManager } from "@/components/WidgetManager";

interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: 0 | 90 | 180 | 270;
  timeline?: TimelineItem[];
}

interface TimelineItem {
  id: string;
  type: "file" | "layout";
  duration: number;
  file_id?: string;
  rotation?: 0 | 90 | 180 | 270;
}

interface LayoutData {
  template?: string;
  zones?: Zone[];
  timeline?: TimelineItem[];
  widgets?: WidgetConfig[];
  rotation?: 0 | 90 | 180 | 270;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: { id: string; name: string; layout_data: LayoutData } | null;
  onSuccess?: () => void;
}

export function LayoutEditor({ open, onOpenChange, layout, onSuccess }: Props) {
  const { toast } = useToast();
  const [localData, setLocalData] = useState<LayoutData>({
    zones: [],
    timeline: [],
    widgets: [],
  });
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [allowOverlap, setAllowOverlap] = useState<boolean>(false);

  useEffect(() => {
    if (layout && open) {
      setLocalData({
        zones: (layout.layout_data?.zones || []).map((z: any) => ({
          ...(z || {}),
          timeline: z?.timeline || [],
        })),
        timeline: layout.layout_data?.timeline || [],
        widgets: layout.layout_data?.widgets || [],
        template: layout.layout_data?.template,
        rotation: layout.layout_data?.rotation || 0,
      });
      setSelectedZoneIndex(null);
      setSelectedWidgetId(null);
    }
  }, [layout, open]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("id, name, file_url, file_type, duration")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setFiles(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const updateZone = (index: number, patch: Partial<Zone>) => {
    setLocalData((d) => ({
      ...d,
      zones: (d.zones || []).map((z, i) => (i === index ? { ...z, ...patch } : z)),
    }));
  };

  const rectsOverlap = (a: Zone, b: Zone) => {
    const ax1 = a.x;
    const ay1 = a.y;
    const ax2 = a.x + a.width;
    const ay2 = a.y + a.height;

    const bx1 = b.x;
    const by1 = b.y;
    const bx2 = b.x + b.width;
    const by2 = b.y + b.height;

    return !(ax2 <= bx1 || ax1 >= bx2 || ay2 <= by1 || ay1 >= by2);
  };

  const findNonOverlappingPosition = (width: number, height: number) => {
    const step = 5;
    const zones = localData.zones || [];
    for (let y = 0; y <= 100 - height; y += step) {
      for (let x = 0; x <= 100 - width; x += step) {
        const candidate: Zone = { id: "", x, y, width, height } as Zone;
        const overlapping = zones.some((z) => rectsOverlap(z, candidate));
        if (!overlapping) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  };

  const addZone = () => {
    const newZone: Zone = {
      id: String(Date.now()),
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      rotation: 0,
      timeline: [],
    };

    if (!allowOverlap) {
      const pos = findNonOverlappingPosition(newZone.width, newZone.height);
      newZone.x = pos.x;
      newZone.y = pos.y;
    }

    const updatedZones = [...(localData.zones || []), newZone];
    setLocalData((d) => ({ ...d, zones: updatedZones }));
    setSelectedZoneIndex(updatedZones.length - 1);
  };

  const removeZone = (index: number) => {
    setLocalData((d) => ({
      ...d,
      zones: (d.zones || []).filter((_, i) => i !== index),
    }));
    setSelectedZoneIndex(null);
  };

  const addTimelineFile = (fileId: string) => {
    // If a zone is selected, add the file to that zone's timeline
    if (selectedZoneIndex !== null && localData.zones?.[selectedZoneIndex]) {
      const item: TimelineItem = {
        id: String(Date.now()),
        type: "file",
        duration: 10,
        file_id: fileId,
        rotation: 0,
      };
      setLocalData((d) => {
        const zones = (d.zones || []).map((z, i) =>
          i === selectedZoneIndex
            ? { ...(z || {}), timeline: [...(z.timeline || []), item] }
            : z
        );
        return { ...d, zones };
      });
      return;
    }

    // fallback to global timeline
    const item: TimelineItem = {
      id: String(Date.now()),
      type: "file",
      duration: 10,
      file_id: fileId,
      rotation: 0,
    };
    setLocalData((d) => ({ ...d, timeline: [...(d.timeline || []), item] }));
  };

  const addTimelineFileToZone = (zoneIndex: number, fileId: string) => {
    const item: TimelineItem = {
      id: String(Date.now()),
      type: "file",
      duration: 10,
      file_id: fileId,
      rotation: 0,
    };
    setLocalData((d) => {
      const zones = (d.zones || []).map((z, i) =>
        i === zoneIndex ? { ...(z || {}), timeline: [...(z.timeline || []), item] } : z
      );
      return { ...d, zones };
    });
  };

  const setTimelineItemDuration = (index: number, duration: number) => {
    // If a zone is selected, modify that zone's timeline
    if (selectedZoneIndex !== null && localData.zones?.[selectedZoneIndex]) {
      setLocalData((d) => ({
        ...d,
        zones: (d.zones || []).map((z, i) =>
          i === selectedZoneIndex
            ? { ...(z || {}), timeline: (z.timeline || []).map((t, ii) => (ii === index ? { ...t, duration } : t)) }
            : z
        ),
      }));
      return;
    }

    setLocalData((d) => ({
      ...d,
      timeline: (d.timeline || []).map((t, i) => (i === index ? { ...t, duration } : t)),
    }));
  };

  const removeTimelineItem = (index: number) => {
    if (selectedZoneIndex !== null && localData.zones?.[selectedZoneIndex]) {
      setLocalData((d) => ({
        ...d,
        zones: (d.zones || []).map((z, i) =>
          i === selectedZoneIndex ? { ...(z || {}), timeline: (z.timeline || []).filter((_, ii) => ii !== index) } : z
        ),
      }));
      return;
    }

    setLocalData((d) => ({
      ...d,
      timeline: (d.timeline || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!layout) return;
    setSaving(true);
    try {
      const layoutDataToSave = {
        ...(localData || {}),
        zones: localData.zones || [],
        timeline: localData.timeline || [],
        widgets: localData.widgets || [],
      };

      const { error: updateError } = await supabase
        .from("layouts")
        .update({ layout_data: layoutDataToSave as any })
        .eq("id", layout.id);
      if (updateError) throw updateError;

      const { data: items, error: itemsErr } = await supabase
        .from("playlist_items")
        .select("playlist_id")
        .eq("layout_id", layout.id);
      if (itemsErr) throw itemsErr;

      const playlistIds = Array.from(
        new Set((items || []).map((it: any) => it.playlist_id))
      );

      if (playlistIds.length > 0) {
        const { error: screensErr } = await supabase
          .from("screens")
          .update({ updated_at: new Date().toISOString() })
          .in("current_playlist_id", playlistIds);
        if (screensErr) throw screensErr;
      }

      toast({
        title: "Sucesso",
        description: "Layout salvo e telas atualizadas.",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro",
        description: e.message || "Não foi possível salvar o layout.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Layout - {layout?.name}</DialogTitle>
          <DialogDescription>
            Edite zonas, timeline e widgets. Salve para aplicar nas telas vinculadas.
          </DialogDescription>
        </DialogHeader>
                <div className="flex items-center gap-4 px-4">
                  <label className="text-sm text-muted-foreground">Rotação do Layout:</label>
                  <select
                    value={(localData as any).rotation ?? 0}
                    onChange={(e) => setLocalData((d) => ({ ...(d || {}), rotation: Number(e.target.value) as 0 | 90 | 180 | 270 }))}
                    className="bg-background text-sm border rounded px-2 h-8"
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>

                  <label className="text-sm text-muted-foreground">Permitir Sobreposição</label>
                  <input
                    type="checkbox"
                    checked={allowOverlap}
                    onChange={(e) => setAllowOverlap(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
        <div className="grid grid-cols-4 gap-4">
          {/* Canvas Principal */}
          <div className="col-span-3 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Canvas</h3>
              <div className="aspect-video bg-black relative border border-border rounded-lg overflow-hidden">
                {/* Zonas */}
                {(localData.zones || []).map((z, i) => (
                  <div
                    key={z.id}
                    onClick={() => setSelectedZoneIndex(i)}
                    className={`absolute border-2 transition-colors ${
                      selectedZoneIndex === i
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50 bg-white/5"
                    } cursor-pointer`}
                    style={{
                      left: `${z.x}%`,
                      top: `${z.y}%`,
                      width: `${z.width}%`,
                      height: `${z.height}%`,
                      zIndex: i + 10,
                    }}
                  >
                    <div className="text-xs text-muted-foreground p-1">Zona {i + 1}</div>
                  </div>
                ))}

                {/* Widgets Preview */}
                {(localData.widgets || []).map((w) => (
                  <div
                    key={w.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWidgetId(w.id);
                      setSelectedZoneIndex(null);
                    }}
                    className={`absolute border ${
                      selectedWidgetId === w.id
                        ? "border-blue-500 border-2"
                        : "border-dashed border-blue-400/50"
                    } cursor-pointer bg-blue-500/5 overflow-hidden`}
                    style={{
                      left: `${w.x}%`,
                      top: `${w.y}%`,
                      width: `${w.width}%`,
                      height: `${w.height}%`,
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center text-xs text-blue-300">
                      {w.type === "weather" && "🌤️"}
                      {w.type === "clock" && "🕐"}
                      {w.type === "text" && "📝"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edição de Zona */}
            {selectedZoneIndex !== null && localData.zones?.[selectedZoneIndex] && (
              <div className="p-3 border border-border rounded-lg bg-muted/50 space-y-2">
                <h4 className="text-sm font-medium">Editar Zona {selectedZoneIndex + 1}</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">X (%)</label>
                    <Input
                      type="number"
                      value={localData.zones[selectedZoneIndex].x}
                      onChange={(e) =>
                        updateZone(selectedZoneIndex, { x: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Y (%)</label>
                    <Input
                      type="number"
                      value={localData.zones[selectedZoneIndex].y}
                      onChange={(e) =>
                        updateZone(selectedZoneIndex, { y: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Largura (%)</label>
                    <Input
                      type="number"
                      value={localData.zones[selectedZoneIndex].width}
                      onChange={(e) =>
                        updateZone(selectedZoneIndex, {
                          width: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Altura (%)</label>
                    <Input
                      type="number"
                      value={localData.zones[selectedZoneIndex].height}
                      onChange={(e) =>
                        updateZone(selectedZoneIndex, {
                          height: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Rotação (°)</label>
                    <select
                      value={(localData.zones[selectedZoneIndex].rotation || 0).toString()}
                      onChange={(e) =>
                        updateZone(selectedZoneIndex, { rotation: Number(e.target.value) as 0 | 90 | 180 | 270 })
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addZone}
                    variant="outline"
                  >
                    Adicionar Zona
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeZone(selectedZoneIndex)}
                  >
                    Remover Zona
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // bring forward (swap with next index)
                      if (selectedZoneIndex === null) return;
                      setLocalData((d) => {
                        const zones = [...(d.zones || [])];
                        const i = selectedZoneIndex;
                        if (i < zones.length - 1) {
                          const tmp = zones[i + 1];
                          zones[i + 1] = zones[i];
                          zones[i] = tmp;
                          setSelectedZoneIndex(i + 1);
                        }
                        return { ...d, zones };
                      });
                    }}
                  >
                    Trazer Frente
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (selectedZoneIndex === null) return;
                      setLocalData((d) => {
                        const zones = [...(d.zones || [])];
                        const i = selectedZoneIndex;
                        if (i > 0) {
                          const tmp = zones[i - 1];
                          zones[i - 1] = zones[i];
                          zones[i] = tmp;
                          setSelectedZoneIndex(i - 1);
                        }
                        return { ...d, zones };
                      });
                    }}
                  >
                    Enviar Fundo
                  </Button>
                </div>
              </div>
            )}

            {/* Timeline (zone-specific when a zone is selected) */}
            <div className="p-3 border border-border rounded-lg bg-muted/50 space-y-2">
              {selectedZoneIndex !== null && localData.zones?.[selectedZoneIndex] ? (
                <>
                  <h4 className="text-sm font-medium">Timeline - Zona {selectedZoneIndex + 1} ({(localData.zones[selectedZoneIndex].timeline || []).length} itens)</h4>
                  <div className="max-h-40 overflow-auto space-y-1">
                    {(localData.zones[selectedZoneIndex].timeline || []).map((t, i) => (
                      <div key={t.id} className="flex items-center gap-2 bg-background p-2 rounded text-xs">
                        <div className="flex-1 truncate">
                          {t.type === "file" && `📁 Arquivo`}
                        </div>
                        <Input
                          type="number"
                          min="1"
                          value={t.duration}
                          onChange={(e) => setTimelineItemDuration(i, Number(e.target.value))}
                          className="w-16 h-8"
                        />
                        <span className="text-xs text-muted-foreground">s</span>
                        <label className="text-xs ml-2">Rotação</label>
                        <select
                          value={(t.rotation ?? 0).toString()}
                          onChange={(e) => {
                            const rot = Number(e.target.value) as 0 | 90 | 180 | 270;
                            setLocalData((d) => ({
                              ...d,
                              zones: (d.zones || []).map((z, ii) =>
                                ii === selectedZoneIndex
                                  ? { ...(z || {}), timeline: (z.timeline || []).map((it, idx) => (idx === i ? { ...it, rotation: rot } : it)) }
                                  : z
                              ),
                            }));
                          }}
                          className="bg-background text-xs border rounded px-1"
                        >
                          <option value="0">0°</option>
                          <option value="90">90°</option>
                          <option value="180">180°</option>
                          <option value="270">270°</option>
                        </select>
                        <button
                          onClick={() => removeTimelineItem(i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-medium">Timeline Global ({localData.timeline?.length || 0} itens)</h4>
                  <div className="text-xs text-muted-foreground">Clique em uma zona para visualizar/editar a timeline específica dela. Você também pode adicionar arquivos globalmente abaixo.</div>
                </>
              )}
            </div>
          </div>

          {/* Painel Lateral */}
          <div className="col-span-1 space-y-4">
            {/* Adicionar Arquivo */}
            <div className="p-3 border border-border rounded-lg bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Arquivos</h4>
              <div className="max-h-48 overflow-auto space-y-1">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div className="text-xs flex-1 truncate">{f.name}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTimelineFile(f.id)}
                    >
                      +
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Manager */}
            <WidgetManager
              widgets={localData.widgets || []}
              selectedWidgetId={selectedWidgetId}
              onWidgetsChange={(widgets) =>
                setLocalData((d) => ({ ...d, widgets }))
              }
              onSelectWidget={setSelectedWidgetId}
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Layout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
