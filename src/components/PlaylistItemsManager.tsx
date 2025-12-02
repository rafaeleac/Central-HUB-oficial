import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, GripVertical, Image, Layout } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PlaylistItem {
  id: string;
  order_index: number;
  duration: number;
  file_id: string | null;
  layout_id: string | null;
  file?: { name: string; file_type: string } | null;
  layout?: { name: string } | null;
}

interface PlaylistItemsManagerProps {
  playlistId: string;
  playlistName: string;
}

export const PlaylistItemsManager = ({ playlistId, playlistName }: PlaylistItemsManagerProps) => {
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [itemType, setItemType] = useState<"file" | "layout">("file");
  const [selectedId, setSelectedId] = useState("");
  const [duration, setDuration] = useState("10");
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
    fetchFilesAndLayouts();
  }, [playlistId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("playlist_items")
        .select(`
          *,
          file:files(name, file_type),
          layout:layouts(name)
        `)
        .eq("playlist_id", playlistId)
        .order("order_index");

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilesAndLayouts = async () => {
    try {
      const [filesRes, layoutsRes] = await Promise.all([
        supabase.from("files").select("*"),
        supabase.from("layouts").select("*"),
      ]);

      setFiles(filesRes.data || []);
      setLayouts(layoutsRes.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar arquivos e layouts:", error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedId) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo ou layout.",
        variant: "destructive",
      });
      return;
    }

    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) : -1;

      const { error } = await supabase.from("playlist_items").insert({
        playlist_id: playlistId,
        file_id: itemType === "file" ? selectedId : null,
        layout_id: itemType === "layout" ? selectedId : null,
        duration: parseInt(duration),
        order_index: maxOrder + 1,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado à playlist!",
      });

      setAddDialogOpen(false);
      setSelectedId("");
      setDuration("10");
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("playlist_items").delete().eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item removido da playlist.",
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (itemId: string, direction: "up" | "down") => {
    const currentIndex = items.findIndex(i => i.id === itemId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];

    try {
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("playlist_items")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }

      setItems(newItems);
      toast({
        title: "Sucesso",
        description: "Ordem atualizada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Itens da Playlist: {playlistName}</CardTitle>
            <CardDescription>Gerencie a ordem e duração dos itens</CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum item na playlist. Adicione arquivos ou layouts para começar.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(item.id, "up")}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  {item.file ? (
                    <>
                      <Image className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item.file.name}</span>
                      <span className="text-xs text-muted-foreground">({item.file.file_type})</span>
                    </>
                  ) : (
                    <>
                      <Layout className="h-5 w-5 text-primary" />
                      <span className="font-medium">{item.layout?.name}</span>
                    </>
                  )}
                </div>

                <span className="text-sm text-muted-foreground">
                  {item.duration}s
                </span>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReorder(item.id, "down")}
                    disabled={index === items.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item à Playlist</DialogTitle>
            <DialogDescription>
              Escolha um arquivo ou layout para adicionar à sequência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Item</Label>
              <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Arquivo</SelectItem>
                  <SelectItem value="layout">Layout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{itemType === "file" ? "Arquivo" : "Layout"}</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {itemType === "file"
                    ? files.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))
                    : layouts.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (segundos)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
