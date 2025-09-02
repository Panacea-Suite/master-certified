import React from 'react';
import { SectionComponent } from '../SectionRegistry';

export const HeroSection: SectionComponent = ({ section }) => {
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
  return (
    <div className={`hero-section ${paddingClass} ${section.config?.align === 'center' ? 'text-center' : ''}`}>
      {section.config?.title && (
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {section.config.title}
        </h1>
      )}
      {section.config?.subtitle && (
        <h2 className="text-lg font-medium text-muted-foreground mb-2">
          {section.config.subtitle}
        </h2>
      )}
      {section.config?.description && (
        <p className="text-sm text-muted-foreground">
          {section.config.description}
        </p>
      )}
    </div>
  );
};