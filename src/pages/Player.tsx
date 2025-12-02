import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { WidgetRenderer } from "@/components/WidgetRenderer";

interface PlaylistItem {
  id: string;
  duration: number;
  file_id: string | null;
  layout_id: string | null;
  order_index: number;
  files: {
    file_url: string;
    file_type: string;
    name: string;
  } | null;
  layouts: {
    name: string;
    layout_data: any;
  } | null;
}

const Player = () => {
  const { screenCode } = useParams<{ screenCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [screenId, setScreenId] = useState<string | null>(null);

  // Busca a tela pelo código
  const fetchScreen = useCallback(async () => {
    if (!screenCode) {
      setError("Código da tela não fornecido");
      setLoading(false);
      return;
    }

    const { data: screen, error: screenError } = await supabase
      .from("screens")
      .select("id, current_playlist_id, status")
      .eq("code", screenCode)
      .single();

    if (screenError || !screen) {
      setError("Tela não encontrada");
      setLoading(false);
      return;
    }

    setScreenId(screen.id);

    // Atualiza status e last_seen
    await supabase
      .from("screens")
      .update({ 
        status: "online",
        last_seen: new Date().toISOString()
      })
      .eq("id", screen.id);

    if (!screen.current_playlist_id) {
      setError("Nenhuma playlist associada a esta tela");
      setLoading(false);
      return;
    }

    fetchPlaylistItems(screen.current_playlist_id);
  }, [screenCode]);

  // Busca os itens da playlist
  const fetchPlaylistItems = async (playlistId?: string | null) => {
    try {
      if (playlistId) {
        const { data, error } = await supabase
          .from("playlist_items")
          .select(`
            *,
            files (file_url, file_type, name),
            layouts (name, layout_data)
          `)
          .eq("playlist_id", playlistId)
          .order("order_index");

        if (error) throw error;

        setPlaylistItems(data || []);
        setLoading(false);
        return;
      }

      // Se não houver playlist associada, busca arquivos enviados à central
      const { data: filesData, error: filesError } = await supabase
        .from("files")
        .select("id, name, file_url, file_type, duration")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filesError) throw filesError;

      // Mapear arquivos para o formato de playlistItem esperado
      const items = (filesData || []).map((f: any, idx: number) => ({
        id: f.id,
        duration: f.duration || 10,
        file_id: f.id,
        layout_id: null,
        order_index: idx,
        files: {
          file_url: f.file_url,
          file_type: f.file_type,
          name: f.name,
        },
        layouts: null,
      }));

      setPlaylistItems(items);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar playlist/arquivos");
      setLoading(false);
    }
  };

  // Atualiza status da tela periodicamente
  useEffect(() => {
    if (!screenId) return;

    const interval = setInterval(() => {
      supabase
        .from("screens")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", screenId);
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [screenId]);

  // Rotação automática de conteúdo
  useEffect(() => {
    if (playlistItems.length === 0) return;

    const currentItem = playlistItems[currentItemIndex];
    const duration = (currentItem?.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentItemIndex((prev) => 
        prev + 1 >= playlistItems.length ? 0 : prev + 1
      );
    }, duration);

    return () => clearTimeout(timer);
  }, [currentItemIndex, playlistItems]);

  // Inicialização
  useEffect(() => {
    fetchScreen();
  }, [fetchScreen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Erro</h1>
          <p className="text-xl text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (playlistItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Aguardando Conteúdo</h1>
          <p className="text-xl text-gray-400">Nenhum item na playlist</p>
        </div>
      </div>
    );
  }

  const currentItem = playlistItems[currentItemIndex];

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden">
      {currentItem?.files && (
        <MediaPlayer
          fileUrl={currentItem.files.file_url}
          fileType={currentItem.files.file_type}
          fileName={currentItem.files.name}
        />
      )}
      {currentItem?.layouts && (
        <LayoutRenderer layoutData={currentItem.layouts.layout_data} />
      )}
    </div>
  );
};

// Componente para renderizar mídia (imagem/vídeo)
const MediaPlayer = ({ fileUrl, fileType, fileName }: { 
  fileUrl: string; 
  fileType: string;
  fileName: string;
}) => {
  // handle both mime types (e.g. image/png) and simple types stored as "image"/"video"
  const type = (fileType || "").toLowerCase();

  if (type === "image" || type.startsWith("image/")) {
    return (
      <img
        src={fileUrl}
        alt={fileName}
        className="max-w-full max-h-screen object-contain"
      />
    );
  }
  if (type === "video" || type.startsWith("video/")) {
    return (
      <video
        src={fileUrl}
        autoPlay
        muted
        loop
        className="max-w-full max-h-screen object-contain"
      />
    );
  }

  return (
    <div className="text-white text-center">
      <p className="text-2xl">Tipo de arquivo não suportado</p>
      <p className="text-gray-400">{fileType}</p>
    </div>
  );
};

// Componente para renderizar layout com widgets
const LayoutRenderer = ({ layoutData }: { layoutData: any }) => {
  return (
    <div className="w-full h-screen relative bg-black overflow-hidden">
      {/* Fundo do layout (zonas podem ser renderizadas aqui se necessário) */}
      <div className="w-full h-full">
        {/* Renderizar Widgets */}
        {layoutData?.widgets && layoutData.widgets.length > 0 && (
          <>
            {layoutData.widgets.map((widget: any) => (
              <WidgetRenderer key={widget.id} widget={widget} />
            ))}
          </>
        )}
      </div>

      {/* Informações de debug se não houver widgets */}
      {(!layoutData?.widgets || layoutData.widgets.length === 0) && (
        <div className="flex items-center justify-center h-full">
          <div className="text-white text-center space-y-4">
            <h2 className="text-4xl font-bold">Layout</h2>
            <p className="text-xl text-gray-400">
              Zonas: {layoutData?.zones?.length || 0}
            </p>
            <p className="text-sm text-gray-500">
              Widgets: {layoutData?.widgets?.length || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
