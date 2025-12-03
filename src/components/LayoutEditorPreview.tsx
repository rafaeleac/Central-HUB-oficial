import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WidgetConfig } from "@/types/widgets";
import { WidgetPreview } from "@/components/WidgetPreview";

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

interface Props {
  zones: Zone[];
  widgets: WidgetConfig[];
  selectedZoneIndex: number | null;
  onZoneSelect: (index: number) => void;
  onFileDropped?: (zoneIndex: number, fileId: string) => void;
}

export function LayoutEditorPreview({
  zones,
  widgets,
  selectedZoneIndex,
  onZoneSelect,
  onFileDropped,
}: Props) {
  const [filesMap, setFilesMap] = useState<Record<string, any>>({});

  useEffect(() => {
    // Fetch all unique file IDs from all zones' timelines
    const fileIds = new Set<string>();
    zones.forEach((z) => {
      (z.timeline || []).forEach((t) => {
        if (t.file_id) fileIds.add(t.file_id);
      });
    });

    if (fileIds.size === 0) return;

    (async () => {
      try {
        const { data } = await supabase
          .from("files")
          .select("id, file_url, file_type, name, duration")
          .in("id", Array.from(fileIds));
        const map: Record<string, any> = {};
        (data || []).forEach((f: any) => (map[f.id] = f));
        setFilesMap(map);
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, [zones]);

  return (
    <div className="w-full aspect-video bg-black relative border border-border rounded-lg overflow-hidden">
      {/* Zones with timeline playback */}
      {zones.map((zone, i) => {
        const currentItem = (zone.timeline || []).length > 0 ? (zone.timeline as TimelineItem[])[0] : null;
        const file = currentItem?.file_id ? filesMap[currentItem.file_id] : null;
        const isSelected = selectedZoneIndex === i;

        return (
          <div
            key={zone.id}
            onClick={() => onZoneSelect(i)}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.opacity = "0.7";
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.opacity = "1";
              const fileId = e.dataTransfer?.getData("fileId");
              if (fileId && onFileDropped) {
                onFileDropped(i, fileId);
              }
            }}
            className={`absolute border-2 transition-colors cursor-pointer ${
              isSelected ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50 bg-white/5"
            }`}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
              transform: `rotate(${zone.rotation || 0}deg)`,
              transformOrigin: "center center",
              zIndex: i + 10,
              overflow: "hidden",
            }}
          >
            {file ? (
              <img
                src={file.file_url}
                alt={file.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `rotate(${(currentItem as any)?.rotation || 0}deg)`,
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-xs text-muted-foreground text-center p-2">
                  Zona {i + 1}
                  <br />
                  {(zone.timeline || []).length > 0 ? `${(zone.timeline || []).length} itens` : "Vazia"}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Widgets overlay */}
      {widgets.map((w) => (
        <WidgetPreview key={w.id} widget={w} />
      ))}
    </div>
  );
}

