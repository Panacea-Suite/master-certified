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
}

export const BrandColorPicker: React.FC<BrandColorPickerProps> = ({
  label,
  value,
  onChange,
  brandColors,
  className,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full"
              />
            </div>
            
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