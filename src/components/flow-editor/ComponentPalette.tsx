import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Waves, 
  ClipboardList, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Shield 
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (componentType: string) => void;
}

const componentTypes = [
  {
    type: 'welcome',
    icon: Waves,
    title: 'Welcome Screen',
    description: 'Greet users and introduce your brand'
  },
  {
    type: 'registration_form',
    icon: ClipboardList,
    title: 'Registration Form',
    description: 'Collect user information'
  },
  {
    type: 'content_display',
    icon: FileText,
    title: 'Content Display',
    description: 'Show text, images, or videos'
  },
  {
    type: 'survey_form',
    icon: MessageSquare,
    title: 'Survey Form',
    description: 'Gather feedback and ratings'
  },
  {
    type: 'verification',
    icon: Shield,
    title: 'Verification',
    description: 'Email or SMS verification step'
  },
  {
    type: 'completion',
    icon: CheckCircle2,
    title: 'Completion',
    description: 'Thank you and final message'
  }
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-muted-foreground">Add Components</h4>
      <div className="space-y-2">
        {componentTypes.map((component) => {
          const Icon = component.icon;
          return (
            <Button
              key={component.type}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => onAddComponent(component.type)}
            >
              <div className="flex items-center gap-3 w-full">
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm">{component.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {component.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};