import React from 'react';

interface PanaceaFooterProps {
  backgroundColor?: string;
}

export const PanaceaFooter: React.FC<PanaceaFooterProps> = ({ 
  backgroundColor = 'transparent' 
}) => {
  return (
    <div 
      className="pt-6 pb-8 border-t border-border/50 flex justify-center"
      style={{ backgroundColor }}
    >
      <img 
        src="/lovable-uploads/4983a5bb-4435-4141-9e62-8240ed8dce24.png" 
        alt="Powered by Panacea" 
        className="h-12 object-contain block opacity-80 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};