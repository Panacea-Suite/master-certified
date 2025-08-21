import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PanaceaFooter } from '@/components/PanaceaFooter';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { 
  ChevronDown,
  CheckCircle,
  Package,
  Edit2,
  ImageIcon,
  Minus,
  Type
} from 'lucide-react';
import { LoginStep } from '@/components/steps/LoginStep';

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

interface SectionRendererProps {
  section: SectionData;
  isPreview?: boolean;
  isRuntimeMode?: boolean;
  onSelect?: () => void;
  storeOptions?: string[];
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  // Controlled store selector props for runtime binding
  purchaseChannel?: 'in-store' | 'online' | '';
  selectedStore?: string;
  onPurchaseChannelChange?: (channel: 'in-store' | 'online' | '') => void;
  onSelectedStoreChange?: (store: string) => void;
  // Login step props
  onAuthSuccess?: (params: { user: any; provider: string; marketingOptIn: boolean }) => void;
  onAuthError?: (error: Error) => void;
  onTrackEvent?: (eventName: string, metadata?: any) => void;
}

// Cache bust utility
const withCacheBust = (url: string, seed?: string | number): string => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = seed || Date.now();
  return `${url}${separator}cb=${timestamp}`;
};

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  isPreview = false,
  isRuntimeMode = false,
  onSelect,
  storeOptions = [],
  brandColors,
  purchaseChannel,
  selectedStore,
  onPurchaseChannelChange,
  onSelectedStoreChange,
  onAuthSuccess,
  onAuthError,
  onTrackEvent
}) => {
  const { getTemplateClasses, getBorderRadius } = useTemplateStyle();
  const { config } = section;
  
  // Local state for store selector preview (uncontrolled mode)
  const [previewPurchaseChannel, setPreviewPurchaseChannel] = useState<string>('');
  const [previewSelectedStore, setPreviewSelectedStore] = useState<string>('');
  
  // Use controlled props if provided, otherwise use internal state
  const isControlled = purchaseChannel !== undefined && onPurchaseChannelChange !== undefined;
  const currentPurchaseChannel = isControlled ? purchaseChannel! : previewPurchaseChannel;
  const currentSelectedStore = isControlled ? (selectedStore || '') : previewSelectedStore;
  
  const handlePurchaseChannelChange = (channel: 'in-store' | 'online' | '') => {
    if (isControlled && onPurchaseChannelChange) {
      onPurchaseChannelChange(channel);
    } else {
      setPreviewPurchaseChannel(channel);
      setPreviewSelectedStore(''); // Reset store selection
    }
  };
  
  const handleSelectedStoreChange = (store: string) => {
    if (isControlled && onSelectedStoreChange) {
      onSelectedStoreChange(store);
    } else {
      setPreviewSelectedStore(store);
    }
  };
  
  const paddingClass = `p-${config.padding ?? 4}`;
  const templateClasses = getTemplateClasses('card');
  
  // Full-bleed background wrapper style - only backgrounds here
  const getOuterStyle = () => {
    return {
      backgroundColor: config.backgroundColor || undefined,
      width: '100%'
    };
  };

  // Inner content style - shadows, borders, text color, but NO backgroundColor
  const getInnerStyle = () => {
    const shadowStyle = (config.dropShadow && section.type !== 'image') ? {
      boxShadow: `${config.shadowOffsetX || 0}px ${config.shadowOffsetY || 4}px ${config.shadowBlur || 10}px ${config.shadowSpread || 0}px ${config.shadowColor || 'rgba(0,0,0,0.1)'}`
    } : {
      boxShadow: 'none'
    };

    return {
      color: config.textColor || undefined,
      border: config.backgroundColor ? 'none' : undefined,
      padding: `${(config.padding ?? 4) * 0.25}rem`,
      maxWidth: 'var(--device-width-px, 390px)',
      margin: '0 auto',
      ...shadowStyle
    };
  };

  // Generate Tailwind drop shadow class for images
  const getImageDropShadowClass = () => {
    if (!config.dropShadow || section.type !== 'image') return '';
    
    // Use appropriate Tailwind drop-shadow class based on shadow config
    const blur = config.shadowBlur || 10;
    if (blur <= 4) return 'drop-shadow-sm';
    if (blur <= 8) return 'drop-shadow';
    if (blur <= 16) return 'drop-shadow-lg';
    return 'drop-shadow-xl';
  };

  const getSectionClassName = () => {
    // Start with template card classes but strip visual backgrounds/borders so sections inherit page background
    // For image sections, also strip shadows since they go on the image directly
    let classes = (config.dropShadow && section.type !== 'image') 
      ? templateClasses 
      : templateClasses.replace(/shadow-\w+/g, '');

    // Remove any background, border, and backdrop blur/gradient classes to avoid lightening
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };

  // Wrapper component for full-bleed sections
  const FullBleedWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={getOuterStyle()}>
      <div style={getInnerStyle()}>
        {children}
      </div>
    </div>
  );

  switch (section.type) {
    case 'header':
      return (
        <FullBleedWrapper>
          <div className={`header-section ${paddingClass} ${section.config?.backgroundColor === 'primary' ? 'bg-primary' : 'bg-background'}`}>
            {section.config?.logo && (
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-background/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">LOGO</span>
                </div>
              </div>
            )}
          </div>
        </FullBleedWrapper>
      );

    case 'hero':
      return (
        <FullBleedWrapper>
          <div className={`hero-section ${paddingClass} ${section.config?.align === 'center' ? 'text-center' : ''}`}>
            {section.config?.title && (
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {section.config.title}
              </h1>
            )}
            {section.config?.subtitle && (
              <h2 className="text-lg font-medium text-muted-foreground mb-2">
                {section.config.subtitle}
              </h2>
            )}
            {section.config?.description && (
              <p className="text-sm text-muted-foreground">
                {section.config.description}
              </p>
            )}
          </div>
        </FullBleedWrapper>
      );

    case 'features':
      return (
        <FullBleedWrapper>
          <div className={`features-section ${getSectionClassName()}`}>
            <div className="space-y-3">
              {section.config?.items?.map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FullBleedWrapper>
      );

    case 'cta':
      return (
        <FullBleedWrapper>
          <div className={`cta-section ${getSectionClassName()} flex justify-center`}>
            <button 
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                section.config?.size === 'lg' ? 'text-lg px-8 py-4' : 
                section.config?.size === 'sm' ? 'text-sm px-4 py-2' : ''
              }`}
              style={{
                backgroundColor: section.config?.buttonColor || (section.config?.color === 'secondary' ? 'var(--template-secondary)' : section.config?.color === 'accent' ? 'var(--template-accent)' : 'var(--template-primary)'),
                color: section.config?.textColor || '#ffffff'
              }}
            >
              {section.config?.text || 'Click here'}
            </button>
          </div>
        </FullBleedWrapper>
      );

    case 'product_showcase':
      return (
        <FullBleedWrapper>
          <div className={`product-showcase-section ${getSectionClassName()}`}>
            <div className={`p-6 rounded-lg ${section.config?.backgroundColor === 'primary' ? 'bg-primary/10' : 'bg-muted'}`}>
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              {section.config?.caption && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {section.config.caption}
                </p>
              )}
            </div>
          </div>
        </FullBleedWrapper>
      );

    case 'text':
      const formatContent = (content: string) => {
        if (!content) return 'Click to edit text...';
        
        return content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/__(.*?)__/g, '<u>$1</u>')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
          .replace(/\n/g, '<br/>');
      };

      return (
        <FullBleedWrapper>
          <div className={`text-section ${getSectionClassName()}`}>
            <div 
              className="prose prose-sm max-w-none"
              style={{ 
                fontSize: `${config.fontSize || 16}px`,
                fontWeight: config.fontWeight || 'normal',
                textAlign: config.align || 'left'
              }}
              dangerouslySetInnerHTML={{ __html: formatContent(config.content) }}
            />
          </div>
        </FullBleedWrapper>
      );
        
    case 'image':        
      return (
        <FullBleedWrapper>
          <div className={`image-section ${getSectionClassName()}`}>
            <div className="space-y-2">
              {config.imageUrl ? (
                <div 
                  className={`relative group ${!isPreview ? 'cursor-pointer' : ''}${config.dropShadow ? ' overflow-visible' : ''}`}
                  onClick={(e) => {
                    if (!isPreview && onSelect) {
                      e.stopPropagation();
                      onSelect();
                      setTimeout(() => {
                        document.dispatchEvent(
                          new CustomEvent('lov-open-image-editor', {
                            detail: { sectionId: section.id, imageUrl: config.imageUrl },
                          })
                        );
                      }, 250);
                    }
                  }}
                >
                  <img 
                    src={config.imageUrl} 
                    alt={config.alt || 'Section image'}
                    className={`w-full h-auto ${getBorderRadius()} select-none pointer-events-none transition-opacity ${!isPreview ? 'group-hover:opacity-80' : ''} ${getImageDropShadowClass()}`}
                    style={{ 
                      maxHeight: config.height || 'auto'
                    }}
                  />
                  {!isPreview && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded">
                      <div className="pointer-events-none bg-white/90 rounded-full p-2">
                        <Edit2 className="h-4 w-4 text-gray-700" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className={`w-full h-32 ${config.backgroundColor ? '' : 'bg-muted'} ${getBorderRadius()} flex items-center justify-center`}
                >
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                </div>
              )}
              {config.caption && (
                <p className="text-sm text-muted-foreground text-center">
                  {config.caption}
                </p>
              )}
            </div>
          </div>
        </FullBleedWrapper>
      );
        
    case 'store_selector':
      // Use actual store options if provided, otherwise fall back to config
      const availableStores = storeOptions.length > 0 ? storeOptions : 
        (config.storeOptions ? config.storeOptions.split('\n').filter((option: string) => option.trim()) : 
        ['Downtown Location', 'Mall Branch', 'Airport Store']);

      return (
        <FullBleedWrapper>
          <div className="store-selector-section space-y-4">
            
            {!currentPurchaseChannel ? (
              // Step 1: Purchase Channel Selection
              <div className="space-y-3">
                <button
                  className="w-full h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  style={{
                    backgroundColor: config.borderColor || brandColors?.primary || '#3b82f6',
                    color: 'white',
                    border: `1px solid ${config.borderColor || brandColors?.primary || '#3b82f6'}`,
                    '--tw-ring-color': config.focusBorderColor || brandColors?.primary || '#3b82f6'
                  } as React.CSSProperties}
                  onClick={(e) => {
                    console.log('Store selector config:', {
                      borderColor: config.borderColor,
                      focusBorderColor: config.focusBorderColor,
                      brandColors: brandColors
                    });
                    e.stopPropagation();
                    handlePurchaseChannelChange('in-store');
                  }}
                >
                  In-store
                </button>
                <button
                  className="w-full h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  style={{
                    backgroundColor: 'transparent',
                    color: config.borderColor || brandColors?.primary || '#3b82f6',
                    border: `1px solid ${config.borderColor || brandColors?.primary || '#3b82f6'}`,
                    '--tw-ring-color': config.focusBorderColor || brandColors?.primary || '#3b82f6'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${config.borderColor || brandColors?.primary || '#3b82f6'}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseChannelChange('online');
                  }}
                >
                  Online
                </button>
              </div>
            ) : (
              // Step 2: Store Selection
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Purchase channel:</span>
                  <span className="font-medium">
                    {currentPurchaseChannel === 'in-store' ? 'In-store' : 'Online'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseChannelChange('');
                    }}
                    className="text-xs underline h-auto p-0"
                  >
                    Change
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="store">Select Store</Label>
                  <Select 
                    value={currentSelectedStore} 
                    onValueChange={handleSelectedStoreChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your store" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStores.map((store: string) => (
                        <SelectItem key={store} value={store}>{store}</SelectItem>
                      ))}
                      <SelectItem value="other">Other Store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </FullBleedWrapper>
      );
        
    case 'divider':
      return (
        <FullBleedWrapper>
          <div className={`divider-section ${getSectionClassName()}`}>
            <hr 
              className="border-0"
              style={{
                height: `${config.thickness || 1}px`,
                backgroundColor: config.color || '#e5e7eb',
                width: `${config.width || 100}%`,
                margin: config.fullWidth ? '0' : '0 auto'
              }}
            />
          </div>
        </FullBleedWrapper>
      );
        
    case 'login_step':
      console.log('SectionRenderer rendering login_step with config:', config);
      return (
        <FullBleedWrapper>
          <div className={`login-step-section ${getSectionClassName()}`}>
            <LoginStep
              title={config.title}
              subtitle={config.subtitle}
              showEmail={config.showEmail}
              showApple={config.showApple}
              brandName={config.brandName || 'this brand'}
              onAuthSuccess={onAuthSuccess}
              onAuthError={onAuthError}
              onTrackEvent={onTrackEvent}
            />
          </div>
        </FullBleedWrapper>
      );
        
    case 'footer':
      return (
        <FullBleedWrapper>
          <PanaceaFooter 
            backgroundColor={config.backgroundColor} 
            logoSize={config.logoSize || 120}
          />
        </FullBleedWrapper>
      );
        
    default:
      return (
        <FullBleedWrapper>
          <p className="text-muted-foreground">Unknown section type</p>
        </FullBleedWrapper>
      );
  }
};