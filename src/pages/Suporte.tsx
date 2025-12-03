import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Upload, Camera } from "lucide-react";

const Suporte = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    descricao: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Formatar telefone: (00) 0 0000-0000
  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value);
    setFormData({ ...formData, telefone: formatted });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
      toast({
        title: "Screenshot capturado",
        description: "Imagem anexada ao formulário",
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.telefone || !formData.email || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload de arquivos para Supabase Storage se houver
      const fileUrls: string[] = [];
      for (const file of files) {
        const fileName = `support/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(fileName, file);

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from("uploads")
            .getPublicUrl(fileName);
          fileUrls.push(publicUrl.publicUrl);
        }
      }

      // Enviar email via Supabase Function
      const { error: functionError } = await supabase.functions.invoke(
        "send-support-email",
        {
          body: {
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email,
            descricao: formData.descricao,
            arquivos: fileUrls,
            destinatario: "hub.totem@gmail.com",
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      toast({
        title: "Sucesso!",
        description: "Sua solicitação de suporte foi enviada. Em breve entraremos em contato.",
      });

      // Limpar formulário
      setFormData({ nome: "", telefone: "", email: "", descricao: "" });
      setFiles([]);
    } catch (error: any) {
      console.error("Erro ao enviar suporte:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar sua solicitação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold">Suporte HUB</h1>
            <p className="text-muted-foreground">Encontrou um erro? Solicite ajuda aqui</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Preencha o formulário</h3>
              <p className="text-sm text-muted-foreground">Nos forneça seus dados para contato</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Descreva o problema</h3>
              <p className="text-sm text-muted-foreground">
                Explique detalhadamente qual erro encontrou
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Anexe evidências</h3>
              <p className="text-sm text-muted-foreground">
                Envie screenshots ou fotos para facilitar o diagnóstico
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">4. Envie e aguarde</h3>
              <p className="text-sm text-muted-foreground">
                Nossa equipe entrará em contato no email ou telefone fornecido
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Ajuda</CardTitle>
            <CardDescription>Preencha os dados abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  disabled={loading}
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  type="tel"
                  placeholder="(00) 0 0000-0000"
                  value={formData.telefone}
                  onChange={handleTelefoneChange}
                  maxLength={20}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição do Problema *</label>
                <Textarea
                  placeholder="Descreva detalhadamente o erro ou falha que encontrou..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  disabled={loading}
                  className="min-h-24"
                />
              </div>

              {/* Upload de Arquivos */}
              <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                <label className="text-sm font-medium block">Anexar Imagem/Arquivo</label>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Câmera
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />

                {/* Lista de Arquivos */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {files.length} arquivo(s) anexado(s):
                    </p>
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-background p-2 rounded border text-xs"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão Enviar */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Suporte;
