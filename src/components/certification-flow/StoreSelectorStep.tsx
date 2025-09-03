import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import type { StoreMetadata } from '@/hooks/useCertificationFlow';

interface StoreSelectorStepProps {
  onNext: () => void;
  onPrev: () => void;
  onUpdateStore: (metadata: StoreMetadata) => Promise<boolean>;
  onTrackEvent: (eventName: string, metadata?: any) => void;
  isLoading: boolean;
}

export const StoreSelectorStep: React.FC<StoreSelectorStepProps> = ({
  onNext,
  onPrev,
  onUpdateStore,
  onTrackEvent,
  isLoading
}) => {
  const [locationType, setLocationType] = useState<'retailer' | 'pharmacy' | 'direct' | 'other'>('retailer');
  const [storeName, setStoreName] = useState('');
  const [geoConsent, setGeoConsent] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  React.useEffect(() => {
    onTrackEvent('store_selector_viewed');
  }, [onTrackEvent]);

  const handleLocationCapture = () => {
    if (navigator.geolocation && geoConsent) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  React.useEffect(() => {
    handleLocationCapture();
  }, [geoConsent]);

  const handleContinue = async () => {
    if (!storeName.trim()) return;

    const metadata: StoreMetadata = {
      location_type: locationType,
      store_name: storeName.trim(),
      ...(geoLocation && { geo_location: geoLocation })
    };

    const success = await onUpdateStore(metadata);
    if (success) {
      onNext();
    }
  };

  const storeOptions = {
    retailer: ['Best Buy', 'Target', 'Walmart', 'Amazon', 'Other Retailer'],
    pharmacy: ['CVS Pharmacy', 'Walgreens', 'Rite Aid', 'Local Pharmacy', 'Other Pharmacy'],
    direct: ['Brand Website', 'Brand Store', 'Authorized Distributor'],
    other: ['Online Marketplace', 'Social Media', 'Friend/Family', 'Other']
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="w-8 h-8 text-primary" />
          </div>
          
          <CardTitle className="text-2xl font-bold">
            Where did you get this product?
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            This helps us verify your product's authenticity and provide relevant information.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-type">Location Type</Label>
              <Select 
                value={locationType} 
                onValueChange={(value: any) => setLocationType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="direct">Direct from Brand</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="store-name">Store Name</Label>
              <Select 
                value={storeName} 
                onValueChange={setStoreName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or type store name..." />
                </SelectTrigger>
                  <SelectContent>
                    {storeOptions[locationType].filter(store => store && store.trim()).map((store) => (
                      <SelectItem key={store} value={store}>
                        {store}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
              
              {storeName === 'Other Retailer' || storeName === 'Other Pharmacy' || storeName === 'Other' ? (
                <Input
                  className="mt-2"
                  placeholder="Enter store name..."
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              ) : null}
            </div>

            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="geo-consent"
                checked={geoConsent}
                onCheckedChange={(checked) => setGeoConsent(checked === true)}
              />
              <div className="flex-1">
                <Label htmlFor="geo-consent" className="text-sm font-medium cursor-pointer">
                  Share location for verification
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Helps verify product authenticity
                </p>
              </div>
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>

            {geoLocation && (
              <div className="text-xs text-muted-foreground text-center">
                Location captured successfully
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onPrev} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={handleContinue}
              disabled={!storeName.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};