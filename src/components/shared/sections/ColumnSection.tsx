import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { SafeSectionRenderer } from '../SectionRegistry';

export const ColumnSection: SectionComponent = ({ section, ...props }) => {
  const { config } = section;
  
  // Handle column layouts
  const getColumnClasses = () => {
    switch (config.layout) {
      case '2-col-50-50':
        return 'grid grid-cols-2 gap-4';
      case '2-col-30-70':
        return 'grid grid-cols-[30%_70%] gap-4';
      case '2-col-70-30':
        return 'grid grid-cols-[70%_30%] gap-4';
      case '3-col':
        return 'grid grid-cols-3 gap-4';
      default:
        return 'grid grid-cols-2 gap-4';
    }
  };

  return (
    <div 
      className={`column-section ${getColumnClasses()}`}
      style={{
        gap: config.gap ? `${config.gap * 0.25}rem` : undefined,
        padding: config.padding ? `${config.padding * 0.25}rem` : undefined,
        backgroundColor: config.backgroundColor || undefined
      }}
    >
      {section.children?.map((columnSections, columnIndex) => (
        <div key={columnIndex} className="column-content">
          {columnSections?.map((childSection) => (
            <SafeSectionRenderer
              key={childSection.id}
              section={childSection}
              {...props}
            />
          ))}
        </div>
      ))}
    </div>
  );
};