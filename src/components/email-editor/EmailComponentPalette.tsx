import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Type, 
  Image, 
  MousePointerClick, 
  Minus,
  Columns2,
  Mail,
  ChevronDown,
  ChevronRight,
  Palette,
  Layout,
  Settings
} from 'lucide-react';

interface EmailComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

const emailComponentCategories = [
  {
    category: 'Content',
    icon: Type,
    components: [
      {
        type: 'email_header',
        icon: Layout,
        title: 'Email Header',
        description: 'Brand header with logo'
      },
      {
        type: 'email_heading',
        icon: Type,
        title: 'Heading',
        description: 'Email heading text'
      },
      {
        type: 'email_text',
        icon: Type,
        title: 'Text Block',
        description: 'Body text with formatting'
      },
      {
        type: 'email_image',
        icon: Image,
        title: 'Image',
        description: 'Responsive email image'
      }
    ]
  },
  {
    category: 'Interactive',
    icon: MousePointerClick,
    components: [
      {
        type: 'email_button',
        icon: MousePointerClick,
        title: 'CTA Button',
        description: 'Call-to-action button'
      },
      {
        type: 'email_link',
        icon: MousePointerClick,
        title: 'Text Link',
        description: 'Inline text link'
      }
    ]
  },
  {
    category: 'Layout',
    icon: Columns2,
    components: [
      {
        type: 'email_divider',
        icon: Minus,
        title: 'Divider',
        description: 'Horizontal separator'
      },
      {
        type: 'email_spacer',
        icon: Layout,
        title: 'Spacer',
        description: 'Vertical spacing'
      },
      {
        type: 'email_footer',
        icon: Mail,
        title: 'Footer',
        description: 'Email footer with unsubscribe'
      }
    ]
  }
];

export const EmailComponentPalette: React.FC<EmailComponentPaletteProps> = ({ onAddComponent }) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    'Content': true,
    'Interactive': true,
    'Layout': true
  });

  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-4">
      <Collapsible open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Email Components
            </div>
            {isPaletteOpen ? (
              <ChevronDown className="h-4 w-4 transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 pt-2">
          {emailComponentCategories.map((category) => {
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
                  {category.components.map((component) => {
                    const Icon = component.icon;
                    return (
                      <Card 
                        key={component.type}
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', component.type);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left min-w-0">
                              <div className="font-medium text-sm">{component.title}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {component.description}
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
          
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            💡 Drag components to build your email template
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};