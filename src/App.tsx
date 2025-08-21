import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewModeProvider } from "@/hooks/useViewMode";
import { CustomerApp } from "@/components/apps/CustomerApp";
import { AdminApp } from "@/components/apps/AdminApp";

const queryClient = new QueryClient();

// Top-level router that splits customer vs admin routes
const RootRouter = () => {
  const location = useLocation();
  const isCustomerRoute = location.pathname.startsWith('/flow');

  // Customer routes get their own app with no admin chrome
  if (isCustomerRoute) {
    return <CustomerApp />;
  }

  // Everything else goes to admin app
  return <AdminApp />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <RootRouter />
          </HashRouter>
        </TooltipProvider>
      </ViewModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
