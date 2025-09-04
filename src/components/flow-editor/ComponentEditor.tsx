import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Trash2, Upload, Edit2, Settings, Bold, Italic, Underline, List, Link, Lock, Unlock, FileText, Copy, Download, ExternalLink, Maximize2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ImageEditor } from '@/components/ImageEditor';
import { BrandColorPicker } from '@/components/ui/brand-color-picker';
import { FullScreenEditor } from '@/components/ui/full-screen-editor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
  pages?: Array<{ id: string; name: string; }>;
}

export const ComponentEditor: React.FC<ComponentEditorProps> = ({ section, onUpdate, brandColors, pages = [] }) => {
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [fullScreenEditor, setFullScreenEditor] = useState<{
    isOpen: boolean;
    type: 'simple' | 'scientific';
    documentId: string;
  } | null>(null);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [paddingLocked, setPaddingLocked] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { config } = section;

  // Listen for global requests to open the image editor from the preview pane
  useEffect(() => {
    const handler = async (event: Event) => {
      const e = event as CustomEvent<{ sectionId: string; imageUrl?: string }>;
      console.log('Event received in ComponentEditor:', e.detail, 'Current section:', section.id, section.type);
      if (section.type !== 'image') return;
      if (!e.detail || e.detail.sectionId !== section.id) return;
      const url = e.detail.imageUrl || config.imageUrl;
      if (!url) return;
      console.log('Opening image editor for section:', section.id, 'with URL:', url);
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });
        setSelectedImageFile(file);
        setShowImageEditor(true);
        console.log('Image editor opened successfully');
      } catch (err) {
        console.error('Failed to open image editor:', err);
        // fallback: do nothing
      }
    };
    document.addEventListener('lov-open-image-editor', handler as EventListener);
    return () => document.removeEventListener('lov-open-image-editor', handler as EventListener);
  }, [section.id, section.type, config.imageUrl]);

  const updateConfig = (key: string, value: any) => {
    console.log('ComponentEditor updateConfig:', { key, value, sectionType: section.type, currentConfig: config });
    onUpdate({ ...config, [key]: value });
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

  const renderImageEditor = () => {
    const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
      const numValue = parseFloat(value) || 0;
      
      if (!aspectRatioLocked || !config.width || !config.height) {
        updateConfig(dimension, value);
        return;
      }
      
      // Calculate aspect ratio from current dimensions
      const aspectRatio = parseFloat(config.width) / parseFloat(config.height);
      
      if (dimension === 'width') {
        const newHeight = numValue / aspectRatio;
        updateConfig('width', value);
        updateConfig('height', newHeight.toString());
      } else {
        const newWidth = numValue * aspectRatio;
        updateConfig('height', value);
        updateConfig('width', newWidth.toString());
      }
    };
    
    return (
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
        
        {config.caption && (
          <div className="space-y-2">
            <BrandColorPicker
              label="Caption Text Color"
              value={config.textColor || '#666666'}
              onChange={(color) => updateConfig('textColor', color)}
              brandColors={brandColors}
              showOpacity={true}
              id="captionTextColor"
            />
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Dimensions</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
              className={`h-8 w-8 p-0 ${aspectRatioLocked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {aspectRatioLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="width" className="text-xs">Max Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={config.width || ''}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="Auto"
                min="1"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="height" className="text-xs">Max Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={config.height || ''}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="Auto"
                min="1"
              />
            </div>
          </div>
          
          {aspectRatioLocked && (
            <p className="text-xs text-muted-foreground">
              🔒 Aspect ratio locked - changing one dimension will adjust the other
            </p>
          )}
        </div>
      </div>
    );
  };

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
      
      <div className="grid grid-cols-1 gap-2">
        <BrandColorPicker
          label="Border"
          value={config.borderColor || brandColors?.primary || '#3b82f6'}
          onChange={(color) => updateConfig('borderColor', color)}
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
      case 'login_step':
        return renderLoginStepEditor();
      case 'divider':
        return renderDividerEditor();
      case 'column':
        return renderColumnEditor();
      case 'cta':
        return renderCTAEditor();
      case 'features':
        return renderFeaturesEditor();
      case 'product-showcase':
        return renderProductShowcaseEditor();
      case 'footer':
        return renderFooterEditor();
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

  const renderSpacingSettings = () => {
    // Helper function to get individual padding values with backward compatibility
    const getPaddingValue = (side: string) => {
      const newValue = config[`padding${side}`];
      if (newValue !== undefined) return newValue;
      // Fallback to old single padding value
      return config.padding ?? 4;
    };

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Padding (rem)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="paddingTop" className="text-xs">Top</Label>
              <Input
                id="paddingTop"
                type="number"
                value={getPaddingValue('Top')}
                onChange={(e) => updateConfig('paddingTop', Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                max={12}
                step={0.25}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paddingRight" className="text-xs">Right</Label>
              <Input
                id="paddingRight"
                type="number"
                value={getPaddingValue('Right')}
                onChange={(e) => updateConfig('paddingRight', Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                max={12}
                step={0.25}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paddingBottom" className="text-xs">Bottom</Label>
              <Input
                id="paddingBottom"
                type="number"
                value={getPaddingValue('Bottom')}
                onChange={(e) => updateConfig('paddingBottom', Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                max={12}
                step={0.25}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paddingLeft" className="text-xs">Left</Label>
              <Input
                id="paddingLeft"
                type="number"
                value={getPaddingValue('Left')}
                onChange={(e) => updateConfig('paddingLeft', Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                max={12}
                step={0.25}
                className="h-8"
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Controls inner spacing of each side independently
          </div>
        </div>
      </div>
    );
  };

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
      
      <div className="space-y-2">
        <Label htmlFor="targetPage">Navigate to Page</Label>
        <Select 
          value={config.targetPageId || 'none'} 
          onValueChange={(value) => updateConfig('targetPageId', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select page to navigate to" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No navigation</SelectItem>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

  const renderLoginStepEditor = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => updateConfig('title', e.target.value)}
          placeholder="Create your Certified account"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={config.subtitle || ''}
          onChange={(e) => updateConfig('subtitle', e.target.value)}
          placeholder="Access full testing results and member-only offers."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          id="brandName"
          value={config.brandName || ''}
          onChange={(e) => updateConfig('brandName', e.target.value)}
          placeholder="this brand"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="showEmail">Show Email Sign-in</Label>
        <Switch
          id="showEmail"
          checked={config.showEmail !== false}
          onCheckedChange={(checked) => updateConfig('showEmail', checked)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="showApple">Show Apple Sign-in</Label>
        <Switch
          id="showApple"
          checked={config.showApple !== false}
          onCheckedChange={(checked) => updateConfig('showApple', checked)}
        />
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
      
      <div className="space-y-2">
        <Label htmlFor="logoSize">Logo Size (px)</Label>
        <Input
          id="logoSize"
          type="number"
          value={config.logoSize || 60}
          onChange={(e) => {
            const size = Math.max(20, parseInt(e.target.value) || 60);
            updateConfig('logoSize', size);
          }}
          min={20}
          placeholder="60"
        />
        <p className="text-xs text-muted-foreground">Minimum: 20px</p>
      </div>
    </div>
  );

  const renderDocumentationEditor = () => {
    const documents = config.documents || [];
    
    const handleDocumentUpload = async (file: File) => {
      try {
        // Sanitize filename - keep only alphanumeric, spaces, periods, hyphens, and underscores
        const sanitizeFilename = (filename: string) => {
          const name = filename.replace(/\.[^/.]+$/, ""); // Remove extension
          const ext = filename.split('.').pop(); // Get extension
          const sanitizedName = name
            .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars except spaces, hyphens, underscores
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim()
            .substring(0, 50); // Limit to 50 characters
          return `${sanitizedName}.${ext}`;
        };

        const sanitizedFilename = sanitizeFilename(file.name);
        const fileName = `documentation/${Date.now()}-${sanitizedFilename}`;
        
        console.log('Uploading file:', { originalName: file.name, sanitizedName: sanitizedFilename, fileName });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('flow-content')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('flow-content')
          .getPublicUrl(fileName);

        const newDocument = {
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, ""), // Use original name for title
          uploadDate: new Date().toISOString(),
          pdfUrl: publicUrl,
          description: '',
          simpleDescription: '',
          scientificDescription: ''
        };

        updateConfig('documents', [...documents, newDocument]);
        toast.success('Document uploaded successfully');
      } catch (error) {
        console.error('Failed to upload document:', error);
        if (error.message?.includes('Failed to fetch')) {
          toast.error('Upload failed. Please check your internet connection and try again.');
        } else if (error.message?.includes('too large')) {
          toast.error('File is too large. Please try a smaller file.');
        } else {
          toast.error(`Failed to upload document: ${error.message || 'Unknown error'}`);
        }
      }
    };

    const handleDocumentUpdate = (documentId: string, updates: any) => {
      const updatedDocuments = documents.map((doc: any) => 
        doc.id === documentId ? { ...doc, ...updates } : doc
      );
      updateConfig('documents', updatedDocuments);
    };

    const handleDocumentDelete = async (documentId: string) => {
      try {
        // Find the document to get the file path for cleanup
        const documentToDelete = documents.find((doc: any) => doc.id === documentId);
        
        // Remove from config
        const updatedDocuments = documents.filter((doc: any) => doc.id !== documentId);
        updateConfig('documents', updatedDocuments);
        
        // Optional: Clean up the file from storage
        if (documentToDelete?.pdfUrl) {
          const fileName = documentToDelete.pdfUrl.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('flow-content')
              .remove([`documentation/${fileName}`]);
          }
        }
        
        toast.success('Document deleted successfully');
      } catch (error) {
        console.error('Failed to delete document:', error);
        toast.error('Failed to delete document');
      }
    };

    const handleDuplicateDocument = (documentId: string) => {
      const documentToDuplicate = documents.find((doc: any) => doc.id === documentId);
      if (documentToDuplicate) {
        const duplicatedDocument = {
          ...documentToDuplicate,
          id: Date.now().toString(),
          title: `${documentToDuplicate.title} (Copy)`,
          uploadDate: new Date().toISOString()
        };
        updateConfig('documents', [...documents, duplicatedDocument]);
        toast.success('Document duplicated successfully');
      }
    };

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sectionTitle">Section Title</Label>
          <Input
            id="sectionTitle"
            value={config.title || ''}
            onChange={(e) => updateConfig('title', e.target.value)}
            placeholder="Documentation & Testing Results"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Documents ({documents.length})</Label>
            <label htmlFor="documentUpload" className="cursor-pointer">
              <Button type="button" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Add Document
                </span>
              </Button>
              <input
                id="documentUpload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleDocumentUpload(file);
                    // Reset input to allow uploading the same file again
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>

          {documents.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">No documents uploaded yet</p>
              <p className="text-xs text-muted-foreground">Click "Add Document" to upload your first PDF</p>
            </div>
          )}

          {documents.map((document: any, index: number) => (
            <Card key={document.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <Badge variant="secondary" className="text-xs">PDF</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(document.uploadDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <Input
                      value={document.title}
                      onChange={(e) => handleDocumentUpdate(document.id, { title: e.target.value })}
                      placeholder="Document title"
                      className="font-medium"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateDocument(document.id)}
                      title="Duplicate document"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentDelete(document.id)}
                      className="text-destructive hover:text-destructive"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Simple Description</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullScreenEditor({
                        isOpen: true,
                        type: 'simple',
                        documentId: document.id
                      })}
                      className="h-7 px-2"
                    >
                      <Maximize2 className="w-3 h-3 mr-1" />
                      Full Screen
                    </Button>
                  </div>
                  <Textarea
                    value={document.simpleDescription || ''}
                    onChange={(e) => handleDocumentUpdate(document.id, { simpleDescription: e.target.value })}
                    placeholder="Write a simple, easy-to-understand description for general audiences. Focus on key benefits and basic information..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Scientific Description</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullScreenEditor({
                        isOpen: true,
                        type: 'scientific',
                        documentId: document.id
                      })}
                      className="h-7 px-2"
                    >
                      <Maximize2 className="w-3 h-3 mr-1" />
                      Full Screen
                    </Button>
                  </div>
                  <Textarea
                    value={document.scientificDescription || ''}
                    onChange={(e) => handleDocumentUpdate(document.id, { scientificDescription: e.target.value })}
                    placeholder="Write a detailed scientific description with technical terms, methodology, results, and conclusions..."
                    rows={4}
                    className="text-sm"
                  />
                  <div className="text-xs text-muted-foreground">
                    Use **bold**, *italic*, __underline__, • bullets, [link text](url)
                  </div>
                </div>
                
                {document.pdfUrl && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(document.pdfUrl, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = document.pdfUrl;
                        link.download = `${document.title}.pdf`;
                        link.click();
                      }}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {documents.length > 1 && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              💡 Tip: Documents will appear in the order shown here. Drag to reorder coming soon!
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium">Styling</Label>
          
          <div className="space-y-3">
            <BrandColorPicker
              label="Title Color"
              value={config.titleColor || '#000000'}
              onChange={(color) => updateConfig('titleColor', color)}
              brandColors={brandColors}
              id="titleColor"
            />
            
            <BrandColorPicker
              label="Text Color"
              value={config.textColor || '#666666'}
              onChange={(color) => updateConfig('textColor', color)}
              brandColors={brandColors}
              id="textColor"
            />
            
            <BrandColorPicker
              label="Icon Color"
              value={config.iconColor || '#3b82f6'}
              onChange={(color) => updateConfig('iconColor', color)}
              brandColors={brandColors}
              id="iconColor"
            />
          </div>
        </div>
      </div>
    );
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
            {section.type === 'login_step' && renderLoginStepEditor()}
            {section.type === 'divider' && renderDividerEditor()}
            {section.type === 'column' && renderColumnEditor()}
            {section.type === 'footer' && renderFooterEditor()}
            {section.type === 'documentation' && renderDocumentationEditor()}
          </div>
        </CardContent>
        
        {/* Full Screen Editor Modal */}
        {fullScreenEditor && (() => {
          const currentDocument = (section.config.documents as any[])?.find(doc => doc.id === fullScreenEditor.documentId);
          if (!currentDocument) return null;
          
          const currentValue = fullScreenEditor.type === 'simple' 
            ? currentDocument.simpleDescription || ''
            : currentDocument.scientificDescription || '';
          
          const title = fullScreenEditor.type === 'simple' 
            ? `Simple Description - ${currentDocument.title}`
            : `Scientific Description - ${currentDocument.title}`;
          
          const placeholder = fullScreenEditor.type === 'simple'
            ? "Write a simple, easy-to-understand description for general audiences. Focus on key benefits and basic information..."
            : "Write a detailed scientific description with technical terms, methodology, results, and conclusions...";
          
          return (
            <FullScreenEditor
              isOpen={true}
              onClose={() => setFullScreenEditor(null)}
              value={currentValue}
              onChange={(value) => {
                const updateField = fullScreenEditor.type === 'simple' 
                  ? { simpleDescription: value }
                  : { scientificDescription: value };
                
                // Update documents in the config
                const updatedDocuments = (section.config.documents as any[])?.map((doc: any) => 
                  doc.id === fullScreenEditor.documentId ? { ...doc, ...updateField } : doc
                ) || [];
                updateConfig('documents', updatedDocuments);
              }}
              title={title}
              placeholder={placeholder}
            />
          );
        })()}

        {/* Image Editor Modal */}
        {showImageEditor && selectedImageFile && (
          <ImageEditor
            file={selectedImageFile}
            onSave={async (editedFile) => {
              try {
                console.log('Uploading flow image to Supabase storage...');
                
                // Generate unique filename with correct extension based on MIME type
                const typeToExt: Record<string, string> = {
                  'image/png': 'png',
                  'image/jpeg': 'jpg',
                  'image/webp': 'webp',
                  'image/svg+xml': 'svg',
                };
                const detectedExt = typeToExt[editedFile.type] || (editedFile.name.split('.').pop()?.toLowerCase() || 'png');
                const fileName = `flow-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${detectedExt}`;
                
                // Upload to Supabase storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('flow-content')
                  .upload(fileName, editedFile, { upsert: true, cacheControl: '3600' });

                if (uploadError) {
                  console.error('Storage upload error:', uploadError);
                  throw new Error(`Upload failed: ${uploadError.message}`);
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                  .from('flow-content')
                  .getPublicUrl(fileName);

                console.log('Flow image uploaded successfully:', publicUrl);
                updateConfig('imageUrl', publicUrl);
                
              } catch (error) {
                console.error('Failed to upload image:', error);
                // Fallback to data URL if storage upload fails
                const reader = new FileReader();
                reader.onload = (e) => {
                  const dataUrl = e.target?.result as string;
                  updateConfig('imageUrl', dataUrl);
                };
                reader.readAsDataURL(editedFile);
              }
              
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
      
      {/* Only show spacing card for non-divider sections */}
      {section.type !== 'divider' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Spacing</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <Label>Padding (rem)</Label>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setPaddingLocked(!paddingLocked)}
                   className="h-6 w-6 p-0"
                 >
                   {paddingLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                 </Button>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                   <Label htmlFor="paddingTop" className="text-xs">Top</Label>
                   <Input
                     id="paddingTop"
                     type="number"
                     value={config.paddingTop ?? config.padding ?? 1}
onChange={(e) => {
                       const value = Math.max(0, parseFloat(e.target.value) || 0);
                       if (paddingLocked) {
                         onUpdate({ ...config, paddingTop: value, paddingRight: value, paddingBottom: value, paddingLeft: value, padding: value });
                       } else {
                         updateConfig('paddingTop', value);
                       }
                     }}
                     min={0}
                     max={12}
                     step={0.25}
                     className="h-8"
                   />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="paddingRight" className="text-xs">Right</Label>
                   <Input
                     id="paddingRight"
                     type="number"
                     value={config.paddingRight ?? config.padding ?? 1}
onChange={(e) => {
                       const value = Math.max(0, parseFloat(e.target.value) || 0);
                       if (paddingLocked) {
                         onUpdate({ ...config, paddingTop: value, paddingRight: value, paddingBottom: value, paddingLeft: value, padding: value });
                       } else {
                         updateConfig('paddingRight', value);
                       }
                     }}
                     min={0}
                     max={12}
                     step={0.25}
                     className="h-8"
                   />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="paddingBottom" className="text-xs">Bottom</Label>
                   <Input
                     id="paddingBottom"
                     type="number"
                     value={config.paddingBottom ?? config.padding ?? 1}
onChange={(e) => {
                       const value = Math.max(0, parseFloat(e.target.value) || 0);
                       if (paddingLocked) {
                         onUpdate({ ...config, paddingTop: value, paddingRight: value, paddingBottom: value, paddingLeft: value, padding: value });
                       } else {
                         updateConfig('paddingBottom', value);
                       }
                     }}
                     min={0}
                     max={12}
                     step={0.25}
                     className="h-8"
                   />
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="paddingLeft" className="text-xs">Left</Label>
                   <Input
                     id="paddingLeft"
                     type="number"
                     value={config.paddingLeft ?? config.padding ?? 1}
onChange={(e) => {
                       const value = Math.max(0, parseFloat(e.target.value) || 0);
                       if (paddingLocked) {
                         onUpdate({ ...config, paddingTop: value, paddingRight: value, paddingBottom: value, paddingLeft: value, padding: value });
                       } else {
                         updateConfig('paddingLeft', value);
                       }
                     }}
                     min={0}
                     max={12}
                     step={0.25}
                     className="h-8"
                   />
                 </div>
               </div>
              <div className="text-xs text-muted-foreground">
                Controls inner spacing of each side independently
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};