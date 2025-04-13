
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RevyContextProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ClientsOverview />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/analyser" element={<AccountingExplorer />} />
            <Route path="/dokumenter" element={<Index />} />
            <Route path="/prosjekter" element={<Index />} />
            <Route path="/klienter" element={<ClientsOverview />} />
            <Route path="/innstillinger" element={<Index />} />
            <Route path="/hjelp" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </RevyContextProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
