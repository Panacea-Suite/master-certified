import React from 'react';
import { SectionComponent } from '../SectionRegistry';

export const HeaderSection: SectionComponent = ({ section }) => {
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
  return (
    <div className={`header-section ${paddingClass} ${section.config?.backgroundColor === 'primary' ? 'bg-primary' : 'bg-background'}`}>
      {section.config?.logo && (
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-background/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">LOGO</span>
          </div>
        </div>
      )}
    </div>
  );
};