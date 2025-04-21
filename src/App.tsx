
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { useAuth } from "./components/Auth/AuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientsOverview from "./pages/ClientsOverview";
import NotFound from "./pages/NotFound";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import AccountingExplorer from "./components/DataAnalysis/AccountingExplorer";
import AppLayout from "./components/Layout/AppLayout";
import TransactionSampling from "./components/DataAnalysis/TransactionSampling";
import { SidebarProvider } from '@/components/ui/sidebar';
import ClientAdmin from "./pages/ClientAdmin";
import DataImport from "./pages/DataImport";
import ClientDetail from "./pages/ClientDetail";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RevyContextProvider>
            <BrowserRouter>
              <SidebarProvider>
                <div className="flex flex-col w-full h-screen">
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    {/* Redirect root "/" to "/klienter" as new start page */}
                    <Route path="/" element={<Navigate to="/klienter" replace />} />
                    <Route path="/klienter" element={<ProtectedRoute><ClientsOverview /></ProtectedRoute>} />
                    <Route path="/klienter/:orgNumber" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<Navigate to="/klienter" replace />} />
                    <Route path="/analyser" element={<ProtectedRoute><AccountingExplorer /></ProtectedRoute>} />
                    <Route path="/analyser/transaksjoner" element={<ProtectedRoute><TransactionSampling /></ProtectedRoute>} />
                    <Route path="/dokumenter" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
                    <Route path="/prosjekter" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
                    <Route path="/klienter/administrasjon" element={<ProtectedRoute><ClientAdmin /></ProtectedRoute>} />
                    <Route path="/innstillinger" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
                    <Route path="/hjelp" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
                    <Route path="/data-import" element={<ProtectedRoute><DataImport /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </SidebarProvider>
            </BrowserRouter>
          </RevyContextProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
