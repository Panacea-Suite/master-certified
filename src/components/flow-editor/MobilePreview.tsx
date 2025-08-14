import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  CheckCircle,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface FlowComponentData {
  id: string;
  type: string;
  order: number;
  config: any;
}

interface MobilePreviewProps {
  components: FlowComponentData[];
  selectedComponentId?: string;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ 
  components, 
  selectedComponentId 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < components.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderComponent = (component: FlowComponentData) => {
    const { config } = component;
    const isSelected = component.id === selectedComponentId;
    
    const baseClasses = `p-4 rounded-lg transition-all ${
      isSelected 
        ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' 
        : 'bg-background'
    }`;

    switch (component.type) {
      case 'welcome':
        return (
          <div className={baseClasses}>
            <div className="text-center space-y-4">
              {config.showLogo && (
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                  🏢
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold mb-2" style={{ color: config.textColor }}>
                  {config.title}
                </h1>
                <p className="text-muted-foreground">
                  {config.subtitle}
                </p>
              </div>
              <Button className="w-full" size="lg">
                {config.buttonText}
              </Button>
            </div>
          </div>
        );

      case 'registration_form':
        return (
          <div className={baseClasses}>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{config.title}</h2>
              <div className="space-y-3">
                {config.fields?.map((field: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-sm">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.type === 'select' ? (
                      <select className="w-full p-2 border rounded-md text-sm">
                        <option>Select {field.label}</option>
                        {field.options?.map((option: string, optIndex: number) => (
                          <option key={optIndex} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} />
                    ) : (
                      <Input 
                        type={field.type} 
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full">
                {config.buttonText}
              </Button>
            </div>
          </div>
        );

      case 'content_display':
        return (
          <div className={baseClasses}>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: config.textColor }}>
                {config.title}
              </h2>
              <p className="text-muted-foreground">
                {config.content}
              </p>
              {config.buttonText && (
                <Button className="w-full">
                  {config.buttonText}
                </Button>
              )}
            </div>
          </div>
        );

      case 'survey_form':
        return (
          <div className={baseClasses}>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{config.title}</h2>
              <div className="space-y-4">
                {config.questions?.map((question: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm">{question.question}</Label>
                    {question.type === 'rating' ? (
                      <div className="flex gap-1">
                        {Array.from({ length: question.scale }, (_, i) => (
                          <Star 
                            key={i} 
                            className="h-6 w-6 text-primary cursor-pointer"
                            fill={i < 3 ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    ) : (
                      <Textarea placeholder="Your feedback..." />
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full">
                {config.buttonText}
              </Button>
            </div>
          </div>
        );

      case 'verification':
        return (
          <div className={baseClasses}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: config.textColor }}>
                  {config.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {config.message}
                </p>
              </div>
              <Button variant="outline" className="w-full">
                {config.buttonText}
              </Button>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className={baseClasses}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: config.textColor }}>
                  {config.title}
                </h2>
                <p className="text-muted-foreground">
                  {config.message}
                </p>
              </div>
              {config.showConfetti && (
                <div className="text-2xl">🎉</div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className={baseClasses}>
            <div className="text-center py-8 text-muted-foreground">
              <p>Unknown component type: {component.type}</p>
            </div>
          </div>
        );
    }
  };

  if (components.length === 0) {
    return (
      <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-xl border border-gray-200 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
            📱
          </div>
          <div>
            <h3 className="font-medium text-lg">No Components</h3>
            <p className="text-muted-foreground text-sm">
              Add components from the palette to see your flow
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentComponent = components[currentStep];
  const progressPercentage = ((currentStep + 1) / components.length) * 100;

  return (
    <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col">
      {/* Status Bar */}
      <div className="h-6 bg-black rounded-t-3xl flex items-center justify-center">
        <div className="w-20 h-1 bg-white rounded-full"></div>
      </div>

      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="text-xs">
            {currentStep + 1} of {components.length}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNext}
            disabled={currentStep === components.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progressPercentage} className="h-1" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {currentComponent && renderComponent(currentComponent)}
      </div>

      {/* Home Indicator */}
      <div className="h-6 flex items-center justify-center">
        <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
};