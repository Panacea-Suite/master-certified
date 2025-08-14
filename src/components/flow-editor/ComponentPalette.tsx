import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Image, 
  Minus, 
  Type,
  Columns,
  Columns2,
  Columns3
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

const sectionTypes = [
  {
    type: 'text',
    icon: Type,
    title: 'Text Section',
    description: 'Add text content with formatting'
  },
  {
    type: 'image',
    icon: Image,
    title: 'Image Section',
    description: 'Add images with captions'
  },
  {
    type: 'divider',
    icon: Minus,
    title: 'Divider',
    description: 'Add visual separators'
  },
  {
    type: 'column',
    icon: Columns2,
    title: 'Column Layout',
    description: 'Create multi-column sections'
  }
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Drag Sections</h4>
      <div className="space-y-2">
        {sectionTypes.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.type}
              className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', section.type);
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {section.description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
        💡 Drag sections to the page preview to add them
      </div>
    </div>
  );
};