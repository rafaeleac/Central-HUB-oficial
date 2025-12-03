import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Trash2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreateScreenDialog } from "@/components/CreateScreenDialog";
import { ScreenPlayerModal } from "@/components/ScreenPlayerModal";
import ScreenDetailsDialog from "@/components/ScreenDetailsDialog";
import StepIndicator from "@/components/StepIndicator";
import TechBackground from "@/components/TechBackground";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Screen {
  id: string;
  name: string;
  subtitle?: string | null;
  code: string;
  location: string | null;
  address?: string | null;
  status: string;
  last_seen: string | null;
  current_layout_id?: string | null;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
}

interface Layout {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
}

const Telas = () => {
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedScreenForDetails, setSelectedScreenForDetails] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedScreenForPlayer, setSelectedScreenForPlayer] = useState<Screen | null>(null);
  const [editingScreen, setEditingScreen] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const steps = [
    { number: 1, label: "Dashboard", description: "Início" },
    { number: 2, label: "Arquivos", description: "Upload" },
    { number: 3, label: "Playlists", description: "Organizar" },
    { number: 4, label: "Layouts", description: "Design" },
    { number: 5, label: "Telas", description: "Reproduzir" },
  ];

  useEffect(() => {
    fetchScreens();
    fetchPlaylists();
    fetchLayouts();
  }, []);

  // Polling periódico para verificar status de telas (a cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScreens();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("layouts")
        .select("id, name, orientation")
        .order("name");

      if (error) throw error;
      setLayouts(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar layouts:", error);
    }
  };

  const fetchScreens = async () => {
    try {
      const { data, error } = await supabase
        .from("screens")
        .select("id, name, subtitle, code, location, address, status, last_seen, current_layout_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const screensData = data || [];
      setScreens(screensData);

      // Buscar últimos device_status para essas telas
      const ids = screensData.map((s: any) => s.id);
      if (ids.length) {
        const { data: statuses } = await supabase
          .from("device_status")
          .select("*")
          .in("screen_id", ids)
          .order("last_seen", { ascending: false });

        const map: Record<string, any> = {};
        (statuses || []).forEach((st: any) => {
          if (!map[st.screen_id]) map[st.screen_id] = st;
        });
        setDeviceStatuses(map);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as telas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar playlists:", error);
    }
  };

  const updateScreenLayout = async (screenId: string, layoutId: string | null) => {
    try {
      const { error } = await supabase
        .from("screens")
        .update({ current_layout_id: layoutId })
        .eq("id", screenId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: layoutId
          ? "Layout associado à tela com sucesso!"
          : "Layout desassociado da tela.",
      });

      fetchScreens();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o layout da tela.",
        variant: "destructive",
      });
    }
  };

  const getLayoutOrientation = (layoutId: string | null) => {
    if (!layoutId) return "landscape";
    const layout = layouts.find((l) => l.id === layoutId);
    return layout?.orientation || "landscape";
  };

  const saveScreenEdits = async (screenId: string) => {
    const values = editedValues[screenId] || {};
    try {
      const { error } = await supabase.from("screens").update(values).eq("id", screenId);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Informações atualizadas." });
      setEditingScreen(null);
      setEditedValues((p) => {
        const copy = { ...p };
        delete copy[screenId];
        return copy;
      });
      fetchScreens();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Não foi possível salvar." , variant: "destructive" });
    }
  };

  const openPlayer = (screen: Screen) => {
    setSelectedScreenForPlayer(screen);
    setPlayerOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedScreen) return;

    try {
      const { error } = await supabase
        .from("screens")
        .delete()
        .eq("id", selectedScreen);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tela excluída com sucesso!",
      });

      fetchScreens();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a tela.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedScreen(null);
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      <TechBackground />

      <div className="relative z-10 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Etapa 5: Telas</h1>
            <p className="text-gray-600 dark:text-[#ffdd00]">Gerencie suas telas de exibição</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Parear Tela
          </Button>
        </div>
      </div>

      <div className="relative z-10 pointer-events-auto">
        <StepIndicator currentStep={5} steps={steps} />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10 pointer-events-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : screens.length === 0 ? (
        <Card className="relative z-10 pointer-events-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma tela pareada ainda.
              <br />
              Clique em "Parear Tela" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10 pointer-events-auto">
          {screens.map((screen) => (
            <Card key={screen.id} className="relative group overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-neutral-900/60 border-gray-200 dark:border-neutral-800/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingScreen === screen.id ? (
                      <div className="space-y-1">
                        <input
                          className="w-full bg-transparent text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 pb-1"
                          value={editedValues[screen.id]?.name ?? screen.name}
                          onChange={(e) => setEditedValues((p) => ({ ...p, [screen.id]: { ...(p[screen.id] || {}), name: e.target.value } }))}
                        />
                        <input
                          className="w-full bg-transparent text-sm text-gray-600 dark:text-neutral-400"
                          value={editedValues[screen.id]?.subtitle ?? screen.subtitle ?? ""}
                          placeholder="Subtítulo"
                          onChange={(e) => setEditedValues((p) => ({ ...p, [screen.id]: { ...(p[screen.id] || {}), subtitle: e.target.value } }))}
                        />
                        <input
                          className="w-full bg-transparent text-xs text-gray-500"
                          value={editedValues[screen.id]?.address ?? screen.address ?? ""}
                          placeholder="Endereço do painel"
                          onChange={(e) => setEditedValues((p) => ({ ...p, [screen.id]: { ...(p[screen.id] || {}), address: e.target.value } }))}
                        />
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">{screen.name}</CardTitle>
                        {screen.subtitle && (
                          <CardDescription className="text-gray-600 dark:text-neutral-400">{screen.subtitle}</CardDescription>
                        )}
                        {screen.address && (
                          <div className="text-xs text-gray-500">{screen.address}</div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={screen.status === "online" ? "default" : "destructive"}
                      className={screen.status === "online" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-red-600 hover:bg-red-700"
                      }
                    >
                      {screen.status === "online" ? "Online" : "Offline"}
                    </Badge>

                    {editingScreen === screen.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveScreenEdits(screen.id)}>Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingScreen(null); setEditedValues((p)=>{ const cp={...p}; delete cp[screen.id]; return cp; }); }}>Cancelar</Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Miniatura do layout com proporção responsiva */}
                  <div
                    className={`w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center overflow-hidden ${
                      getLayoutOrientation(screen.current_layout_id || null) === "portrait"
                        ? "aspect-[9/16]"
                        : "aspect-video"
                    }`}
                  >
                    {screen.current_layout_id ? (
                      <div className="w-full h-full flex items-center justify-center text-center p-4">
                        <p className="text-xs text-gray-400">Layout em exibição</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Sem layout vinculado</p>
                    )}
                  </div>

                  {/* Código de Pareamento (somente leitura) */}
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Código de Pareamento</p>
                    <p className="font-mono font-bold text-lg text-gray-900 dark:text-white select-none">
                      {screen.code}
                    </p>
                    <div className="mt-2 text-sm text-neutral-500">
                      <div><strong>Última atualização:</strong> {deviceStatuses[screen.id]?.last_seen ? new Date(deviceStatuses[screen.id].last_seen).toLocaleString() : 'Indisponível'}</div>
                      <div><strong>Resolução:</strong> {deviceStatuses[screen.id]?.resolution || 'Indisponível'}</div>
                      <div><strong>Versão App:</strong> {deviceStatuses[screen.id]?.app_version || 'Indisponível'}</div>
                    </div>
                  </div>

                  {/* Seletor de Layout */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 dark:text-neutral-400">Layout Associado</label>
                    <Select
                      value={screen.current_layout_id || "none"}
                      onValueChange={(value) => updateScreenLayout(screen.id, value === "none" ? null : value)}
                    >
                      <SelectTrigger className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                        <SelectValue placeholder="Selecione um layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {layouts.map((layout) => (
                          <SelectItem key={layout.id} value={layout.id}>
                            {layout.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão Abrir Player */}
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-[#ffdd00] text-black hover:bg-yellow-500 dark:bg-[#ffdd00] dark:text-black dark:hover:bg-yellow-500"
                    onClick={() => openPlayer(screen)}
                  >
                    <Play className="h-4 w-4" />
                    Abrir Player
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setSelectedScreenForDetails(screen); setDetailsOpen(true); }}
                    >
                      Detalhes
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setSelectedScreen(screen.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botões de Navegação */}
      {!loading && screens.length > 0 && (
        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 dark:border-neutral-800/50 relative z-10 pointer-events-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/layouts")}
          >
            ← Voltar
          </Button>
        </div>
      )}

      <CreateScreenDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchScreens}
      />

      {selectedScreenForPlayer && (
        <ScreenPlayerModal
          open={playerOpen}
          onOpenChange={setPlayerOpen}
          screenName={selectedScreenForPlayer.name}
          screenCode={selectedScreenForPlayer.code}
          playlistId={selectedScreenForPlayer.current_layout_id}
        />
      )}

      {selectedScreenForDetails && (
        <ScreenDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          screenId={selectedScreenForDetails.id}
          screenName={selectedScreenForDetails.name}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tela? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Telas;
