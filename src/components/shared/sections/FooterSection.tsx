import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { PanaceaFooter } from '@/components/PanaceaFooter';

export const FooterSection: SectionComponent = ({ section }) => {
  const { config } = section;
  
  // Helper function to get padding style with backward compatibility
  const getPaddingStyle = () => {
    const paddingTop = config.paddingTop ?? config.padding ?? 1;
    const paddingRight = config.paddingRight ?? config.padding ?? 1;
    const paddingBottom = config.paddingBottom ?? config.padding ?? 1;
    const paddingLeft = config.paddingLeft ?? config.padding ?? 1;
    
    return {
      paddingTop: `${paddingTop}rem`,
      paddingRight: `${paddingRight}rem`,
      paddingBottom: `${paddingBottom}rem`,
      paddingLeft: `${paddingLeft}rem`
    };
  };
  
  return (
    <div style={getPaddingStyle()}>
      <PanaceaFooter 
        backgroundColor={config.backgroundColor === 'transparent' ? undefined : config.backgroundColor} 
        logoSize={config.logoSize || 120}
      />
    </div>
  );
};