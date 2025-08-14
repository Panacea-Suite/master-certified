import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Trash2, 
  Waves, 
  ClipboardList, 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  Shield 
} from 'lucide-react';

interface FlowComponentData {
  id: string;
  type: string;
  order: number;
  config: any;
}

interface FlowComponentProps {
  component: FlowComponentData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const componentIcons = {
  welcome: Waves,
  registration_form: ClipboardList,
  content_display: FileText,
  survey_form: MessageSquare,
  verification: Shield,
  completion: CheckCircle2
};

const componentLabels = {
  welcome: 'Welcome',
  registration_form: 'Registration',
  content_display: 'Content',
  survey_form: 'Survey',
  verification: 'Verification',
  completion: 'Completion'
};

export const FlowComponent: React.FC<FlowComponentProps> = ({
  component,
  isSelected,
  onSelect,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = componentIcons[component.type as keyof typeof componentIcons] || FileText;
  const label = componentLabels[component.type as keyof typeof componentLabels] || component.type;

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`cursor-pointer transition-colors ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {component.config?.title || label}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {component.order + 1}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {label}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive hover:text-destructive h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};