import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { WidgetConfig } from "@/types/widgets";
import { WidgetManager } from "@/components/WidgetManager";
import { LayoutEditorPreview } from "@/components/LayoutEditorPreview";

// ===================================================================
// 🎨 LAYOUT EDITOR - COMPONENTE PRINCIPAL DE EDIÇÃO
// ===================================================================
// 
// 🎯 RESPONSABILIDADE: Interface completa para editar layouts
//    - Criar/editar zonas (posição, tamanho, rotação)
//    - Gerenciar timeline por zona
//    - Adicionar widgets (clima, relógio, texto)
//    - Salvar em Supabase
// 
// 📝 O QUE ALTERAR AQUI:
//   1. Adicionar novos controles de zona (opacity, border, etc)
//   2. Modificar lógica de validação de zona
//   3. Alterar tempo de refresh de preview
//   4. Adicionar novos campos ao Zone interface
// 
// 💡 FLUXO DE DADOS:
//   1. Dialog abre com layout do Supabase
//   2. Usuario edita no canvas (LayoutEditorPreview)
//   3. Clica em zona para abrir Sheet lateral (showZoneEditSheet)
//   4. Salva: layout_data → Supabase → atualiza telas vinculadas
// 
// 🔗 CONECTA COM:
//   - LayoutEditorPreview.tsx (renderiza canvas em tempo real)
//   - WidgetManager.tsx (gerencia widgets)
//   - Supabase (salva layout_data)
// ===================================================================

interface Zone {
  id: string;
  x: number; // Posição horizontal em %
  y: number; // Posição vertical em %
  width: number; // Largura em %
  height: number; // Altura em %
  rotation?: 0 | 90 | 180 | 270; // Rotação da zona
  timeline?: TimelineItem[]; // Sequência de arquivos/layouts
}

interface TimelineItem {
  id: string;
  type: "file" | "layout";
  duration: number; // Segundos
  file_id?: string; // ID do arquivo
  rotation?: 0 | 90 | 180 | 270; // Rotação do item
}

interface LayoutData {
  template?: string;
  zones?: Zone[]; // Array de zonas do layout
  timeline?: TimelineItem[];
  widgets?: WidgetConfig[]; // Array de widgets (clima, relógio, etc)
  rotation?: 0 | 90 | 180 | 270; // Rotação global do layout
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
  const [files, setFiles] = useState<any[]>([]); // Lista de arquivos para arrastar
  const [saving, setSaving] = useState(false);
  const [allowOverlap, setAllowOverlap] = useState<boolean>(false); // Permitir sobreposição de zonas
  const [showZoneEditSheet, setShowZoneEditSheet] = useState(false); // 🆕 Sheet lateral de zona

  // Carrega layout quando dialog abre
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

  // Carrega lista de arquivos disponíveis para drag-drop
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

  // 🔧 Atualiza propriedades de uma zona específica
  // Uso: updateZone(0, { x: 10, y: 20 }) → muda zona 0 para x=10%, y=20%
  const updateZone = (index: number, patch: Partial<Zone>) => {
    setLocalData((d) => ({
      ...d,
      zones: (d.zones || []).map((z, i) => (i === index ? { ...z, ...patch } : z)),
    }));
  };

  // 🎯 Verifica se duas zonas se sobrepõem (usado em allowOverlap=false)
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

