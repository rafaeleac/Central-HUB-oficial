import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Telas from "./pages/Telas";
import Arquivos from "./pages/Arquivos";
import Layouts from "./pages/Layouts";
import Playlists from "./pages/Playlists";
import Player from "./pages/Player";
import NotFound from "./pages/NotFound";
import ApiKeys from "./pages/ApiKeys";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/telas"
            element={
              <ProtectedRoute>
                <Layout>
                  <Telas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/arquivos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Arquivos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layouts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Layouts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <Layout>
                  <Playlists />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-keys"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApiKeys />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/player/:screenCode" element={<Player />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
