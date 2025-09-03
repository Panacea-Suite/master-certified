import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { PanaceaFooter } from '@/components/PanaceaFooter';

export const FooterSection: SectionComponent = ({ section }) => {
  const { config } = section;
  const paddingValue = `${(section.config?.padding ?? 4) * 0.25}rem`;
  
  return (
    <div style={{ padding: paddingValue }}>
      <PanaceaFooter 
        backgroundColor={config.backgroundColor === 'transparent' ? undefined : config.backgroundColor} 
        logoSize={config.logoSize || 120}
      />
    </div>
  );
};