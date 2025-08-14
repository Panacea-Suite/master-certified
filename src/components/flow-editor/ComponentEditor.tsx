import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Settings } from 'lucide-react';

interface FlowComponentData {
  id: string;
  type: string;
  order: number;
  config: any;
}

interface ComponentEditorProps {
  component: FlowComponentData;
  onUpdate: (config: any) => void;
}

export const ComponentEditor: React.FC<ComponentEditorProps> = ({
  component,
  onUpdate
}) => {
  const { config } = component;

  const updateConfig = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const updateField = (fieldIndex: number, fieldData: any) => {
    const updatedFields = [...(config.fields || [])];
    updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...fieldData };
    updateConfig('fields', updatedFields);
  };

  const addField = () => {
    const newField = {
      name: 'new_field',
      type: 'text',
      required: false,
      label: 'New Field'
    };
    updateConfig('fields', [...(config.fields || []), newField]);
  };

  const removeField = (fieldIndex: number) => {
    const updatedFields = config.fields?.filter((_: any, index: number) => index !== fieldIndex) || [];
    updateConfig('fields', updatedFields);
  };

  const updateQuestion = (questionIndex: number, questionData: any) => {
    const updatedQuestions = [...(config.questions || [])];
    updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], ...questionData };
    updateConfig('questions', updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `question_${Date.now()}`,
      type: 'text',
      question: 'New Question',
      required: false
    };
    updateConfig('questions', [...(config.questions || []), newQuestion]);
  };

  const removeQuestion = (questionIndex: number) => {
    const updatedQuestions = config.questions?.filter((_: any, index: number) => index !== questionIndex) || [];
    updateConfig('questions', updatedQuestions);
  };

  const renderWelcomeEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Welcome title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          value={config.subtitle || ''}
          onChange={(e) => updateConfig('subtitle', e.target.value)}
          placeholder="Welcome subtitle"
          rows={2}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="buttonText">Button Text</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig('buttonText', e.target.value)}
          placeholder="Get Started"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="showLogo"
          checked={config.showLogo || false}
          onCheckedChange={(checked) => updateConfig('showLogo', checked)}
        />
        <Label htmlFor="showLogo">Show Logo</Label>
      </div>
    </div>
  );

  const renderFormEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Form Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Form title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="buttonText">Submit Button Text</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig('buttonText', e.target.value)}
          placeholder="Continue"
        />
      </div>

      <Separator />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Form Fields</Label>
          <Button size="sm" onClick={addField}>
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>
        
        {config.fields?.map((field: any, index: number) => (
          <Card key={index} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Field {index + 1}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeField(index)}
                  className="text-destructive h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={field.name || ''}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="field_name"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    className="w-full h-8 px-2 border rounded text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="select">Select</option>
                    <option value="textarea">Textarea</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={field.label || ''}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Field label"
                  className="h-8"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required || false}
                  onCheckedChange={(checked) => updateField(index, { required: checked })}
                />
                <Label className="text-xs">Required</Label>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContentEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Content Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Content title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content Text</Label>
        <Textarea
          id="content"
          value={config.content || ''}
          onChange={(e) => updateConfig('content', e.target.value)}
          placeholder="Your content goes here..."
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="buttonText">Button Text (Optional)</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig('buttonText', e.target.value)}
          placeholder="Continue"
        />
      </div>
    </div>
  );

  const renderSurveyEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Survey Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Survey title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="buttonText">Submit Button Text</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig('buttonText', e.target.value)}
          placeholder="Submit"
        />
      </div>

      <Separator />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Questions</Label>
          <Button size="sm" onClick={addQuestion}>
            <Plus className="h-3 w-3 mr-1" />
            Add Question
          </Button>
        </div>
        
        {config.questions?.map((question: any, index: number) => (
          <Card key={index} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Question {index + 1}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeQuestion(index)}
                  className="text-destructive h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <div>
                <Label className="text-xs">Question</Label>
                <Input
                  value={question.question || ''}
                  onChange={(e) => updateQuestion(index, { question: e.target.value })}
                  placeholder="Your question"
                  className="h-8"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    value={question.type || 'text'}
                    onChange={(e) => updateQuestion(index, { type: e.target.value })}
                    className="w-full h-8 px-2 border rounded text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
                {question.type === 'rating' && (
                  <div>
                    <Label className="text-xs">Scale</Label>
                    <select
                      value={question.scale || 5}
                      onChange={(e) => updateQuestion(index, { scale: parseInt(e.target.value) })}
                      className="w-full h-8 px-2 border rounded text-sm"
                    >
                      <option value={5}>1-5 Stars</option>
                      <option value={10}>1-10 Scale</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={question.required || false}
                  onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                />
                <Label className="text-xs">Required</Label>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderVerificationEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Verification title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="Verification instructions"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="buttonText">Button Text</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig('buttonText', e.target.value)}
          placeholder="Resend Email"
        />
      </div>
    </div>
  );

  const renderCompletionEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Thank you title"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={config.message || ''}
          onChange={(e) => updateConfig('message', e.target.value)}
          placeholder="Completion message"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="showConfetti"
          checked={config.showConfetti || false}
          onCheckedChange={(checked) => updateConfig('showConfetti', checked)}
        />
        <Label htmlFor="showConfetti">Show Confetti</Label>
      </div>
    </div>
  );

  const renderEditor = () => {
    switch (component.type) {
      case 'welcome':
        return renderWelcomeEditor();
      case 'registration_form':
        return renderFormEditor();
      case 'content_display':
        return renderContentEditor();
      case 'survey_form':
        return renderSurveyEditor();
      case 'verification':
        return renderVerificationEditor();
      case 'completion':
        return renderCompletionEditor();
      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            <p>No editor available for this component type</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Component Properties
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderEditor()}
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Styling</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Background</Label>
              <Input
                type="color"
                value={config.backgroundColor || '#ffffff'}
                onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <Input
                type="color"
                value={config.textColor || '#000000'}
                onChange={(e) => updateConfig('textColor', e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};