import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListVideo, Trash2, Settings, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePlaylistDialog } from "@/components/CreatePlaylistDialog";
import { PlaylistItemsManager } from "@/components/PlaylistItemsManager";
import StepIndicator from "@/components/StepIndicator";
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

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const Playlists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const { toast } = useToast();

  const steps = [
    { number: 1, label: "Dashboard", description: "Início" },
    { number: 2, label: "Arquivos", description: "Upload" },
    { number: 3, label: "Playlists", description: "Organizar" },
    { number: 4, label: "Layouts", description: "Design" },
    { number: 5, label: "Telas", description: "Reproduzir" },
  ];

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as playlists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!playlistToDelete) return;

    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistToDelete);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Playlist excluída com sucesso!",
      });

      fetchPlaylists();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a playlist.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlaylistToDelete(null);
    }
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {selectedPlaylist ? (
        <>
          <Button variant="outline" onClick={() => setSelectedPlaylist(null)}>
            ← Voltar
          </Button>
          <PlaylistItemsManager
            playlistId={selectedPlaylist.id}
            playlistName={selectedPlaylist.name}
          />
          {/* Botões de Navegação */}
          <div className="flex gap-4 justify-end pt-6 border-t">
            <Button variant="outline" onClick={() => navigate("/arquivos")}>
              ← Voltar
            </Button>
            <Button
              onClick={() => navigate("/layouts")}
              className="gap-2"
            >
              Próximo: Layouts
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Etapa 3: Formação de Playlists</h1>
              <p className="text-muted-foreground">Organize seus arquivos em sequências de conteúdo</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Playlist
            </Button>
          </div>

          <StepIndicator currentStep={3} steps={steps} />

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
      ) : playlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListVideo className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma playlist criada ainda.
              <br />
              Clique em "Nova Playlist" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id}>
              <CardHeader>
                <CardTitle className="text-lg">{playlist.name}</CardTitle>
                {playlist.description && (
                  <CardDescription>{playlist.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ListVideo className="h-4 w-4 mr-2" />
                    Criada em {new Date(playlist.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedPlaylist(playlist)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPlaylistToDelete(playlist.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          )}

          <CreatePlaylistDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={fetchPlaylists}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta playlist? Esta ação não pode ser desfeita.
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

export default Playlists;