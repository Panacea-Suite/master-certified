import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, X, Shield, FileText, Package, Truck, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TemplatePreviewProps {
  template: {
    id: string;
    name: string;
    description: string;
    pages: any[];
    designConfig: any;
  };
  onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [userInputs, setUserInputs] = useState({
    selectedStore: '',
    email: '',
    firstName: '',
    lastName: ''
  });

  const currentPage = template.pages[currentPageIndex];
  const isLastPage = currentPageIndex === template.pages.length - 1;
  const isFirstPage = currentPageIndex === 0;

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'text':
        const textStyle = section.content?.style || 'p';
        const text = section.content?.text || 'Sample text content';
        
        if (textStyle === 'h1') {
          return <h1 key={section.id} className="text-4xl font-bold text-center mb-6">{text}</h1>;
        }
        if (textStyle === 'h2') {
          return <h2 key={section.id} className="text-2xl font-semibold mb-4">{text}</h2>;
        }
        if (textStyle === 'h3') {
          return <h3 key={section.id} className="text-xl font-medium mb-3">{text}</h3>;
        }
        return <p key={section.id} className="text-muted-foreground mb-4">{text}</p>;

      case 'form':
        return (
          <div key={section.id} className="space-y-4">
            {section.content?.fields?.map((field: any, index: number) => (
              <div key={field.id || index} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                {field.type === 'select' ? (
                  <Select value={userInputs.selectedStore} onValueChange={(value) => 
                    setUserInputs(prev => ({ ...prev, selectedStore: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option: string, optIndex: number) => (
                        <SelectItem key={optIndex} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.id}
                    type={field.type || 'text'}
                    placeholder={field.placeholder || ''}
                    value={field.id === 'email' ? userInputs.email : 
                           field.id === 'firstName' ? userInputs.firstName :
                           field.id === 'lastName' ? userInputs.lastName : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (field.id === 'email') {
                        setUserInputs(prev => ({ ...prev, email: value }));
                      } else if (field.id === 'firstName') {
                        setUserInputs(prev => ({ ...prev, firstName: value }));
                      } else if (field.id === 'lastName') {
                        setUserInputs(prev => ({ ...prev, lastName: value }));
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case 'image':
        return (
          <div key={section.id} className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
        );

      case 'button':
        return (
          <div key={section.id} className="flex justify-center">
            <Button className="w-full max-w-xs">
              {section.content?.text || 'Action Button'}
            </Button>
          </div>
        );

      default:
        return (
          <div key={section.id} className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {section.type} section - {section.content?.text || 'Content preview'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{template.name} Preview</h2>
            <p className="text-muted-foreground">{template.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span>Page {currentPageIndex + 1} of {template.pages.length}</span>
            <Badge variant="outline">{currentPage?.title || 'Untitled Page'}</Badge>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentPageIndex + 1) / template.pages.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {currentPageIndex === 0 && <Shield className="h-12 w-12 text-primary" />}
                {currentPageIndex === 1 && <Package className="h-12 w-12 text-primary" />}
                {currentPageIndex === 2 && <FileText className="h-12 w-12 text-primary" />}
                {currentPageIndex === 3 && <CheckCircle className="h-12 w-12 text-primary" />}
                {currentPageIndex >= 4 && <Truck className="h-12 w-12 text-primary" />}
              </div>
              <CardTitle className="text-2xl">{currentPage?.title || 'Page Title'}</CardTitle>
              {currentPage?.description && (
                <CardDescription>{currentPage.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPage?.sections?.map((section: any) => renderSection(section))}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={isFirstPage}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-1">
            {template.pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentPageIndex 
                    ? 'bg-primary' 
                    : index <= currentPageIndex 
                      ? 'bg-primary/50' 
                      : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <Button 
            onClick={handleNext}
            disabled={isLastPage}
            className="flex items-center gap-2"
          >
            {isLastPage ? 'Complete' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;