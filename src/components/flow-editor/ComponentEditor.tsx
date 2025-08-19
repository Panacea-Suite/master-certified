import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Trash2, Upload, Edit2, Settings, Bold, Italic, Underline, List, Link } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ImageEditor } from '@/components/ImageEditor';
import { BrandColorPicker } from '@/components/ui/brand-color-picker';
import { supabase } from '@/integrations/supabase/client';

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
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
}

export const ComponentEditor: React.FC<ComponentEditorProps> = ({ section, onUpdate, brandColors }) => {
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { config } = section;

  // Listen for global requests to open the image editor from the preview pane
  useEffect(() => {
    const handler = async (event: Event) => {
      const e = event as CustomEvent<{ sectionId: string; imageUrl?: string }>;
      if (section.type !== 'image') return;
      if (!e.detail || e.detail.sectionId !== section.id) return;
      const url = e.detail.imageUrl || config.imageUrl;
      if (!url) return;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });
        setSelectedImageFile(file);
        setShowImageEditor(true);
      } catch (err) {
        // fallback: do nothing
      }
    };
    document.addEventListener('lov-open-image-editor', handler as EventListener);
    return () => document.removeEventListener('lov-open-image-editor', handler as EventListener);
  }, [section.id, section.type, config.imageUrl]);

  const updateConfig = (key: string, value: any) => {
    onUpdate({ [key]: value });
  };

  const formatText = (format: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '**bold text**';
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '*italic text*';
        break;
      case 'underline':
        formattedText = selectedText ? `__${selectedText}__` : '__underlined text__';
        break;
      case 'bullet':
        formattedText = selectedText ? `• ${selectedText}` : '• bullet point';
        break;
      case 'link':
        formattedText = selectedText ? `[${selectedText}](url)` : '[link text](url)';
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = beforeText + formattedText + afterText;
    updateConfig('content', newContent);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderTextEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Text Content</Label>
        
        {/* Formatting Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('bullet')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('link')}
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
        
        <Textarea
          ref={textAreaRef}
          id="content"
          value={config.content || ''}
          onChange={(e) => updateConfig('content', e.target.value)}
          placeholder="Enter your text content... Use **bold**, *italic*, __underline__, • bullets, [links](url)"
          rows={8}
          className="font-mono text-sm"
        />
        <div className="text-xs text-muted-foreground">
          Use markdown-style formatting: **bold**, *italic*, __underline__, • bullets, [link text](url)
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="fontSize">Font Size: {config.fontSize || 16}px</Label>
          <Slider
            value={[config.fontSize || 16]}
            onValueChange={(value) => updateConfig('fontSize', value[0])}
            min={12}
            max={48}
            step={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fontWeight">Font Weight</Label>
          <Select 
            value={config.fontWeight || 'normal'} 
            onValueChange={(value) => updateConfig('fontWeight', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select weight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="semibold">Semibold</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="textAlign">Text Alignment</Label>
        <Select 
          value={config.align || 'left'} 
          onValueChange={(value) => updateConfig('align', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select alignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <BrandColorPicker
          label="Background"
          value={config.backgroundColor || 'rgba(255,255,255,1)'}
          onChange={(color) => updateConfig('backgroundColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
        <BrandColorPicker
          label="Text Color"
          value={config.textColor || '#000000'}
          onChange={(color) => updateConfig('textColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
      </div>
    </div>
  );

  const renderImageEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <div className="flex gap-2">
          <Input
            id="imageUrl"
            type="url"
            value={config.imageUrl || ''}
            onChange={(e) => updateConfig('imageUrl', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          {config.imageUrl && (
            <Button
              variant="outline"
              size="sm"
              data-edit-image={section.id}
              onClick={() => {
                // Convert existing image URL to file for editing
                fetch(config.imageUrl)
                  .then(res => res.blob())
                  .then(blob => {
                    const file = new File([blob], 'image.jpg', { type: blob.type });
                    setSelectedImageFile(file);
                    setShowImageEditor(true);
                  })
                  .catch(() => {
                    // Fallback: open file picker
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setSelectedImageFile(file);
                        setShowImageEditor(true);
                      }
                    };
                    input.click();
                  });
              }}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Upload & Edit Image</Label>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-semibold">Click to upload & edit</span><br />
                PNG, JPG (MAX. 5MB)
              </p>
            </div>
            <input
              id="imageUpload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedImageFile(file);
                  setShowImageEditor(true);
                }
              }}
            />
          </label>
        </div>
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

  const renderDropShadowSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="dropShadow"
          checked={config.dropShadow || false}
          onCheckedChange={(checked) => updateConfig('dropShadow', checked)}
        />
        <Label htmlFor="dropShadow">Drop Shadow</Label>
      </div>
      
      {config.dropShadow && (
        <div className="space-y-4 ml-6">
          <div className="space-y-2">
            <Label htmlFor="shadowBlur">Shadow Blur: {config.shadowBlur || 10}px</Label>
            <Slider
              value={[config.shadowBlur || 10]}
              onValueChange={(value) => updateConfig('shadowBlur', value[0])}
              min={0}
              max={50}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shadowOffsetX">Horizontal Offset: {config.shadowOffsetX || 0}px</Label>
            <Slider
              value={[config.shadowOffsetX || 0]}
              onValueChange={(value) => updateConfig('shadowOffsetX', value[0])}
              min={-20}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shadowOffsetY">Vertical Offset: {config.shadowOffsetY || 4}px</Label>
            <Slider
              value={[config.shadowOffsetY || 4]}
              onValueChange={(value) => updateConfig('shadowOffsetY', value[0])}
              min={-20}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shadowSpread">Shadow Spread: {config.shadowSpread || 0}px</Label>
            <Slider
              value={[config.shadowSpread || 0]}
              onValueChange={(value) => updateConfig('shadowSpread', value[0])}
              min={-10}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
          
          <BrandColorPicker
            label="Shadow Color"
            value={config.shadowColor || 'rgba(0,0,0,0.1)'}
            onChange={(color) => updateConfig('shadowColor', color)}
            brandColors={brandColors}
            showOpacity={true}
            id="shadowColor"
          />
        </div>
      )}
    </div>
  );

  const renderDividerEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="fullWidth">Full width</Label>
        <Switch
          id="fullWidth"
          checked={!!config.fullWidth}
          onCheckedChange={(checked) => {
            updateConfig('fullWidth', checked);
            if (checked) updateConfig('width', 100);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="width">Width: {config.fullWidth ? 100 : (config.width || 100)}%</Label>
        <Slider
          value={[config.fullWidth ? 100 : (config.width || 100)]}
          onValueChange={(value) => updateConfig('width', value[0])}
          min={10}
          max={100}
          step={5}
          className="w-full"
          disabled={!!config.fullWidth}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="thickness">Thickness: {config.thickness || 1}px</Label>
        <Slider
          value={[config.thickness || 1]}
          onValueChange={(value) => updateConfig('thickness', value[0])}
          min={1}
          max={64}
          step={1}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="edgeToEdge">Edge-to-edge (no padding)</Label>
        <Switch
          id="edgeToEdge"
          checked={(config.padding ?? 2) === 0}
          onCheckedChange={(checked) => updateConfig('padding', checked ? 0 : 4)}
        />
      </div>
      
      <BrandColorPicker
        label="Color"
        value={config.color || '#e5e7eb'}
        onChange={(color) => updateConfig('color', color)}
        brandColors={brandColors}
        showOpacity={true}
        id="color"
      />
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
        <BrandColorPicker
          label="Background"
          value={config.backgroundColor || 'rgba(255,255,255,1)'}
          onChange={(color) => updateConfig('backgroundColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
        <BrandColorPicker
          label="Text Color"
          value={config.textColor || '#000000'}
          onChange={(color) => updateConfig('textColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <BrandColorPicker
          label="Border"
          value={config.borderColor || '#e5e7eb'}
          onChange={(color) => updateConfig('borderColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
        <BrandColorPicker
          label="Focus Border"
          value={config.focusBorderColor || '#3b82f6'}
          onChange={(color) => updateConfig('focusBorderColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
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
      
      <BrandColorPicker
        label="Background Color"
        value={config.backgroundColor || 'rgba(255,255,255,1)'}
        onChange={(color) => updateConfig('backgroundColor', color)}
        brandColors={brandColors}
        showOpacity={true}
        id="backgroundColor"
      />
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

  const renderCommonSettings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <BrandColorPicker
          label="Background"
          value={config.backgroundColor || 'rgba(255,255,255,1)'}
          onChange={(color) => updateConfig('backgroundColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
        <BrandColorPicker
          label="Text Color"
          value={config.textColor || '#000000'}
          onChange={(color) => updateConfig('textColor', color)}
          brandColors={brandColors}
          showOpacity={true}
        />
      </div>
    </div>
  );

  const renderSpacingSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="padding">Padding: {config.padding ?? 4}</Label>
        <Slider
          value={[config.padding ?? 4]}
          onValueChange={(value) => updateConfig('padding', value[0])}
          min={0}
          max={12}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderFeaturesEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={config.items?.join('\n') || ''}
          onChange={(e) => updateConfig('items', e.target.value.split('\n').filter(item => item.trim()))}
          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
          rows={4}
        />
      </div>
    </div>
  );

  const renderCTAEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text">Button Text</Label>
        <Input
          id="text"
          value={config.text || ''}
          onChange={(e) => updateConfig('text', e.target.value)}
          placeholder="Click here"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <BrandColorPicker
          label="Background"
          value={config.backgroundColor || 'rgba(255,255,255,1)'}
          onChange={(color) => updateConfig('backgroundColor', color)}
          brandColors={brandColors}
          showOpacity={true}
          id="sectionBackground"
        />
        <BrandColorPicker
          label="Button"
          value={config.buttonColor || brandColors?.primary || '#3b82f6'}
          onChange={(color) => updateConfig('buttonColor', color)}
          brandColors={brandColors}
          showOpacity={true}
          id="buttonColor"
        />
        <BrandColorPicker
          label="Text"
          value={config.textColor || '#ffffff'}
          onChange={(color) => updateConfig('textColor', color)}
          brandColors={brandColors}
          showOpacity={true}
          id="textColor"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="size">Button Size</Label>
        <Select 
          value={config.size || 'default'} 
          onValueChange={(value) => updateConfig('size', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderProductShowcaseEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="caption">Caption</Label>
        <Input
          id="caption"
          value={config.caption || ''}
          onChange={(e) => updateConfig('caption', e.target.value)}
          placeholder="Product description"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bgColor">Background Color</Label>
        <Select 
          value={config.backgroundColor || 'muted'} 
          onValueChange={(value) => updateConfig('backgroundColor', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select background" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="muted">Muted</SelectItem>
            <SelectItem value="primary">Primary</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderFooterEditor = () => (
    <div className="space-y-4">
      <BrandColorPicker
        label="Background Color"
        value={config.backgroundColor || 'transparent'}
        onChange={(color) => updateConfig('backgroundColor', color)}
        brandColors={brandColors}
        showOpacity={true}
        id="footerBackgroundColor"
      />
    </div>
  );

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
          <div className="space-y-4">
            {section.type !== 'cta' && renderCommonSettings()}
            
            {section.type !== 'cta' && <Separator />}
            
            {renderDropShadowSettings()}
            
            <Separator />
            
            {section.type === 'text' && renderTextEditor()}
            {section.type === 'image' && renderImageEditor()}
            {section.type === 'features' && renderFeaturesEditor()}
            {section.type === 'cta' && renderCTAEditor()}
            {section.type === 'product_showcase' && renderProductShowcaseEditor()}
            {section.type === 'store_selector' && renderStoreSelector()}
            {section.type === 'divider' && renderDividerEditor()}
            {section.type === 'column' && renderColumnEditor()}
            {section.type === 'footer' && renderFooterEditor()}
          </div>
        </CardContent>
        
        {/* Image Editor Modal */}
        {showImageEditor && selectedImageFile && (
          <ImageEditor
            file={selectedImageFile}
            onSave={async (editedFile) => {
              // For all images, use data URLs for simplicity
              const reader = new FileReader();
              reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                updateConfig('imageUrl', dataUrl);
              };
              reader.readAsDataURL(editedFile);
              
              setShowImageEditor(false);
              setSelectedImageFile(null);
            }}
            onCancel={() => {
              setShowImageEditor(false);
              setSelectedImageFile(null);
            }}
          />
        )}
      </Card>
      
      {/* Only show spacing card for non-divider sections or dividers without edge-to-edge */}
      {(section.type !== 'divider' || (config.padding ?? 2) !== 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Spacing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="padding">Padding: {config.padding ?? 4}</Label>
              <Slider
                value={[config.padding ?? 4]}
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
      )}
    </div>
  );
};