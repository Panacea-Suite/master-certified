import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SectionComponent } from '../SectionRegistry';

export const StoreSelector: SectionComponent = ({ 
  section,
  storeOptions = [],
  brandColors,
  purchaseChannel,
  selectedStore,
  onPurchaseChannelChange,
  onSelectedStoreChange,
  onNavigateToPage
}) => {
  const [previewPurchaseChannel, setPreviewPurchaseChannel] = useState<string>('');
  const [previewSelectedStore, setPreviewSelectedStore] = useState<string>('');
  
  const { config } = section;
  
  // Helper function to get padding style with backward compatibility
  const getPaddingStyle = () => {
    const paddingTop = config.paddingTop ?? config.padding ?? 1;
    const paddingRight = config.paddingRight ?? config.padding ?? 1;
    const paddingBottom = config.paddingBottom ?? config.padding ?? 1;
    const paddingLeft = config.paddingLeft ?? config.padding ?? 1;
    
    return {
      paddingTop: `${paddingTop}rem`,
      paddingRight: `${paddingRight}rem`,
      paddingBottom: `${paddingBottom}rem`,
      paddingLeft: `${paddingLeft}rem`
    };
  };
  
  // Use controlled props if provided, otherwise use internal state
  const isControlled = purchaseChannel !== undefined && onPurchaseChannelChange !== undefined;
  const currentPurchaseChannel = isControlled ? purchaseChannel! : previewPurchaseChannel;
  const currentSelectedStore = isControlled ? (selectedStore || '') : previewSelectedStore;
  
  const handlePurchaseChannelChange = (channel: 'in-store' | 'online' | '') => {
    if (isControlled && onPurchaseChannelChange) {
      onPurchaseChannelChange(channel);
    } else {
      setPreviewPurchaseChannel(channel);
      setPreviewSelectedStore(''); // Reset store selection
    }
  };
  
  const handleSelectedStoreChange = (store: string) => {
    if (isControlled && onSelectedStoreChange) {
      onSelectedStoreChange(store);
    } else {
      setPreviewSelectedStore(store);
    }
  };

  // Use actual store options if provided, otherwise fall back to config
  const availableStores = storeOptions.length > 0 
    ? storeOptions.filter((option: string) => option && option.trim()) 
    : (config.storeOptions 
        ? config.storeOptions.split('\n').filter((option: string) => option && option.trim()) 
        : ['Downtown Location', 'Mall Branch', 'Airport Store']);

  return (
    <div 
      className="store-selector-section space-y-4"
      style={{ 
        ...getPaddingStyle(),
        color: config.textColor || 'inherit',
        backgroundColor: config.backgroundColor || 'transparent'
      }}
    >
      {!currentPurchaseChannel ? (
        // Step 1: Purchase Channel Selection
        <div className="space-y-3">
          <button
            className="w-full h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 whitespace-nowrap"
            style={{
              backgroundColor: config.borderColor || brandColors?.primary || '#3b82f6',
              color: 'white',
              border: `1px solid ${config.borderColor || brandColors?.primary || '#3b82f6'}`,
              '--tw-ring-color': config.focusBorderColor || brandColors?.primary || '#3b82f6'
            } as React.CSSProperties}
            onClick={(e) => {
              e.stopPropagation();
              handlePurchaseChannelChange('in-store');
            }}
          >
            In-store
          </button>
          <button
            className="w-full h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 whitespace-nowrap"
            style={{
              backgroundColor: 'transparent',
              color: config.borderColor || brandColors?.primary || '#3b82f6',
              border: `1px solid ${config.borderColor || brandColors?.primary || '#3b82f6'}`,
              '--tw-ring-color': config.focusBorderColor || brandColors?.primary || '#3b82f6'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${config.borderColor || brandColors?.primary || '#3b82f6'}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePurchaseChannelChange('online');
            }}
          >
            Online
          </button>
        </div>
      ) : (
        // Step 2: Store Selection
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: config.textColor || 'inherit' }}>Purchase channel:</span>
            <span 
              className="font-medium"
              style={{ color: config.textColor || 'inherit' }}
            >
              {currentPurchaseChannel === 'in-store' ? 'In-store' : 'Online'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePurchaseChannelChange('');
              }}
              className="text-xs underline h-auto p-0"
              style={{ color: config.textColor || 'inherit' }}
            >
              Change
            </Button>
          </div>
          
          <div>
            <Label 
              htmlFor="store"
              style={{ color: config.textColor || 'inherit' }}
            >
              Select Store
            </Label>
            <Select 
              value={currentSelectedStore} 
              onValueChange={handleSelectedStoreChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your store" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                {availableStores.map((store: string) => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
                <SelectItem value="other">Other Store</SelectItem>
              </SelectContent>
            </Select>
            <div className="pt-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentSelectedStore && onNavigateToPage) {
                    onNavigateToPage('next');
                  }
                }}
                disabled={!currentSelectedStore}
                aria-disabled={!currentSelectedStore}
                aria-label="Submit selected store"
                style={{
                  backgroundColor: currentSelectedStore 
                    ? (config.borderColor || brandColors?.primary || '#3b82f6')
                    : `${config.borderColor || brandColors?.primary || '#3b82f6'}40`,
                  borderColor: currentSelectedStore 
                    ? (config.borderColor || brandColors?.primary || '#3b82f6')
                    : `${config.borderColor || brandColors?.primary || '#3b82f6'}60`,
                  color: currentSelectedStore ? 'white' : `${config.borderColor || brandColors?.primary || '#3b82f6'}80`
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};