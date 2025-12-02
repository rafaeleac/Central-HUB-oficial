import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Zone {
  id: string;
  x: number; // percent
  y: number; // percent
  width: number; // percent
  height: number; // percent
}

interface TimelineItem {
  id: string;
  type: "file" | "layout";
  duration: number;
}

interface LayoutData {
  template?: string;
  zones?: Zone[];
  timeline?: TimelineItem[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: { id: string; name: string; layout_data: LayoutData } | null;
  onSuccess?: () => void;
}

export function LayoutEditor({ open, onOpenChange, layout, onSuccess }: Props) {
  const { toast } = useToast();
  const [localData, setLocalData] = useState<LayoutData>({ zones: [], timeline: [] });
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (layout) {
      setLocalData({
        zones: layout.layout_data?.zones || [],
        timeline: layout.layout_data?.timeline || [],
        template: layout.layout_data?.template,
      });
      setSelectedZoneIndex(null);
    }
  }, [layout]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.from("files").select("id, name, file_url, file_type, duration").order("created_at", { ascending: false }).limit(200);
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

  const addZone = () => {
    const newZone: Zone = { id: String(Date.now()), x: 0, y: 0, width: 50, height: 50 };
    setLocalData((d) => ({ ...d, zones: [...(d.zones || []), newZone] }));
    setSelectedZoneIndex((localData.zones || []).length);
  };

  const removeZone = (index: number) => {
    setLocalData((d) => ({ ...d, zones: (d.zones || []).filter((_, i) => i !== index) }));
    setSelectedZoneIndex(null);
  };

  const addTimelineFile = (fileId: string) => {
    const item: TimelineItem = { id: String(Date.now()), type: "file", duration: 10 };
    setLocalData((d) => ({ ...d, timeline: [...(d.timeline || []), { ...item, id: item.id, file_id: fileId } as any] }));
  };

  // Note: we keep timeline items simple (id,type,duration,file_id) in storage
  const setTimelineItemDuration = (index: number, duration: number) => {
    setLocalData((d) => ({
      ...d,
      timeline: (d.timeline || []).map((t, i) => (i === index ? { ...t, duration } : t)),
    }));
  };

  const handleSave = async () => {
    if (!layout) return;
    setSaving(true);
    try {
      const layoutDataToSave = { ...(localData || {}), zones: localData.zones || [], timeline: localData.timeline || [] };

      const { error: updateError } = await supabase.from("layouts").update({ layout_data: layoutDataToSave }).eq("id", layout.id);
      if (updateError) throw updateError;

      // Find playlists that reference this layout in playlist_items
      const { data: items, error: itemsErr } = await supabase.from("playlist_items").select("playlist_id").eq("layout_id", layout.id);
      if (itemsErr) throw itemsErr;

      const playlistIds = Array.from(new Set((items || []).map((it: any) => it.playlist_id)));

      if (playlistIds.length > 0) {
        // Update screens that currently have those playlists assigned so they can pick up changes
        const { error: screensErr } = await supabase.from("screens").update({ updated_at: new Date().toISOString() }).in("current_playlist_id", playlistIds);
        if (screensErr) throw screensErr;
      }

      toast({ title: "Sucesso", description: "Layout salvo e telas atualizadas." });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: e.message || "Não foi possível salvar o layout.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Editar Layout</DialogTitle>
        <DialogDescription>Edite zonas e timeline. Salve para aplicar nas telas vinculadas.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="aspect-video bg-black relative border border-border rounded-lg overflow-hidden">
            {(localData.zones || []).map((z, i) => (
              <div
                key={z.id}
                onClick={() => setSelectedZoneIndex(i)}
                className={`absolute border-2 ${selectedZoneIndex === i ? "border-primary" : "border-muted"} bg-white/5`}
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.width}%`,
                  height: `${z.height}%`,
                }}
              />
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Button onClick={addZone}>Adicionar Zona</Button>
              {selectedZoneIndex !== null && (
                <Button variant="destructive" onClick={() => removeZone(selectedZoneIndex)}>
                  Remover Zona
                </Button>
              )}
            </div>

            {selectedZoneIndex !== null && localData.zones && localData.zones[selectedZoneIndex] && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-muted-foreground">X (%)</label>
                  <Input
                    value={String(localData.zones[selectedZoneIndex].x)}
                    onChange={(e) => updateZone(selectedZoneIndex, { x: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Y (%)</label>
                  <Input
                    value={String(localData.zones[selectedZoneIndex].y)}
                    onChange={(e) => updateZone(selectedZoneIndex, { y: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Largura (%)</label>
                  <Input
                    value={String(localData.zones[selectedZoneIndex].width)}
                    onChange={(e) => updateZone(selectedZoneIndex, { width: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Altura (%)</label>
                  <Input
                    value={String(localData.zones[selectedZoneIndex].height)}
                    onChange={(e) => updateZone(selectedZoneIndex, { height: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Timeline</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {(localData.timeline || []).map((t, i) => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 text-sm">{t.type} - {t.id}</div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      value={String(t.duration || 10)}
                      onChange={(e) => setTimelineItemDuration(i, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium">Adicionar Arquivo</h4>
              <div className="space-y-2 max-h-48 overflow-auto">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="text-sm truncate">{f.name}</div>
                    <Button size="sm" onClick={() => addTimelineFile(f.id)}>
                      +
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Layout"}
        </Button>
      </div>
    </DialogContent>
  );
}
