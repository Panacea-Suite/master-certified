import React from 'react';

interface PanaceaFooterProps {
  backgroundColor?: string;
  logoSize?: number;
}

export const PanaceaFooter: React.FC<PanaceaFooterProps> = ({ 
  backgroundColor,
  logoSize = 60
}) => {
  // Use brand's secondary color as default
  const finalBackgroundColor = backgroundColor || '#f8bc55';
  
  console.log('PanaceaFooter render:', { backgroundColor, finalBackgroundColor });
  
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