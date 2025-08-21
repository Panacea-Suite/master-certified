import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
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

// Debug component to log location changes
const LocationLogger = () => {
  const location = useLocation();
  console.log('Current location:', { 
    pathname: location.pathname, 
    search: location.search, 
    hash: location.hash,
    state: location.state
  });
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <LocationLogger />
            <Routes>
              {/* Customer flow routes - no admin chrome */}
              <Route path="/flow/test" element={
                <>
                  <CustomerShell>
                    <TestFlowGate />
                  </CustomerShell>
                </>
              } />
              <Route path="/flow/run/:qrId" element={
                <>
                  <CustomerShell>
                    <CustomerFlowRun />
                  </CustomerShell>
                </>
              } />
              
              {/* Admin routes - with admin chrome */}
              <Route path="/" element={
                <>
                  {console.log('Rendering AdminIndex route')}
                  <AdminShell>
                    <AdminIndex />
                  </AdminShell>
                </>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Catch-all route */}
              <Route path="*" element={
                <>
                  {console.log('Rendering catch-all route for:', window.location.hash)}
                  <AdminShell>
                    <NotFound />
                  </AdminShell>
                </>
              } />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </ViewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
