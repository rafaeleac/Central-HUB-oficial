import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Layout as LayoutIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateLayoutDialog } from "@/components/CreateLayoutDialog";
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

interface Layout {
  id: string;
  name: string;
  description: string | null;
  layout_data: any;
  created_at: string;
}

const Layouts = () => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("layouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLayouts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os layouts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLayout) return;

    try {
      const { error } = await supabase
        .from("layouts")
        .delete()
        .eq("id", selectedLayout);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Layout excluído com sucesso!",
      });

      fetchLayouts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o layout.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedLayout(null);
    }
  };

  const getZoneCount = (layoutData: any) => {
    return layoutData?.zones?.length || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Layouts</h1>
          <p className="text-muted-foreground">Crie templates para suas telas</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Layout
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
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : layouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum layout criado ainda.
              <br />
              Clique em "Novo Layout" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => (
            <Card key={layout.id}>
              <CardHeader>
                <CardTitle className="text-lg">{layout.name}</CardTitle>
                {layout.description && (
                  <CardDescription>{layout.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
                    <LayoutIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zonas:</span>
                      <span className="font-medium">{getZoneCount(layout.layout_data)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span>{new Date(layout.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setSelectedLayout(layout.id);
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

      <CreateLayoutDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchLayouts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este layout? Esta ação não pode ser desfeita.
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

export default Layouts;