import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
        </div>
      </DialogContent>
    </Dialog>
  );
};