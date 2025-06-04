
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { useAuth } from "./components/Auth/AuthProvider";
import AppLayout from "./components/Layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientsOverview from "./pages/ClientsOverview";
import NotFound from "./pages/NotFound";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import AccountingExplorer from "./components/DataAnalysis/AccountingExplorer";
import TransactionSampling from "./components/DataAnalysis/TransactionSampling";
import { SidebarProvider } from '@/components/ui/sidebar';
import ClientAdmin from "./pages/ClientAdmin";
import DataImport from "./pages/DataImport";
import ClientDetail from "./pages/ClientDetail";
import LedgerPage from "./pages/LedgerPage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RevyContextProvider>
            <BrowserRouter>
              <SidebarProvider>
                <AppLayout>
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Navigate to="/klienter" replace />} />

                    {/* Protected routes innenfor AppLayout */}
                    <Route path="/klienter" element={
                      <ProtectedRoute>
                        <ClientsOverview />
                      </ProtectedRoute>
                    } />
                    <Route path="/klienter/:orgNumber/*" element={
                      <ProtectedRoute>
                        <ClientDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/klienter/:orgNumber/regnskap" element={
                      <ProtectedRoute>
                        <LedgerPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/analyser" element={
                      <ProtectedRoute>
                        <AccountingExplorer />
                      </ProtectedRoute>
                    } />
                    <Route path="/analyser/transaksjoner" element={
                      <ProtectedRoute>
                        <TransactionSampling />
                      </ProtectedRoute>
                    } />
                    <Route path="/dokumenter" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/prosjekter" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/innstillinger" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/hjelp" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/regnskap" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/klienter/administrasjon" element={
                      <ProtectedRoute>
                        <ClientAdmin />
                      </ProtectedRoute>
                    } />
                    <Route path="/data-import" element={
                      <ProtectedRoute>
                        <DataImport />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </SidebarProvider>
            </BrowserRouter>
          </RevyContextProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
