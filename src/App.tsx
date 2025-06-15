
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/Layout/AppLayout";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import OnboardingCheck from "./components/Layout/OnboardingCheck";
import React, { lazy, Suspense } from 'react';
import PageLoader from "./components/Layout/PageLoader";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NavigationDashboard = lazy(() => import("./pages/NavigationDashboard"));
const ClientsOverview = lazy(() => import("./pages/ClientsOverview"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const ClientAdmin = lazy(() => import("./pages/ClientAdmin"));
const Communication = lazy(() => import("./pages/Communication"));
const AccountingData = lazy(() => import("./pages/AccountingData"));
const DataImport = lazy(() => import("./pages/DataImport"));
const PDFDocuments = lazy(() => import("./pages/PDFDocuments"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Training = lazy(() => import("./pages/Training"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const OrganizationOverview = lazy(() => import("./pages/OrganizationOverview"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const OrganizationSetup = lazy(() => import("./pages/OrganizationSetup"));
const UserAdmin = lazy(() => import("./pages/UserAdmin"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const AIUsage = lazy(() => import("./pages/AIUsage"));
const Collaboration = lazy(() => import("./pages/Collaboration"));
const DepartmentView = lazy(() => import("./pages/DepartmentView"));
const LedgerPage = lazy(() => import("./pages/LedgerPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RevyContextProvider>
                <Routes>
                  <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/*" 
                    element={
                      <OnboardingCheck>
                        <AppLayout>
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              {/* Endret: dashboard viser hoveddashboardet */}
                              <Route path="/dashboard" element={<Index />} />
                              {/* Ny rute: funksjonsmeny */}
                              <Route path="/funksjoner" element={<NavigationDashboard />} />
                              <Route path="/clients" element={<ClientsOverview />} />
                              <Route path="/klienter" element={<ClientsOverview />} />
                              <Route path="/klienter/:orgNumber/*" element={<ClientDetail />} />
                              <Route path="/client-admin" element={<ClientAdmin />} />
                              <Route path="/communication" element={<Communication />} />
                              <Route path="/collaboration" element={<Collaboration />} />
                              <Route path="/accounting-data" element={<AccountingData />} />
                              <Route path="/data-import" element={<DataImport />} />
                              <Route path="/pdf-documents" element={<PDFDocuments />} />
                              <Route path="/knowledge/*" element={<KnowledgeBase />} />
                              <Route path="/fag/*" element={<KnowledgeBase />} />
                              <Route path="/training" element={<Training />} />
                              <Route path="/teams" element={<TeamManagement />} />
                              <Route path="/organization" element={<OrganizationOverview />} />
                              <Route path="/organization-settings" element={<OrganizationSettings />} />
                              <Route path="/organization-setup" element={<OrganizationSetup />} />
                              <Route path="/user-admin" element={<UserAdmin />} />
                              <Route path="/user-profile" element={<UserProfile />} />
                              <Route path="/audit-logs" element={<AuditLogs />} />
                              <Route path="/ai-usage" element={<AIUsage />} />
                              <Route path="/departments/:departmentId" element={<DepartmentView />} />
                              <Route path="/ledger/:clientId" element={<LedgerPage />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </AppLayout>
                      </OnboardingCheck>
                    } 
                  />
                </Routes>
            </RevyContextProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
