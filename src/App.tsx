import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewModeProvider } from "@/hooks/useViewMode";
import { AdminShell } from "@/components/shells/AdminShell";
import { CustomerShell } from "@/components/shells/CustomerShell";
import AdminIndex from "./pages/AdminIndex";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import { TestFlow } from "./pages/TestFlow";
import { FlowRun } from "./pages/FlowRun";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to determine which shell to use based on the route
const ShellRouter = () => {
  const location = useLocation();
  const isFlowRoute = location.pathname.startsWith('/flow');

  return (
    <Routes>
      {/* Customer flow routes - no admin chrome */}
      <Route path="/flow/test" element={
        <CustomerShell>
          <TestFlow />
        </CustomerShell>
      } />
      <Route path="/flow/run" element={
        <CustomerShell>
          <FlowRun />
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <ShellRouter />
          </HashRouter>
        </TooltipProvider>
      </ViewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
