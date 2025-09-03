import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Image, 
  Minus, 
  Type,
  Columns,
  Columns2,
  Columns3,
  ChevronDown,
  ChevronRight,
  Layout,
  User,
  MousePointerClick,
  Shield
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

const sectionCategories = [
  {
    category: 'Content',
    icon: Type,
    sections: [
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
      }
    ]
  },
  {
    category: 'Interactive',
    icon: ChevronDown,
    sections: [
      {
        type: 'cta',
        icon: MousePointerClick,
        title: 'CTA Button',
        description: 'Call-to-action button with page navigation'
      },
      {
        type: 'store_selector',
        icon: ChevronDown,
        title: 'Store Selector',
        description: 'Dropdown for store selection'
      },
      {
        type: 'login_step',
        icon: User,
        title: 'Login Step',
        description: 'User authentication with Google/Apple/Email'
      }
    ]
  },
  {
    category: 'Layout',
    icon: Columns2,
    sections: [
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
      },
      {
        type: 'footer',
        icon: Layout,
        title: 'Footer',
        description: 'Panacea branding footer'
      }
    ]
  }
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Content': true,
    'Interactive': true,
    'Layout': true
  });

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">Drag Sections</h4>
      
      <div className="space-y-3">
        {sectionCategories.map((category) => {
          const CategoryIcon = category.icon;
          const isOpen = openCategories[category.category];
          
          return (
            <Collapsible 
              key={category.category}
              open={isOpen}
              onOpenChange={() => toggleCategory(category.category)}
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent"
                  onClick={() => toggleCategory(category.category)}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-4 w-4" />
                    {category.category}
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2 pt-2">
                {category.sections.map((section) => {
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
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
        💡 Drag sections to add them to the page
      </div>
    </div>
  );
};