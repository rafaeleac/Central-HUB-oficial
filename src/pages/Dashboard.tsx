import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, FileVideo, Layout, ListVideo } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    screens: 0,
    activeScreens: 0,
    files: 0,
    layouts: 0,
    playlists: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [screensRes, filesRes, layoutsRes, playlistsRes] = await Promise.all([
        supabase.from("screens").select("status", { count: "exact" }),
        supabase.from("files").select("id", { count: "exact" }),
        supabase.from("layouts").select("id", { count: "exact" }),
        supabase.from("playlists").select("id", { count: "exact" }),
      ]);

      const activeScreens = screensRes.data?.filter((s) => s.status === "online").length || 0;

      setStats({
        screens: screensRes.count || 0,
        activeScreens,
        files: filesRes.count || 0,
        layouts: layoutsRes.count || 0,
        playlists: playlistsRes.count || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao HUB Central</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Telas - clicável */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => navigate("/telas")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telas</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.screens}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeScreens} online
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Arquivos - clicável */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => navigate("/arquivos")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arquivos</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.files}</div>
                <p className="text-xs text-muted-foreground">Mídias disponíveis</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Layouts - clicável */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => navigate("/layouts")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Layouts</CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.layouts}</div>
                <p className="text-xs text-muted-foreground">Templates criados</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card Playlists - clicável */}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => navigate("/playlists")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playlists</CardTitle>
            <ListVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.playlists}</div>
                <p className="text-xs text-muted-foreground">Sequências criadas</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;