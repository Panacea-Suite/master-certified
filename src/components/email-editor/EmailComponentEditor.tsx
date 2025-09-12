import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { BrandColorPicker } from '@/components/ui/brand-color-picker';
import { Settings, Type, Palette, Layout, Link } from 'lucide-react';

interface EmailComponent {
  id: string;
  type: string;
  config: any;
  order: number;
}

interface EmailComponentEditorProps {
  component: EmailComponent | null;
  onUpdate: (config: any) => void;
}

export const EmailComponentEditor: React.FC<EmailComponentEditorProps> = ({ 
  component, 
  onUpdate 
}) => {
  if (!component) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Select a component to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const { config } = component;

  const updateConfig = (key: string, value: any) => {
    onUpdate({ ...config, [key]: value });
  };

  const renderTextEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text">Text Content</Label>
        <Textarea
          id="text"
          value={config.text || ''}
          onChange={(e) => updateConfig('text', e.target.value)}
          placeholder="Enter your text..."
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fontSize">Font Size</Label>
          <Select
            value={config.fontSize || '16'}
            onValueChange={(value) => updateConfig('fontSize', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="24">24px</SelectItem>
              <SelectItem value="32">32px</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="fontWeight">Font Weight</Label>
          <Select
            value={config.fontWeight || 'normal'}
            onValueChange={(value) => updateConfig('fontWeight', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="600">Semi Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="textAlign">Text Alignment</Label>
        <Select
          value={config.textAlign || 'left'}
          onValueChange={(value) => updateConfig('textAlign', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="textColor">Text Color</Label>
        <BrandColorPicker
          value={config.textColor || '#333333'}
          onChange={(color) => updateConfig('textColor', color)}
          showOpacity={false}
          id="textColor"
        />
      </div>
    </div>
  );

  const renderButtonEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="buttonText">Button Text</Label>
        <Input
          id="buttonText"
          value={config.buttonText || ''}
          onChange={(e) => updateConfig('buttonText', e.target.value)}
          placeholder="Click here"
        />
      </div>

      <div>
        <Label htmlFor="buttonUrl">Button URL</Label>
        <Input
          id="buttonUrl"
          value={config.buttonUrl || ''}
          onChange={(e) => updateConfig('buttonUrl', e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="buttonBgColor">Background Color</Label>
          <BrandColorPicker
            value={config.buttonBgColor || '#5F57FF'}
            onChange={(color) => updateConfig('buttonBgColor', color)}
            showOpacity={false}
            id="buttonBgColor"
          />
        </div>
        
        <div>
          <Label htmlFor="buttonTextColor">Text Color</Label>
          <BrandColorPicker
            value={config.buttonTextColor || '#ffffff'}
            onChange={(color) => updateConfig('buttonTextColor', color)}
            showOpacity={false}
            id="buttonTextColor"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="buttonAlign">Button Alignment</Label>
        <Select
          value={config.buttonAlign || 'center'}
          onValueChange={(value) => updateConfig('buttonAlign', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="borderRadius">Border Radius</Label>
        <div className="px-3">
          <Slider
            value={[config.borderRadius || 6]}
            onValueChange={([value]) => updateConfig('borderRadius', value)}
            max={20}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0px</span>
            <span>{config.borderRadius || 6}px</span>
            <span>20px</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderImageEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={config.imageUrl || ''}
          onChange={(e) => updateConfig('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <Label htmlFor="altText">Alt Text</Label>
        <Input
          id="altText"
          value={config.altText || ''}
          onChange={(e) => updateConfig('altText', e.target.value)}
          placeholder="Image description"
        />
      </div>

      <div>
        <Label htmlFor="imageAlign">Image Alignment</Label>
        <Select
          value={config.imageAlign || 'center'}
          onValueChange={(value) => updateConfig('imageAlign', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maxWidth">Max Width (px)</Label>
        <div className="px-3">
          <Slider
            value={[config.maxWidth || 600]}
            onValueChange={([value]) => updateConfig('maxWidth', value)}
            max={600}
            min={100}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>100px</span>
            <span>{config.maxWidth || 600}px</span>
            <span>600px</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpacingEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="padding">Padding</Label>
        <div className="px-3">
          <Slider
            value={[config.padding || 20]}
            onValueChange={([value]) => updateConfig('padding', value)}
            max={60}
            min={0}
            step={4}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0px</span>
            <span>{config.padding || 20}px</span>
            <span>60px</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="backgroundColor">Background Color</Label>
        <BrandColorPicker
          value={config.backgroundColor || '#ffffff'}
          onChange={(color) => updateConfig('backgroundColor', color)}
          showOpacity={true}
          id="backgroundColor"
        />
      </div>
    </div>
  );

  const renderEditor = () => {
    switch (component.type) {
      case 'email_text':
      case 'email_heading':
        return renderTextEditor();
      case 'email_button':
        return renderButtonEditor();
      case 'email_image':
        return renderImageEditor();
      case 'email_header':
      case 'email_footer':
      case 'email_spacer':
      case 'email_divider':
        return renderSpacingEditor();
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No editor available for this component type</p>
          </div>
        );
    }
  };

  const getComponentIcon = () => {
    switch (component.type) {
      case 'email_text':
      case 'email_heading':
        return Type;
      case 'email_button':
        return Link;
      case 'email_image':
        return Layout;
      default:
        return Settings;
    }
  };

  const ComponentIcon = getComponentIcon();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ComponentIcon className="w-4 h-4" />
          {component.type.replace('email_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderEditor()}
        {renderSpacingEditor()}
      </CardContent>
    </Card>
  );
};