import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const handlePresetClick = (color: string) => {
    onChange(color);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id} className="text-xs">{label}</Label>}
      
      {/* Brand Color Presets */}
      {brandColors && (
        <div className="flex gap-1 mb-2">
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => handlePresetClick(brandColors.primary)}
              className={cn(
                "w-6 h-6 rounded border-2 hover:scale-110 transition-transform",
                value === brandColors.primary ? "border-gray-400" : "border-gray-200"
              )}
              style={{ backgroundColor: brandColors.primary }}
              title="Primary Brand Color"
            />
            <span className="text-xs text-muted-foreground">Primary</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => handlePresetClick(brandColors.secondary)}
              className={cn(
                "w-6 h-6 rounded border-2 hover:scale-110 transition-transform",
                value === brandColors.secondary ? "border-gray-400" : "border-gray-200"
              )}
              style={{ backgroundColor: brandColors.secondary }}
              title="Secondary Brand Color"
            />
            <span className="text-xs text-muted-foreground">Secondary</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => handlePresetClick(brandColors.accent)}
              className={cn(
                "w-6 h-6 rounded border-2 hover:scale-110 transition-transform",
                value === brandColors.accent ? "border-gray-400" : "border-gray-200"
              )}
              style={{ backgroundColor: brandColors.accent }}
              title="Accent Brand Color"
            />
            <span className="text-xs text-muted-foreground">Accent</span>
          </div>
        </div>
      )}
      
      {/* Custom Color Input */}
      <Input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8", className)}
      />
    </div>
  );
};