import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { useViewMode } from '@/hooks/useViewMode';

export const BrandViewModeSelector: React.FC = () => {
  const { 
    isViewingAsBrand, 
    toggleViewMode, 
    canViewAsBrand, 
    selectedBrandForView,
    setSelectedBrandForView,
    availableBrandsForView
  } = useViewMode();

  if (!canViewAsBrand) return null;

  return (
    <div className="flex items-center gap-3">
      {isViewingAsBrand && (
        <>
          <Select
            value={selectedBrandForView?.id || ''}
            onValueChange={(value) => {
              const brand = availableBrandsForView.find(b => b.id === value);
              setSelectedBrandForView(brand || null);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a brand..." />
            </SelectTrigger>
            <SelectContent>
              {availableBrandsForView.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedBrandForView && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
              Viewing as: {selectedBrandForView.name}
            </Badge>
          )}
        </>
      )}
      
      <Button
        onClick={toggleViewMode}
        variant={isViewingAsBrand ? 'destructive' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
      >
        {isViewingAsBrand ? (
          <>
            <EyeOff className="w-4 h-4" />
            Exit Brand View
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            View as Brand
          </>
        )}
      </Button>
    </div>
  );
};