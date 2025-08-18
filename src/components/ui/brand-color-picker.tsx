import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface BrandColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  className?: string;
  id?: string;
  showOpacity?: boolean;
}

export const BrandColorPicker: React.FC<BrandColorPickerProps> = ({
  label,
  value,
  onChange,
  brandColors,
  className,
  id,
  showOpacity = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper functions for color conversion
  const hexToHsla = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0, a: 1 };
    
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s: s * 100, l: l * 100, a: 1 };
  };
  
  const parseColorValue = (colorValue: string) => {
    if (colorValue.startsWith('hsla(')) {
      const match = colorValue.match(/hsla?\(([^)]+)\)/);
      if (match) {
        const [h, s, l, a = 1] = match[1].split(',').map((v, i) => 
          i === 3 ? parseFloat(v.trim()) : parseFloat(v.replace('%', '').trim())
        );
        return { h, s, l, a };
      }
    }
    
    if (colorValue.startsWith('#')) {
      return { ...hexToHsla(colorValue), a: 1 };
    }
    
    return { h: 0, s: 0, l: 50, a: 1 };
  };
  
  const currentColor = parseColorValue(value);
  
  const updateOpacity = (opacity: number) => {
    const { h, s, l } = currentColor;
    const newColor = `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
    onChange(newColor);
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id} className="text-xs">{label}</Label>}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full h-8 rounded border-2 border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-center",
              className
            )}
            style={{ backgroundColor: value }}
            title={`Current color: ${value}`}
          >
            <span className="text-xs text-white drop-shadow-md mix-blend-difference">
              {value}
            </span>
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64 p-4 bg-background border shadow-lg z-50" align="start">
          <div className="space-y-4">
            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Color</Label>
              <Input
                id={id}
                type="color"
                value={value.startsWith('#') ? value : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full"
              />
            </div>
            
            {/* Opacity Slider */}
            {showOpacity && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Opacity: {Math.round(currentColor.a * 100)}%</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={currentColor.a}
                  onChange={(e) => updateOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
            
            {/* Brand Colors Section */}
            {brandColors && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Brand Colours</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetClick(brandColors.primary)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 hover:scale-105 transition-all duration-200 shadow-sm",
                        value === brandColors.primary ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: brandColors.primary }}
                      title="Primary Brand Color"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Primary</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetClick(brandColors.secondary)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 hover:scale-105 transition-all duration-200 shadow-sm",
                        value === brandColors.secondary ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: brandColors.secondary }}
                      title="Secondary Brand Color"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Secondary</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetClick(brandColors.accent)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 hover:scale-105 transition-all duration-200 shadow-sm",
                        value === brandColors.accent ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300"
                      )}
                      style={{ backgroundColor: brandColors.accent }}
                      title="Accent Brand Color"
                    />
                    <span className="text-xs text-muted-foreground font-medium">Accent</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};