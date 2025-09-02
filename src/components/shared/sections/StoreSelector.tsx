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
  onSelectedStoreChange
}) => {
  const [previewPurchaseChannel, setPreviewPurchaseChannel] = useState<string>('');
  const [previewSelectedStore, setPreviewSelectedStore] = useState<string>('');
  
  const { config } = section;
  
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
  const availableStores = storeOptions.length > 0 ? storeOptions : 
    (config.storeOptions ? config.storeOptions.split('\n').filter((option: string) => option.trim()) : 
    ['Downtown Location', 'Mall Branch', 'Airport Store']);

  return (
    <div className="store-selector-section space-y-4">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Purchase channel:</span>
            <span className="font-medium">
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
            >
              Change
            </Button>
          </div>
          
          <div>
            <Label htmlFor="store">Select Store</Label>
            <Select 
              value={currentSelectedStore} 
              onValueChange={handleSelectedStoreChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your store" />
              </SelectTrigger>
              <SelectContent>
                {availableStores.map((store: string) => (
                  <SelectItem key={store} value={store}>{store}</SelectItem>
                ))}
                <SelectItem value="other">Other Store</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};