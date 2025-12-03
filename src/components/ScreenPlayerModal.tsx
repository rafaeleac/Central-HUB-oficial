import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { WidgetRenderer } from "@/components/WidgetRenderer";

interface ScreenPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenName: string;
  screenCode: string;
  playlistId?: string | null;
}

interface ScreenPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenName: string;
  screenCode: string;
  playlistId?: string | null;
}

interface PlaylistItem {
  id: string;
  duration: number;
  file_id: string | null;
  layout_id: string | null;
  order_index: number;
  app_type?: string | null;
  app_config?: any | null;
  files: { file_url: string; file_type: string; name: string } | null;
  layouts: { name: string; layout_data: any } | null;
}

export const ScreenPlayerModal = ({
  open,
  onOpenChange,
  screenName,
  screenCode,
  playlistId,
}: ScreenPlayerModalProps) => {
  const [layoutData, setLayoutData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Buscar layout associado ao screenCode
  useEffect(() => {
    if (!open || !screenCode) return;

    const fetchLayout = async () => {
      setLoading(true);
      try {
        // 1. Buscar tela pelo código
        const { data: screen, error: screenErr } = await supabase
          .from("screens")
          .select("current_playlist_id")
          .eq("code", screenCode)
          .single();

        if (screenErr || !screen?.current_playlist_id) {
          setError("Nenhuma playlist associada a esta tela");
          setLoading(false);
          return;
        }

        // 2. Buscar items da playlist
        const { data: items, error: itemsErr } = await supabase
          .from("playlist_items")
          .select(`
            *,
            layouts (name, layout_data)
          `)
          .eq("playlist_id", screen.current_playlist_id)
          .order("order_index");

        if (itemsErr || !items?.length) {
          setError("Nenhum layout encontrado na playlist");
          setLoading(false);
          return;
        }

        // 3. Pegar primeiro layout encontrado
        const layoutItem = items.find((i: any) => i.layouts);
        if (!layoutItem?.layouts) {
          setError("Nenhum layout encontrado na playlist");
          setLoading(false);
          return;
        }

        setLayoutData(layoutItem.layouts.layout_data);
        setError(null);
      } catch (e: any) {
        setError("Erro ao carregar layout");
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [open, screenCode]);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-black border-neutral-800 h-[600px]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-black border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">{screenName}</DialogTitle>
          </DialogHeader>
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black border-neutral-800 p-0">
        <DialogHeader className="p-4 border-b border-neutral-800">
          <DialogTitle className="text-white">{screenName} - Preview</DialogTitle>
        </DialogHeader>

        <div
          ref={containerRef}
          className="w-full h-[600px] bg-black relative overflow-hidden"
        >
          {layoutData ? (
            <LayoutRenderer layoutData={layoutData} />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Nenhum layout configurado
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 text-white hover:bg-gray-700 z-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Componente para renderizar layout
const LayoutRenderer = ({ layoutData }: { layoutData: any }) => {
  const ZoneRenderer = ({ zone, layoutRotation }: { zone: any; layoutRotation?: number }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [filesMap, setFilesMap] = useState<Record<string, any>>({});

    useEffect(() => {
      const ids = (zone.timeline || [])
        .filter((it: any) => it.file_id)
        .map((it: any) => it.file_id);
      if (ids.length === 0) return;

        void supabase
        .from("files")
        .select("id, file_url, file_type, name, duration")
        .in("id", ids)
          .then(async ({ data }) => {
          const map: Record<string, any> = {};
          (data || []).forEach((f: any) => (map[f.id] = f));
          setFilesMap(map);
        })
          .catch((e: any) => console.error(e));
    }, [zone.timeline]);

    useEffect(() => {
      if (!zone.timeline || zone.timeline.length === 0) return;
      const cur = zone.timeline[currentIndex];
      const duration = (cur?.duration || 10) * 1000;
      const timer = setTimeout(() => {
        setCurrentIndex((p: number) =>
          p + 1 >= zone.timeline.length ? 0 : p + 1
        );
      }, duration);
      return () => clearTimeout(timer);
    }, [currentIndex, zone.timeline]);

    const current = (zone.timeline || [])[currentIndex];
    const file = current?.file_id ? filesMap[current.file_id] : null;

    const containerStyle: any = {
      left: `${zone.x}%`,
      top: `${zone.y}%`,
      width: `${zone.width}%`,
      height: `${zone.height}%`,
      position: "absolute",
      transform: `rotate(${layoutRotation || 0}deg) rotate(${zone.rotation || 0}deg) rotate(${current?.rotation || 0}deg)`,
      transformOrigin: "center center",
      overflow: "hidden",
    };

    return (
      <div
        style={containerStyle}
        className="bg-black flex items-center justify-center"
      >
        {file ? (
          <img
            src={file.file_url}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-sm">Zona (vazia)</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      {layoutData?.zones && layoutData.zones.length > 0 && (
        <>
          {layoutData.zones.map((z: any) => (
            <ZoneRenderer
              key={z.id}
              zone={z}
              layoutRotation={layoutData?.rotation}
            />
          ))}
        </>
      )}

      {layoutData?.widgets && layoutData.widgets.length > 0 && (
        <>
          {layoutData.widgets.map((widget: any) => (
            <WidgetRenderer key={widget.id} widget={widget} />
          ))}
        </>
      )}
    </div>
  );
};
