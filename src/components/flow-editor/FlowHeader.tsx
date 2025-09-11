import React from 'react';

interface FlowHeaderProps {
  globalHeader: {
    showHeader: boolean;
    brandName: string;
    logoUrl: string;
    backgroundColor: string;
    logoSize: string;
  };
}

const getLogoSize = (size: string) => {
  // Always return the numeric value as pixels, reduced by 65%
  const numericValue = parseInt(size) || 60; // Default to 60 if invalid
  const reducedSize = Math.round(numericValue * 0.35); // Reduce by 65% (keep 35%)
  return `${reducedSize}px`;
};

export const FlowHeader: React.FC<FlowHeaderProps> = ({ globalHeader }) => {
  if (!globalHeader.showHeader) return null;

  return (
    <div
      className="border-b flex items-center justify-center overflow-hidden relative z-10 py-2"
      style={{ 
        backgroundColor: globalHeader.backgroundColor,
        minHeight: '64px'
      }}
    >
      {globalHeader.logoUrl ? (
        <img
          src={globalHeader.logoUrl}
          alt={globalHeader.brandName}
          className="object-contain"
          style={{
            height: getLogoSize(globalHeader.logoSize),
            width: 'auto',
            maxWidth: '90%',
            imageRendering: 'auto',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-sm">
              {globalHeader.brandName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-sm">{globalHeader.brandName}</span>
        </div>
      )}
    </div>
  );
};
