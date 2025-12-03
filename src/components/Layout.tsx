import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border px-6 bg-card">
            <SidebarTrigger />
            {/* Botão de Suporte (erro) no header - lado direito */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/suporte")}
              className="hover:bg-red-500/10 hover:text-red-500"
              title="Solicitar Suporte"
            >
              <AlertCircle className="h-5 w-5" />
            </Button>
          </header>
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;