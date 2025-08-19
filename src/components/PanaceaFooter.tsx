import React from 'react';

interface PanaceaFooterProps {
  backgroundColor?: string;
  logoSize?: number;
}

export const PanaceaFooter: React.FC<PanaceaFooterProps> = ({ 
  backgroundColor,
  logoSize = 60
}) => {
  // Use secondary brand color as default for certification flows
  const finalBackgroundColor = backgroundColor || 'var(--template-secondary)';
  
  return (
    <div 
      className="pt-6 pb-8 flex justify-center"
      style={{ backgroundColor: finalBackgroundColor }}
    >
      <img 
        src="/lovable-uploads/4983a5bb-4435-4141-9e62-8240ed8dce24.png" 
        alt="Powered by Panacea" 
        className="object-contain block opacity-80 hover:opacity-100 transition-opacity"
        style={{ height: `${logoSize}px` }}
      />
    </div>
  );
};