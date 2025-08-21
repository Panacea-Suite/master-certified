import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewModeProvider } from "@/hooks/useViewMode";
import { AdminShell } from "@/components/shells/AdminShell";
import { CustomerShell } from "@/components/shells/CustomerShell";
import { TestFlowGate } from "@/pages/TestFlowGate";
import { CustomerFlowRun } from "@/pages/CustomerFlowRun";
import AdminIndex from "./pages/AdminIndex";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              {/* Customer flow routes - no admin chrome */}
              <Route path="/flow/test" element={
                <CustomerShell>
                  <TestFlowGate />
                </CustomerShell>
              } />
              <Route path="/flow/run" element={
                <CustomerShell>
                  <CustomerFlowRun />
                </CustomerShell>
              } />
              
              {/* Admin routes - with admin chrome */}
              <Route path="/" element={
                <AdminShell>
                  <AdminIndex />
                </AdminShell>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Catch-all route */}
              <Route path="*" element={
                <AdminShell>
                  <NotFound />
                </AdminShell>
              } />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </ViewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
