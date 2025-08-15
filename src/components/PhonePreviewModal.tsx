import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomerFlowExperience from './CustomerFlowExperience';

interface PhonePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateData: any;
}

export const PhonePreviewModal: React.FC<PhonePreviewModalProps> = ({
  isOpen,
  onClose,
  templateData
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Reset page index when modal opens or template changes
  useEffect(() => {
    if (isOpen) {
      setCurrentPageIndex(0);
      // Extract pages from template data to get total count
      const { processTemplateData } = require('@/utils/templateProcessor');
      try {
        const processedTemplate = processTemplateData(templateData);
        setTotalPages(processedTemplate.pages?.length || 0);
      } catch (error) {
        console.error('Error processing template for page count:', error);
        setTotalPages(0);
      }
    }
  }, [isOpen, templateData]);

  const handlePreviousPage = () => {
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  const handleNextPage = () => {
    setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1));
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-fit p-0 bg-transparent border-none shadow-none">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -top-12 -right-2 z-50 bg-background border shadow-sm hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Phone frame */}
          <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
            {/* Phone screen */}
            <div className="bg-black rounded-[2rem] p-1">
              <div className="bg-white rounded-[1.8rem] overflow-hidden relative">
                {/* iPhone notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                
                {/* Screen content */}
                <div className="w-[390px] h-[844px] overflow-hidden relative">
                  <CustomerFlowExperience
                    templateData={templateData}
                    qrCode="phone-preview"
                    externalPageIndex={currentPageIndex}
                    hideInternalNavigation={true}
                  />
                </div>
              </div>
            </div>
            
            {/* Phone details */}
            <div className="absolute -right-1 top-24 w-1 h-12 bg-gray-700 rounded-l-sm"></div>
            <div className="absolute -right-1 top-40 w-1 h-16 bg-gray-700 rounded-l-sm"></div>
            <div className="absolute -right-1 top-60 w-1 h-16 bg-gray-700 rounded-l-sm"></div>
            <div className="absolute -left-1 top-32 w-1 h-8 bg-gray-700 rounded-r-sm"></div>
          </div>
          
          {/* External Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPageIndex === 0}
                className="bg-background"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPageIndex + 1} of {totalPages}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, index) => (
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
                disabled={currentPageIndex === totalPages - 1}
                className="bg-background"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};