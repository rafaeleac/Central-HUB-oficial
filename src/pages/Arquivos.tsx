import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileVideo, Trash2, Image as ImageIcon, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadFileDialog } from "@/components/UploadFileDialog";
import { Badge } from "@/components/ui/badge";
import StepIndicator from "@/components/StepIndicator";
import TechBackground from "@/components/TechBackground";
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

interface File {
  id: string;
  name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  duration: number | null;
  created_at: string;
}

const Arquivos = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const steps = [
    { number: 1, label: "Dashboard", description: "Início" },
    { number: 2, label: "Arquivos", description: "Upload" },
    { number: 3, label: "Playlists", description: "Organizar" },
    { number: 4, label: "Layouts", description: "Design" },
    { number: 5, label: "Telas", description: "Reproduzir" },
  ];

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    try {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", selectedFile);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Arquivo excluído com sucesso!",
      });

      fetchFiles();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
      <div className="space-y-6 relative min-h-screen">
        <TechBackground />
      
        <div className="flex items-center justify-between relative z-10 pointer-events-auto">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Etapa 2: Upload de Arquivos</h1>
           <p className="text-gray-600 dark:text-[#ffdd00]">Envie suas mídias (imagens, vídeos) para começar</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload de Arquivo
        </Button>
      </div>

      <div className="relative z-10 pointer-events-auto">
      <StepIndicator currentStep={2} steps={steps} />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10 pointer-events-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileVideo className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-gray-600 dark:text-muted-foreground text-center">
              Nenhum arquivo enviado ainda.
              <br />
              Clique em "Upload de Arquivo" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id} className="overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-neutral-900/60 border-gray-200 dark:border-neutral-800/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted relative">
                {file.file_type === "image" ? (
                  <img
                    src={file.file_url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileVideo className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2">
                  {file.file_type === "image" ? (
                    <><ImageIcon className="h-3 w-3 mr-1" /> Imagem</>
                  ) : (
                    <><FileVideo className="h-3 w-3 mr-1" /> Vídeo</>
                  )}
                </Badge>
              </div>
              <CardHeader>
                 <CardTitle className="text-lg truncate text-gray-900 dark:text-white">{file.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-neutral-400">Tamanho:</span>
                      <span className="text-gray-900 dark:text-white">{formatFileSize(file.file_size)}</span>
                  </div>
                  {file.duration && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-neutral-400">Duração:</span>
                        <span className="text-gray-900 dark:text-white">{formatDuration(file.duration)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-neutral-400">Enviado:</span>
                      <span className="text-gray-900 dark:text-white">{new Date(file.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setSelectedFile(file.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botões de Navegação */}
      {!loading && files.length > 0 && (
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 dark:border-neutral-800/50 relative z-10 pointer-events-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            ← Voltar
          </Button>
          <Button
            onClick={() => navigate("/playlists")}
            className="gap-2"
          >
            Próximo: Playlists
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <UploadFileDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchFiles}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.
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

export default Arquivos;