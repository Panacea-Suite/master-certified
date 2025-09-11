import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
}

interface ViewModeContextType {
  isViewingAsBrand: boolean;
  toggleViewMode: () => void;
  effectiveRole: 'master_admin' | 'brand_admin' | 'customer';
  canViewAsBrand: boolean;
  selectedBrandForView: Brand | null;
  setSelectedBrandForView: (brand: Brand | null) => void;
  availableBrandsForView: Brand[];
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [isViewingAsBrand, setIsViewingAsBrand] = useState(false);
  const [selectedBrandForView, setSelectedBrandForView] = useState<Brand | null>(null);
  const [availableBrandsForView, setAvailableBrandsForView] = useState<Brand[]>([]);

  const canViewAsBrand = profile?.role === 'master_admin';
  
  const effectiveRole = isViewingAsBrand && canViewAsBrand ? 'brand_admin' : (profile?.role || 'customer');

  const toggleViewMode = () => {
    if (canViewAsBrand) {
      setIsViewingAsBrand(!isViewingAsBrand);
      if (!isViewingAsBrand && availableBrandsForView.length === 0) {
        fetchAllBrands();
      }
      if (isViewingAsBrand) {
        setSelectedBrandForView(null);
      }
    }
  };

  const fetchAllBrands = async () => {
    if (!canViewAsBrand) return;
    
    try {
      const { data: brandsData, error } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .order('name');

      if (error) throw error;
      setAvailableBrandsForView(brandsData || []);
    } catch (error) {
      console.error('Error fetching brands for view mode:', error);
    }
  };

  const handleSetSelectedBrandForView = (brand: Brand | null) => {
    setSelectedBrandForView(brand);
  };

  useEffect(() => {
    if (canViewAsBrand && isViewingAsBrand) {
      fetchAllBrands();
    }
  }, [canViewAsBrand, isViewingAsBrand]);

  return (
    <ViewModeContext.Provider value={{
      isViewingAsBrand,
      toggleViewMode,
      effectiveRole,
      canViewAsBrand,
      selectedBrandForView,
      setSelectedBrandForView: handleSetSelectedBrandForView,
      availableBrandsForView
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