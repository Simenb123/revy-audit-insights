import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { useAuth } from "./components/Auth/AuthProvider";
import AppLayout from "./components/Layout/AppLayout";
import OnboardingCheck from "./components/Layout/OnboardingCheck";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientsOverview from "./pages/ClientsOverview";
import NotFound from "./pages/NotFound";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import AccountingExplorer from "./components/DataAnalysis/AccountingExplorer";
import TransactionSampling from "./components/DataAnalysis/TransactionSampling";
import ClientAdmin from "./pages/ClientAdmin";
import DataImport from "./pages/DataImport";
import ClientDetail from "./pages/ClientDetail";
import LedgerPage from "./pages/LedgerPage";
import AccountingData from "./pages/AccountingData";
import KnowledgeBase from "./pages/KnowledgeBase";
import OrganizationOverview from "./pages/OrganizationOverview";
import OrganizationSetup from "./pages/OrganizationSetup";
import DepartmentView from "./pages/DepartmentView";
import UserAdmin from "./pages/UserAdmin";
import OrganizationSettings from "./pages/OrganizationSettings";

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
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Organization setup route - no onboarding check */}
                <Route path="/organisasjon/oppsett" element={
                  <ProtectedRoute>
                    <OrganizationSetup />
                  </ProtectedRoute>
                } />

                {/* Dashboard route with onboarding check */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />

                {/* Organization routes with onboarding check */}
                <Route path="/organisasjon" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <OrganizationOverview />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/avdeling" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DepartmentView />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/brukeradministrasjon" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <UserAdmin />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/organisasjonsinnstillinger" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <OrganizationSettings />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />

                {/* Client routes with onboarding check */}
                <Route path="/klienter" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <ClientsOverview />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <ClientDetail />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                
                {/* Data upload routes */}
                <Route path="/klienter/:orgNumber/regnskapsdata" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DataImport />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/grunnlagsdata" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DataImport />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/spesialdata" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DataImport />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/transaksjoner" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DataImport />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/import" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DataImport />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                
                {/* Keep existing routes */}
                <Route path="/klienter/:orgNumber/regnskap" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <LedgerPage />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/fag/*" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <KnowledgeBase />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/analyser" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <AccountingExplorer />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/analyser/transaksjoner" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <TransactionSampling />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/dokumenter" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/prosjekter" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/innstillinger" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/hjelp" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/regnskap" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <Index />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/administrasjon" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <ClientAdmin />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="/data-import" element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <AppLayout>
                        <DataImport />
                      </AppLayout>
                    </OnboardingCheck>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RevyContextProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
