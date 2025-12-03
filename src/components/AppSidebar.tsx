import { LayoutDashboard, Monitor, FileImage, LayoutTemplate, ListVideo, LogOut, Key, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Telas", url: "/telas", icon: Monitor },
  { title: "Arquivos", url: "/arquivos", icon: FileImage },
  { title: "Layouts", url: "/layouts", icon: LayoutTemplate },
  { title: "Playlists", url: "/playlists", icon: ListVideo },
  { title: "API Keys", url: "/api-keys", icon: Key },
  { title: "Suporte", url: "/suporte", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível sair. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Até logo!",
        description: "Você saiu com sucesso.",
      });
      navigate("/auth");
    }
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <h2 className={`font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${isCollapsed ? "hidden" : ""}`}>
            HUB Central
          </h2>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className="hover:bg-sidebar-accent" 
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-sidebar-border space-y-3">
          {/* Botão de Tema */}
          <div className="flex items-center justify-between">
            {!isCollapsed && <span className="text-xs font-medium">Aparência</span>}
            <ThemeToggle />
          </div>
          
          {/* Botão Sair */}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}