import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CreateLayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const layoutTemplates = [
  { id: "fullscreen", name: "Tela Cheia", zones: [{ id: "main", x: 0, y: 0, width: 100, height: 100 }] },
  { id: "split-horizontal", name: "Dividido Horizontal", zones: [
    { id: "top", x: 0, y: 0, width: 100, height: 50 },
    { id: "bottom", x: 0, y: 50, width: 100, height: 50 }
  ]},
  { id: "split-vertical", name: "Dividido Vertical", zones: [
    { id: "left", x: 0, y: 0, width: 50, height: 100 },
    { id: "right", x: 50, y: 0, width: 50, height: 100 }
  ]},
  { id: "three-zones", name: "Três Zonas", zones: [
    { id: "main", x: 0, y: 0, width: 70, height: 100 },
    { id: "sidebar-top", x: 70, y: 0, width: 30, height: 50 },
    { id: "sidebar-bottom", x: 70, y: 50, width: 30, height: 50 }
  ]},
];

export const CreateLayoutDialog = ({ open, onOpenChange, onSuccess }: CreateLayoutDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("fullscreen");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do layout é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const template = layoutTemplates.find(t => t.id === selectedTemplate);
      
      const { error } = await supabase.from("layouts").insert({
        name: name.trim(),
        description: description.trim() || null,
        layout_data: { template: selectedTemplate, zones: template?.zones || [] },
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Layout criado com sucesso!",
      });

      setName("");
      setDescription("");
      setSelectedTemplate("fullscreen");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o layout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Layout</DialogTitle>
          <DialogDescription>
            Crie um novo layout para organizar o conteúdo nas suas telas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: Layout Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste layout"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-3">
            <Label>Template</Label>
            <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
              {layoutTemplates.map((template) => (
                <div key={template.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={template.id} id={template.id} />
                  <Label htmlFor={template.id} className="cursor-pointer font-normal">
                    {template.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Criando..." : "Criar Layout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
