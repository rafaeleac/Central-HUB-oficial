import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Trash2, Copy, ExternalLink, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreateScreenDialog } from "@/components/CreateScreenDialog";
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
  code: string;
  location: string | null;
  status: string;
  last_seen: string | null;
  current_playlist_id: string | null;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
}

const Telas = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScreens();
    fetchPlaylists();
  }, []);

  const fetchScreens = async () => {
    try {
      const { data, error } = await supabase
        .from("screens")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setScreens(data || []);
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

  const updateScreenPlaylist = async (screenId: string, playlistId: string | null) => {
    try {
      const { error } = await supabase
        .from("screens")
        .update({ current_playlist_id: playlistId })
        .eq("id", screenId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: playlistId 
          ? "Playlist associada à tela com sucesso!"
          : "Playlist desassociada da tela.",
      });

      fetchScreens();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a playlist da tela.",
        variant: "destructive",
      });
    }
  };

  const openPlayer = (screenCode: string) => {
    const playerUrl = `${window.location.origin}/player/${screenCode}`;
    window.open(playerUrl, "_blank");
  };

  const copyPlayerUrl = (screenCode: string) => {
    const playerUrl = `${window.location.origin}/player/${screenCode}`;
    navigator.clipboard.writeText(playerUrl);
    toast({
      title: "URL copiada!",
      description: "A URL do player foi copiada para a área de transferência.",
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código de pareamento foi copiado para a área de transferência.",
    });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Telas</h1>
          <p className="text-muted-foreground">Gerencie suas telas de exibição</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Parear Tela
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Card>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => (
            <Card key={screen.id} className="relative group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{screen.name}</CardTitle>
                    {screen.location && (
                      <CardDescription>{screen.location}</CardDescription>
                    )}
                  </div>
                  <Badge variant={screen.status === "online" ? "default" : "secondary"}>
                    {screen.status === "online" ? "Online" : "Offline"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Código de Pareamento</p>
                      <p className="font-mono font-bold text-lg">{screen.code}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCode(screen.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Playlist Associada</label>
                    <Select
                      value={screen.current_playlist_id || "none"}
                      onValueChange={(value) => 
                        updateScreenPlaylist(screen.id, value === "none" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma playlist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {playlists.map((playlist) => (
                          <SelectItem key={playlist.id} value={playlist.id}>
                            {playlist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openPlayer(screen.code)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Player
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPlayerUrl(screen.code)}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setSelectedScreen(screen.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateScreenDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchScreens}
      />

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