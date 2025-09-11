import React from 'react';
import { ShoppingBag, ExternalLink, DollarSign } from 'lucide-react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { Button } from '@/components/ui/button';

export const ProductListingSection: SectionComponent = ({ section, isPreview = false }) => {
  const { getTemplateClasses, getBorderRadius } = useTemplateStyle();
  const { config } = section;
  
  // Helper function to get padding style with backward compatibility
  const getPaddingStyle = () => {
    const paddingTop = config.paddingTop ?? config.padding ?? 1;
    const paddingRight = config.paddingRight ?? config.padding ?? 1;
    const paddingBottom = config.paddingBottom ?? config.padding ?? 1;
    const paddingLeft = config.paddingLeft ?? config.padding ?? 1;
    
    return {
      paddingTop: `${paddingTop}rem`,
      paddingRight: `${paddingRight}rem`,
      paddingBottom: `${paddingBottom}rem`,
      paddingLeft: `${paddingLeft}rem`
    };
  };
  
  const getSectionClassName = () => {
    let classes = config?.dropShadow ? getTemplateClasses('card') : getTemplateClasses('card').replace(/shadow-\w+/g, '');
    
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };

  const handleCTAClick = () => {
    if (config.ctaLink && !isPreview) {
      window.open(config.ctaLink, '_blank', 'noopener,noreferrer');
    }
  };

  const formatPrice = (price: string | number) => {
    if (!price) return '';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numPrice);
  };
  
  return (
    <div 
      className={`product-listing-section ${getSectionClassName()}`}
      style={getPaddingStyle()}
    >
      <div 
        className={`rounded-lg border ${getBorderRadius()} overflow-hidden`}
        style={{ 
          backgroundColor: config.backgroundColor || 'white',
          borderColor: config.borderColor || '#e2e8f0'
        }}
      >
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden">
          {config.productImage ? (
            <img 
              src={config.productImage} 
              alt={config.productName || 'Product image'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Product Image</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 
            className="font-semibold text-lg leading-tight"
            style={{ color: config.titleColor || '#1f2937' }}
          >
            {config.productName || 'Product Name'}
          </h3>

          {/* Product Description */}
          {config.productDescription && (
            <p 
              className="text-sm leading-relaxed"
              style={{ color: config.descriptionColor || '#6b7280' }}
            >
              {config.productDescription}
            </p>
          )}

          {/* Price and CTA Row */}
          <div className="flex items-center justify-between pt-2">
            {/* Price */}
            <div className="flex items-center gap-1">
              {config.productPrice && (
                <span 
                  className="text-xl font-bold"
                  style={{ color: config.priceColor || '#059669' }}
                >
                  {formatPrice(config.productPrice)}
                </span>
              )}
            </div>

            {/* CTA Button */}
            {config.ctaText && (
              <Button
                onClick={handleCTAClick}
                variant="default"
                size="sm"
                className="flex items-center gap-1"
                style={{
                  backgroundColor: config.ctaBackgroundColor || '#3b82f6',
                  color: config.ctaTextColor || 'white'
                }}
                disabled={isPreview}
              >
                {config.ctaText}
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};