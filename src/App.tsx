
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ClientsOverview from "./pages/ClientsOverview";
import NotFound from "./pages/NotFound";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import AccountingExplorer from "./components/DataAnalysis/AccountingExplorer";
import AppLayout from "./components/Layout/AppLayout";
import TransactionSampling from "./components/DataAnalysis/TransactionSampling";
import { SidebarProvider } from '@/components/ui/sidebar';
import ClientAdmin from "./pages/ClientAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RevyContextProvider>
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex flex-col w-full h-screen">
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/analyser" element={<AppLayout><AccountingExplorer /></AppLayout>} />
                <Route path="/analyser/transaksjoner" element={<AppLayout><TransactionSampling /></AppLayout>} />
                <Route path="/dokumenter" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/prosjekter" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/klienter" element={<AppLayout><ClientsOverview /></AppLayout>} />
                <Route path="/klienter/administrasjon" element={<AppLayout><ClientAdmin /></AppLayout>} />
                <Route path="/innstillinger" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/hjelp" element={<AppLayout><Index /></AppLayout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </RevyContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
