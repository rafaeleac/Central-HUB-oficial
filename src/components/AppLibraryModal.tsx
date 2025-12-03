import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppConfig {
  type: string;
  config: any;
}

interface AppLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddApp: (app: AppConfig) => void;
}

const AVAILABLE_APPS = [
  { key: "weather", name: "Weather (Open-Meteo)", description: "Mostra previsão do tempo para uma coordenada." },
  { key: "rss", name: "RSS Feed", description: "Exibe itens de um feed RSS." },
  { key: "random_image", name: "Imagem aleatória (Picsum)", description: "Mostra imagens grátis aleatórias." },
  { key: "quote", name: "Frase do dia", description: "Mostra citações inspiradoras." },
];

export const AppLibraryModal = ({ open, onOpenChange, onAddApp }: AppLibraryModalProps) => {
  const [selected, setSelected] = useState<string>(AVAILABLE_APPS[0].key);
  const [location, setLocation] = useState("");
  const [rssUrl, setRssUrl] = useState("");

  const handleAdd = () => {
    if (selected === "weather") {
      if (!location) return alert("Informe latitude,longitude — ex: -23.55,-46.63");
      onAddApp({ type: "weather", config: { latlon: location } });
    } else if (selected === "rss") {
      if (!rssUrl) return alert("Informe a URL do RSS");
      onAddApp({ type: "rss", config: { url: rssUrl } });
    } else if (selected === "random_image") {
      onAddApp({ type: "random_image", config: {} });
    } else if (selected === "quote") {
      onAddApp({ type: "quote", config: {} });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar App / Gadget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo de App</Label>
            <Select value={selected} onValueChange={(v: any) => setSelected(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_APPS.map((a) => (
                  <SelectItem key={a.key} value={a.key}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected === "weather" && (
            <div className="space-y-2">
              <Label>Latitude,Longitude</Label>
              <Input placeholder="ex: -23.55,-46.63" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          )}

          {selected === "rss" && (
            <div className="space-y-2">
              <Label>URL do RSS</Label>
              <Input placeholder="https://example.com/feed.xml" value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} />
            </div>
          )}

          {selected === "random_image" && (
            <div className="text-sm text-muted-foreground">Imagem aleatória fetchada de https://picsum.photos.</div>
          )}

          {selected === "quote" && (
            <div className="text-sm text-muted-foreground">Frases geradas localmente (sem API externa) ou via APIs públicas.</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Adicionar App</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppLibraryModal;
