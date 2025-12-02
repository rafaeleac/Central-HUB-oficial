import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Key, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    return `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para a API key",
        variant: "destructive",
      });
      return;
    }

    setCreatingKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const newKey = generateApiKey();
      const { error } = await supabase.from("api_keys").insert({
        key: newKey,
        name: newKeyName,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "API Key criada!",
        description: "A chave foi criada com sucesso. Copie agora, ela não será mostrada novamente.",
      });

      setNewKeyName("");
      setDialogOpen(false);
      fetchApiKeys();
    } catch (error) {
      console.error("Error creating API key:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a API key",
        variant: "destructive",
      });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta API key?")) return;

    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "API Key excluída",
        description: "A chave foi removida com sucesso",
      });

      fetchApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "API key copiada para a área de transferência",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as chaves de API para conectar o Display Link Client
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Crie uma chave de API para conectar o Display Link Client ao Central Hub
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da API Key</Label>
                <Input
                  id="name"
                  placeholder="Ex: Display Client Produção"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateKey} disabled={creatingKey}>
                {creatingKey ? "Criando..." : "Criar API Key"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma API Key criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie uma API key para conectar o Display Link Client
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {apiKey.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Criada em {new Date(apiKey.created_at).toLocaleDateString("pt-BR")}
                      {apiKey.last_used_at && (
                        <> • Último uso: {new Date(apiKey.last_used_at).toLocaleDateString("pt-BR")}</>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteKey(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                    {apiKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Como usar a API Key</CardTitle>
          <CardDescription>
            Configure o Display Link Client com estas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">URL da API:</Label>
            <code className="block bg-muted px-3 py-2 rounded mt-2 text-sm">
              https://qoylssoecufbakpxmdmq.supabase.co/functions/v1
            </code>
          </div>
          <div>
            <Label className="font-semibold">Endpoints disponíveis:</Label>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <code className="bg-muted px-2 py-1 rounded">GET /get-screen-by-code?code=XXXXX</code> - Buscar tela
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">GET /get-playlist-content?playlist_id=UUID</code> - Buscar playlist
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">POST /update-screen-status</code> - Atualizar status
              </li>
            </ul>
          </div>
          <div>
            <Label className="font-semibold">Header necessário:</Label>
            <code className="block bg-muted px-3 py-2 rounded mt-2 text-sm">
              x-api-key: sua_api_key_aqui
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeys;