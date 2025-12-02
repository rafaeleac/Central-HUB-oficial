import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const screenSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  code: z.string().trim().length(5, "Código deve ter exatamente 5 dígitos").regex(/^[0-9]{5}$/, "Código deve conter apenas números"),
  location: z.string().trim().max(200, "Localização muito longa").optional(),
});

interface CreateScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateScreenDialog = ({ open, onOpenChange, onSuccess }: CreateScreenDialogProps) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    // Validação com Zod
    const validation = screenSchema.safeParse({
      name: name,
      code: code,
      location: location || undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verifica se o código já existe
      const { data: existingScreen } = await supabase
        .from("screens")
        .select("id")
        .eq("code", code.trim())
        .maybeSingle();

      if (existingScreen) {
        toast({
          title: "Código já existe",
          description: "Este código já está vinculado a outra tela. Verifique o código no APK.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("screens").insert({
        name: name.trim(),
        location: location.trim() || null,
        code: code.trim(),
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tela pareada com sucesso!",
      });

      setName("");
      setCode("");
      setLocation("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível parear a tela.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parear Nova Tela</DialogTitle>
          <DialogDescription>
            Digite o código de 5 dígitos exibido no APK da tela para vinculá-la ao gerenciador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código da Tela *</Label>
            <Input
              id="code"
              placeholder="Ex: 12345"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={5}
              className="text-2xl font-mono text-center tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              Digite o código de 5 dígitos exibido no APK da tela
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tela *</Label>
            <Input
              id="name"
              placeholder="Ex: Recepção Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              placeholder="Ex: Andar 1, Sala 101"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Pareando..." : "Parear Tela"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
