import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { PanaceaFooter } from '@/components/PanaceaFooter';

export const FooterSection: SectionComponent = ({ section }) => {
  const { config } = section;
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
  return (
    <div className={paddingClass}>
      <PanaceaFooter 
        backgroundColor={config.backgroundColor === 'transparent' ? undefined : config.backgroundColor} 
        logoSize={config.logoSize || 120}
      />
    </div>
  );
};