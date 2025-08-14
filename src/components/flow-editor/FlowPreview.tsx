import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { MobilePreview } from './MobilePreview';
import { PageData } from './PageManager';

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
  }
}) => {
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
    <div className="flex flex-col h-full">
      {/* Page Navigation */}
      {pages.length > 1 && (
        <div className="flex items-center justify-between p-4 border-b bg-background">
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
        </div>
      )}
      
      {/* Mobile Preview */}
      <div className="flex-1 flex items-center justify-center p-8">
        <MobilePreview
          sections={currentPage.sections.sort((a, b) => a.order - b.order)}
          selectedSectionId={selectedSectionId}
          onSelectSection={onSelectSection}
          onAddSection={onAddSection}
          backgroundColor={backgroundColor}
          globalHeader={globalHeader}
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
  );
};