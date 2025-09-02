import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewModeProvider } from "@/hooks/useViewMode";
import { BrandProvider } from "@/contexts/BrandContext";
import { AdminShell } from "@/components/shells/AdminShell";
import { CustomerShell } from "@/components/shells/CustomerShell";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { TestFlowGate } from "@/pages/TestFlowGate";
import { CustomerFlowRun } from "@/pages/CustomerFlowRun";
import { QrRedirect } from "@/pages/QrRedirect";
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

const App = () => {
  const isCustomerRoute = () => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    return pathname.startsWith('/flow') || 
           hash.startsWith('#/flow') || 
           hash.startsWith('#/qr') ||
           hash === '#/not-found';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandProvider>
          <ViewModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <HashRouter>
                <LocationLogger />
                <Routes>
                  {/* Customer-only routes - no auth required, no admin shell */}
                  <Route path="/qr/:uniqueCode" element={<QrRedirect />} />
                  <Route path="/flow/test" element={<CustomerShell><TestFlowGate /></CustomerShell>} />
                  <Route path="/flow/run" element={<ErrorBoundary><CustomerShell><CustomerFlowRun /></CustomerShell></ErrorBoundary>} />
                  <Route path="/flow/run/:id" element={<ErrorBoundary><CustomerShell><CustomerFlowRun /></CustomerShell></ErrorBoundary>} />
                  <Route path="/not-found" element={<CustomerShell><NotFound /></CustomerShell>} />
                  
                  {/* Admin routes - require auth, use admin shell */}
                  <Route path="/" element={<AdminShell><AdminIndex /></AdminShell>} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Catch-all route - check if customer or admin */}
                  <Route path="*" element={
                    <>
                      {isCustomerRoute() ? (
                        <CustomerShell><NotFound /></CustomerShell>
                      ) : (
                        <AdminShell><NotFound /></AdminShell>
                      )}
                    </>
                  } />
                </Routes>
              </HashRouter>
            </TooltipProvider>
          </ViewModeProvider>
        </BrandProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
