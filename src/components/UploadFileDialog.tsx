import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UploadFileDialog = ({ open, onOpenChange, onSuccess }: UploadFileDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("media-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-files")
        .getPublicUrl(fileName);

      const fileType = file.type.startsWith("image/") ? "image" : "video";
      const duration = fileType === "video" ? await getVideoDuration(file) : null;

      const { error: dbError } = await supabase.from("files").insert({
        name: name.trim() || file.name,
        file_type: fileType,
        file_url: publicUrl,
        file_size: file.size,
        duration,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      });

      setFile(null);
      setName("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível fazer upload do arquivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de Arquivo</DialogTitle>
          <DialogDescription>
            Faça upload de imagens ou vídeos para usar em suas telas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <div className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Arquivo</Label>
            <Input
              id="name"
              placeholder="Nome personalizado (opcional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {file && (
            <div className="rounded-lg border border-border p-4 bg-muted/50">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type.startsWith("image/") ? "Imagem" : "Vídeo"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Enviando..." : "Fazer Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
