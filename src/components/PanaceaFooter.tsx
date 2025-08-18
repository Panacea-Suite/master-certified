import React from 'react';
import panaceaLogo from '@/assets/powered-by-panacea.png';

export const PanaceaFooter: React.FC = () => {
  return (
    <div className="mt-8 pt-6 border-t border-border/50 flex justify-center">
      <img 
        src={panaceaLogo} 
        alt="Powered by Panacea" 
        className="h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};