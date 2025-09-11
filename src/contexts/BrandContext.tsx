import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewMode } from '@/hooks/useViewMode';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  brand_colors?: any;
  approved_stores?: string[];
  updated_at?: string;
}

interface BrandContextType {
  currentBrand: Brand | null;
  availableBrands: Brand[];
  isLoading: boolean;
  setSelectedBrand: (brandId: string) => void;
  refreshBrands: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrandContext = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrandContext must be used within a BrandProvider');
  }
  return context;
};

interface BrandProviderProps {
  children: ReactNode;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ children }) => {
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isViewingAsBrand, selectedBrandForView } = useViewMode();

  const fetchBrands = async () => {
    // Don't fetch user's own brands when in view mode
    if (isViewingAsBrand) {
      setCurrentBrand(null);
      setAvailableBrands([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentBrand(null);
        setAvailableBrands([]);
        return;
      }

      const { data: brandsData, error } = await supabase
        .from('brands')
        .select('id, name, logo_url, brand_colors, approved_stores, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const brands = brandsData || [];
      setAvailableBrands(brands);

      // Get saved brand ID from localStorage
      const savedBrandId = localStorage.getItem('selectedBrandId');
      let selectedBrand = brands.find(b => b.id === savedBrandId) || brands[0] || null;

      // If saved ID is stale, update localStorage with the current selection
      if (savedBrandId && !brands.find(b => b.id === savedBrandId) && selectedBrand) {
        localStorage.setItem('selectedBrandId', selectedBrand.id);
      }

      setCurrentBrand(selectedBrand);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setCurrentBrand(null);
      setAvailableBrands([]);
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedBrand = (brandId: string) => {
    const brand = availableBrands.find(b => b.id === brandId);
    if (brand) {
      setCurrentBrand(brand);
      localStorage.setItem('selectedBrandId', brandId);
    }
  };

  const refreshBrands = async () => {
    setIsLoading(true);
    await fetchBrands();
  };

  useEffect(() => {
    fetchBrands();
  }, [isViewingAsBrand]); // Re-fetch when view mode changes

  // Use selected brand for view when in view mode, otherwise use actual current brand
  const effectiveCurrentBrand = isViewingAsBrand && selectedBrandForView ? selectedBrandForView : currentBrand;

  const value: BrandContextType = {
    currentBrand: effectiveCurrentBrand,
    availableBrands,
    isLoading,
    setSelectedBrand,
    refreshBrands,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};