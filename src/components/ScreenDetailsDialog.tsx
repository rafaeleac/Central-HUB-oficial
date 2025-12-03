import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenId: string;
  screenName: string;
}

export const ScreenDetailsDialog: React.FC<Props> = ({ open, onOpenChange, screenId, screenName }) => {
  const [deviceStatus, setDeviceStatus] = useState<any | null>(null);
  const [playEvents, setPlayEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !screenId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: status } = await supabase
          .from("device_status")
          .select("*")
          .eq("screen_id", screenId)
          .order("last_seen", { ascending: false })
          .limit(1)
          .maybeSingle();

        setDeviceStatus(status || null);

        const { data: events } = await supabase
          .from("play_events")
          .select(`*, files (name), playlists (name), layouts (name)`)
          .eq("screen_id", screenId)
          .order("started_at", { ascending: false })
          .limit(500);

        setPlayEvents(events || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, screenId]);

  const downloadCSV = () => {
    const headers = [
      "started_at",
      "duration_seconds",
      "occurrences",
      "file_name",
      "playlist_name",
      "layout_name",
      "screen_id",
    ];

    const rows = playEvents.map((ev) => [
      ev.started_at,
      ev.duration_seconds,
      ev.occurrences,
      ev.files?.name || (ev.meta && ev.meta.name) || "-",
      ev.playlists?.name || "-",
      ev.layouts?.name || "-",
      ev.screen_id,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${screenName || screenId}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{screenName} — Detalhes</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <Tabs defaultValue="status">
            <TabsList>
              <TabsTrigger value="status">Configurações & Status</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
              <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
              <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
              <TabsTrigger value="relatorio">Relatório de Exibição</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium">Status</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div>
                      <strong>Última atualização:</strong>{" "}
                      {deviceStatus?.last_seen ? new Date(deviceStatus.last_seen).toLocaleString() : "Indisponível"}
                    </div>
                    <div>
                      <strong>App:</strong> {deviceStatus?.app_version || "Indisponível"}
                    </div>
                    <div>
                      <strong>Online a:</strong> {deviceStatus?.info?.uptime || "—"}
                    </div>
                    <div>
                      <strong>Última informação:</strong> {deviceStatus?.info?.last_message || "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Informações</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div>
                      <strong>Versão do Aplicativo:</strong> {deviceStatus?.app_version || "Indisponível"}
                    </div>
                    <div>
                      <strong>Sistema Operacional:</strong> {deviceStatus?.os || "Indisponível"}
                    </div>
                    <div>
                      <strong>Resolução:</strong> {deviceStatus?.resolution || "Indisponível"}
                    </div>
                    <div>
                      <strong>Espaço utilizado:</strong> {deviceStatus?.used_space || "Indisponível"}
                    </div>
                    <div>
                      <strong>Espaço livre:</strong> {deviceStatus?.free_space || "Indisponível"}
                    </div>
                    <div>
                      <strong>MAC:</strong> {deviceStatus?.mac || "Indisponível"}
                    </div>
                    <div>
                      <strong>Data/Hora da Tela:</strong> {deviceStatus?.info?.datetime || "Indisponível"}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="extras">
              <p>Opções extras e configurações do painel.</p>
            </TabsContent>

            <TabsContent value="agendamentos">
              <p>Agendamentos e programações (a implementar).</p>
            </TabsContent>

            <TabsContent value="notificacoes">
              <p>Notificações e alertas do dispositivo.</p>
            </TabsContent>

            <TabsContent value="relatorio">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Relatório de Exibição</h3>
                <Button onClick={downloadCSV} variant="outline" size="sm">
                  <Download className="mr-2" /> Exportar CSV
                </Button>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div>Carregando...</div>
                ) : playEvents.length === 0 ? (
                  <div>Nenhum evento registrado para esta tela.</div>
                ) : (
                  <div className="overflow-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th>Início</th>
                          <th>Duração</th>
                          <th>Ocorrências</th>
                          <th>Arquivo</th>
                          <th>Playlist</th>
                          <th>Layout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playEvents.map((ev) => (
                          <tr key={ev.id} className="border-t">
                            <td>{ev.started_at ? new Date(ev.started_at).toLocaleString() : "-"}</td>
                            <td>{ev.duration_seconds || "-"}</td>
                            <td>{ev.occurrences}</td>
                            <td>{ev.files?.name || (ev.meta && ev.meta.name) || "-"}</td>
                            <td>{ev.playlists?.name || "-"}</td>
                            <td>{ev.layouts?.name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScreenDetailsDialog;
