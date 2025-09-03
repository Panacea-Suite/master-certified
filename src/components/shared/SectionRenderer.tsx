import React from 'react';
import { SafeSectionRenderer } from './SectionRegistry';
import './SectionRegistryInit'; // Auto-initialize registry

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
  // Page background color
  pageBackgroundColor?: string;
}

export const SectionRenderer: React.FC<SectionRendererProps> = (props) => {
  const { section, pageBackgroundColor } = props;
  const { config } = section;
  
  // Full-bleed background wrapper style - only backgrounds here
  const getOuterStyle = () => {
    // If section has its own background color, use it
    // Otherwise, inherit from page background (don't set backgroundColor at all to inherit)
    const sectionBgColor = config.backgroundColor;
    return {
      backgroundColor: sectionBgColor || undefined,
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

  // Wrapper component for full-bleed sections
  const FullBleedWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={getOuterStyle()}>
      <div style={getInnerStyle()}>
        {children}
      </div>
    </div>
  );

  return (
    <FullBleedWrapper>
      <SafeSectionRenderer {...props} />
    </FullBleedWrapper>
  );
};