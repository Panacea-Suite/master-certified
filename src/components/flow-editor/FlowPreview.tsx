import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobilePreview } from './MobilePreview';
import { PageData } from './PageManager';
import { TemplateStyleProvider } from '@/components/TemplateStyleProvider';

export interface DeviceSpec {
  name: string;
  displayName: string;
  width: number;
  height: number;
}

export const DEVICE_SPECS: DeviceSpec[] = [
  { name: 'iphone14', displayName: 'iPhone 14', width: 390, height: 844 },
  { name: 'iphone13', displayName: 'iPhone 13', width: 390, height: 844 },
  { name: 'iphoneSE', displayName: 'iPhone SE', width: 375, height: 667 },
  { name: 'iphone14Plus', displayName: 'iPhone 14 Plus', width: 428, height: 926 },
  { name: 'iphone14ProMax', displayName: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'galaxyS23', displayName: 'Samsung Galaxy S23', width: 360, height: 780 },
  { name: 'pixel7', displayName: 'Google Pixel 7', width: 412, height: 915 },
];

interface FlowPreviewProps {
  pages: PageData[];
  currentPageId: string;
  onSelectPage: (pageId: string) => void;
  selectedSectionId?: string;
  onSelectSection?: (section: any) => void;
  onAddSection?: (sectionType: string, position?: number, parentId?: string, columnIndex?: number) => void;
  backgroundColor?: string;
  globalHeader?: {
    showHeader: boolean;
    brandName: string;
    logoUrl: string;
    backgroundColor: string;
    logoSize: string;
  };
  templateId?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const FlowPreview: React.FC<FlowPreviewProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  selectedSectionId,
  onSelectSection,
  onAddSection,
  backgroundColor = '#ffffff',
  globalHeader = {
    showHeader: true,
    brandName: 'Brand',
    logoUrl: '',
    backgroundColor: '#ffffff',
    logoSize: 'medium'
  },
  templateId,
  brandColors
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceSpec>(DEVICE_SPECS[0]); // Default to iPhone 14
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const currentPage = pages[currentPageIndex];

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      onSelectPage(pages[currentPageIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      onSelectPage(pages[currentPageIndex + 1].id);
    }
  };

  if (!currentPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Home className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-medium text-lg">No Pages</h3>
            <p className="text-muted-foreground text-sm">
              Add a page to start building your flow
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TemplateStyleProvider templateId={templateId} brandColors={brandColors}>
      <div className="flex flex-col h-full">
        {/* Header with Title, Device Selector, and Page Navigation */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h3 className="text-lg font-semibold">Flow Preview</h3>
          <div className="flex items-center gap-4">
            {/* Page Navigation - only show if multiple pages */}
            {pages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPageIndex + 1} of {pages.length}
                  </span>
                  <div className="flex gap-1">
                    {pages.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPageIndex ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
            
            {/* Device Selector */}
            <Select
              value={selectedDevice.name}
              onValueChange={(value) => {
                const device = DEVICE_SPECS.find(d => d.name === value);
                if (device) setSelectedDevice(device);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {DEVICE_SPECS.map((device) => (
                  <SelectItem key={device.name} value={device.name}>
                    {device.displayName} ({device.width}×{device.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Mobile Preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          <MobilePreview
            sections={currentPage.sections.sort((a, b) => a.order - b.order)}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
            onAddSection={onAddSection}
            backgroundColor={backgroundColor}
            globalHeader={globalHeader}
            deviceSpec={selectedDevice}
          />
        </div>
        
        {/* Current Page Info */}
        <div className="p-4 border-t bg-muted/30 text-center">
          <h4 className="font-medium text-sm">{currentPage.name}</h4>
          <p className="text-xs text-muted-foreground capitalize">
            {currentPage.type.replace('_', ' ')} • {currentPage.sections.length} sections
          </p>
        </div>
      </div>
    </TemplateStyleProvider>
  );
};