  // 📍 Encontra posição livre para nova zona (sem sobreposição)
  // Tenta 5% incrementos até encontrar espaço
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
    <>
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
              <h3 className="text-sm font-medium">Canvas (Preview Tempo Real)</h3>
              <LayoutEditorPreview
                zones={localData.zones || []}
                widgets={localData.widgets || []}
                selectedZoneIndex={selectedZoneIndex}
                onZoneSelect={setSelectedZoneIndex}
                onZoneClicked={() => setShowZoneEditSheet(true)}
                onFileDropped={(zoneIndex, fileId) => {
                  addTimelineFileToZone(zoneIndex, fileId);
                }}
              />
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
                  <div className="max-h-40 overflow-auto space-y-2">
                    {(localData.zones[selectedZoneIndex].timeline || []).map((t, i) => (
                      <div key={t.id} className="flex items-center gap-2 bg-background p-2 rounded text-xs border border-border">
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
                          className="bg-background text-xs border rounded px-1 h-8"
                        >
                          <option value="0">0°</option>
                          <option value="90">90°</option>
                          <option value="180">180°</option>
                          <option value="270">270°</option>
                        </select>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Replicate item
                            const newItem: TimelineItem = {
                              ...t,
                              id: String(Date.now()),
                            };
                            setLocalData((d) => ({
                              ...d,
                              zones: (d.zones || []).map((z, ii) =>
                                ii === selectedZoneIndex
                                  ? { ...(z || {}), timeline: [...(z.timeline || []), newItem] }
                                  : z
                              ),
                            }));
                          }}
                          title="Duplicar item"
                        >
                          📋
                        </Button>

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
                  <div className="text-xs text-muted-foreground">Clique em uma zona para visualizar/editar a timeline específica dela.</div>
                </>
              )}
            </div>
          </div>

          {/* Painel Lateral */}
          <div className="col-span-1 space-y-4">
            {/* Adicionar Arquivo */}
            <div className="p-3 border border-border rounded-lg bg-muted/50 space-y-2">
              <h4 className="text-sm font-medium">Arquivos (Arraste para zonas)</h4>
              <div className="max-h-48 overflow-auto space-y-1">
                {files.map((f) => (
                  <div
                    key={f.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer?.setData("fileId", f.id);
                    }}
                    className="flex items-center gap-2 p-2 bg-background border border-border rounded cursor-move hover:bg-muted transition-colors"
                  >
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
              <p className="text-xs text-muted-foreground">Dica: Arraste um arquivo até uma zona para adicioná-lo.</p>
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

    {/* Zone Edit Sheet (opened when clicking on zone preview) */}
    <Sheet open={showZoneEditSheet} onOpenChange={setShowZoneEditSheet}>
      <SheetContent side="right" className="w-[400px]">
        <SheetHeader>
          <SheetTitle>Editar Zona {selectedZoneIndex !== null ? selectedZoneIndex + 1 : ""}</SheetTitle>
          <SheetDescription>
            Edite propriedades da zona e timeline de itens.
          </SheetDescription>
        </SheetHeader>
        {selectedZoneIndex !== null && localData.zones?.[selectedZoneIndex] && (
          <div className="space-y-4 mt-6">
            {/* Position & Size */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Posição e Tamanho</h4>
              <div className="grid grid-cols-2 gap-2">
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
                      updateZone(selectedZoneIndex, { width: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Altura (%)</label>
                  <Input
                    type="number"
                    value={localData.zones[selectedZoneIndex].height}
                    onChange={(e) =>
                      updateZone(selectedZoneIndex, { height: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Rotação da Zona</label>
              <select
                value={(localData.zones[selectedZoneIndex].rotation || 0).toString()}
                onChange={(e) =>
                  updateZone(selectedZoneIndex, { rotation: Number(e.target.value) as 0 | 90 | 180 | 270 })
                }
                className="w-full bg-background text-sm border rounded px-2 h-9"
              >
                <option value="0">0°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
                <option value="270">270°</option>
              </select>
            </div>

            {/* Timeline Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Itens da Timeline ({(localData.zones[selectedZoneIndex].timeline || []).length})</h4>
              <div className="max-h-60 overflow-auto space-y-2 border rounded-lg p-2 bg-muted/30">
                {(localData.zones[selectedZoneIndex].timeline || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Arraste arquivos para adicionar itens</p>
                ) : (
                  (localData.zones[selectedZoneIndex].timeline || []).map((t, i) => (
                    <div key={t.id} className="flex items-center gap-2 bg-background p-2 rounded border border-border text-xs">
                      <div className="flex-1 truncate">Arquivo {i + 1}</div>
                      <Input
                        type="number"
                        min="1"
                        value={t.duration}
                        onChange={(e) => setTimelineItemDuration(i, Number(e.target.value))}
                        className="w-16 h-8 text-xs"
                      />
                      <span className="text-xs">s</span>
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
                        className="bg-background text-xs border rounded px-1 h-8"
                      >
                        <option value="0">0°</option>
                        <option value="90">90°</option>
                        <option value="180">180°</option>
                        <option value="270">270°</option>
                      </select>
                      <button
                        onClick={() => removeTimelineItem(i)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeZone(selectedZoneIndex)}
                className="flex-1"
              >
                Remover Zona
              </Button>
              <Button
                size="sm"
                onClick={() => setShowZoneEditSheet(false)}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
