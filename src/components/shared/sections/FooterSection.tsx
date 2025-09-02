import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { PanaceaFooter } from '@/components/PanaceaFooter';

export const FooterSection: SectionComponent = ({ section }) => {
  const { config } = section;
  
  return (
    <PanaceaFooter 
      backgroundColor={config.backgroundColor} 
      logoSize={config.logoSize || 120}
    />
  );
};