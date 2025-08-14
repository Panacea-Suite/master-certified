import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

interface ComponentEditorProps {
  section: SectionData;
  onUpdate: (config: any) => void;
}

export const ComponentEditor: React.FC<ComponentEditorProps> = ({
  section,
  onUpdate
}) => {
  const { config } = section;

  const updateConfig = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const renderTextEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Text Content</Label>
        <Textarea
          id="content"
          value={config.content || ''}
          onChange={(e) => updateConfig('content', e.target.value)}
          placeholder="Enter your text content..."
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size: {config.fontSize || 16}px</Label>
        <Slider
          value={[config.fontSize || 16]}
          onValueChange={(value) => updateConfig('fontSize', value[0])}
          min={12}
          max={32}
          step={1}
          className="w-full"
        />
      </div>
      
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
  );

  const renderImageEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          value={config.imageUrl || ''}
          onChange={(e) => updateConfig('imageUrl', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="alt">Alt Text</Label>
        <Input
          id="alt"
          value={config.alt || ''}
          onChange={(e) => updateConfig('alt', e.target.value)}
          placeholder="Describe the image"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="caption">Caption (Optional)</Label>
        <Input
          id="caption"
          value={config.caption || ''}
          onChange={(e) => updateConfig('caption', e.target.value)}
          placeholder="Image caption"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="height">Max Height (px)</Label>
        <Input
          id="height"
          type="number"
          value={config.height || ''}
          onChange={(e) => updateConfig('height', e.target.value)}
          placeholder="Auto"
        />
      </div>
    </div>
  );

  const renderDividerEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="width">Width: {config.width || 100}%</Label>
        <Slider
          value={[config.width || 100]}
          onValueChange={(value) => updateConfig('width', value[0])}
          min={10}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="thickness">Thickness: {config.thickness || 1}px</Label>
        <Slider
          value={[config.thickness || 1]}
          onValueChange={(value) => updateConfig('thickness', value[0])}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          value={config.color || '#e5e7eb'}
          onChange={(e) => updateConfig('color', e.target.value)}
          className="h-8"
        />
      </div>
    </div>
  );

  const renderStoreSelector = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label Text</Label>
        <Input
          id="label"
          value={config.label || ''}
          onChange={(e) => updateConfig('label', e.target.value)}
          placeholder="Select your store location"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={config.placeholder || ''}
          onChange={(e) => updateConfig('placeholder', e.target.value)}
          placeholder="Choose a store..."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="storeOptions">Store Options (one per line)</Label>
        <Textarea
          id="storeOptions"
          value={config.storeOptions || ''}
          onChange={(e) => updateConfig('storeOptions', e.target.value)}
          placeholder="Downtown Location&#10;Mall Branch&#10;Airport Store"
          rows={4}
        />
      </div>
      
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
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Border</Label>
          <Input
            type="color"
            value={config.borderColor || '#e5e7eb'}
            onChange={(e) => updateConfig('borderColor', e.target.value)}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">Focus Border</Label>
          <Input
            type="color"
            value={config.focusBorderColor || '#3b82f6'}
            onChange={(e) => updateConfig('focusBorderColor', e.target.value)}
            className="h-8"
          />
        </div>
      </div>
    </div>
  );

  const renderColumnEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="layout">Column Layout</Label>
        <Select 
          value={config.layout || '2-col-50-50'} 
          onValueChange={(value) => updateConfig('layout', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-col">Single Column</SelectItem>
            <SelectItem value="2-col-50-50">Two Columns (50/50)</SelectItem>
            <SelectItem value="2-col-33-67">Two Columns (33/67)</SelectItem>
            <SelectItem value="2-col-67-33">Two Columns (67/33)</SelectItem>
            <SelectItem value="3-col">Three Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="gap">Column Gap: {config.gap || 4}</Label>
        <Slider
          value={[config.gap || 4]}
          onValueChange={(value) => updateConfig('gap', value[0])}
          min={0}
          max={12}
          step={1}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="backgroundColor">Background Color</Label>
        <Input
          id="backgroundColor"
          type="color"
          value={config.backgroundColor || '#ffffff'}
          onChange={(e) => updateConfig('backgroundColor', e.target.value)}
          className="h-8"
        />
      </div>
    </div>
  );

  const renderEditor = () => {
    switch (section.type) {
      case 'text':
        return renderTextEditor();
      case 'image':
        return renderImageEditor();
      case 'store_selector':
        return renderStoreSelector();
      case 'divider':
        return renderDividerEditor();
      case 'column':
        return renderColumnEditor();
      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            <p>No editor available for this section type</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 capitalize">
            <Settings className="h-4 w-4" />
            {section.type} Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderEditor()}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Spacing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="padding">Padding: {config.padding || 4}</Label>
            <Slider
              value={[config.padding || 4]}
              onValueChange={(value) => updateConfig('padding', value[0])}
              min={0}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Controls inner spacing of the section
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};