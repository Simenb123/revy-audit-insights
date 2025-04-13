
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RevyContextProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/analyser" element={<AppLayout><AccountingExplorer /></AppLayout>} />
            <Route path="/analyser/transaksjoner" element={<AppLayout><TransactionSampling /></AppLayout>} />
            <Route path="/dokumenter" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/prosjekter" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/klienter" element={<AppLayout><ClientsOverview /></AppLayout>} />
            <Route path="/innstillinger" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/hjelp" element={<AppLayout><Index /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RevyContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
