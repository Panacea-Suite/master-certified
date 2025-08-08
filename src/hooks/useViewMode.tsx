import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ViewModeContextType {
  isViewingAsBrand: boolean;
  toggleViewMode: () => void;
  effectiveRole: 'master_admin' | 'brand_admin' | 'customer';
  canViewAsBrand: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [isViewingAsBrand, setIsViewingAsBrand] = useState(false);

  const canViewAsBrand = profile?.role === 'master_admin';
  
  const effectiveRole = isViewingAsBrand && canViewAsBrand ? 'brand_admin' : (profile?.role || 'customer');

  const toggleViewMode = () => {
    if (canViewAsBrand) {
      setIsViewingAsBrand(!isViewingAsBrand);
    }
  };

  return (
    <ViewModeContext.Provider value={{
      isViewingAsBrand,
      toggleViewMode,
      effectiveRole,
      canViewAsBrand
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};