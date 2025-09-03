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
  purchaseChannel?: 'in-store' | 'online' | '';
  selectedStore?: string;
  onPurchaseChannelChange?: (channel: 'in-store' | 'online' | '') => void;
  onSelectedStoreChange?: (store: string) => void;
  onAuthSuccess?: (params: { user: any; provider: string; marketingOptIn: boolean }) => void;
  onAuthError?: (error: Error) => void;
  onTrackEvent?: (eventName: string, metadata?: any) => void;
  pageBackgroundColor?: string;
  onNavigateToPage?: (pageId: string) => void;
  approvedStores?: string[];
}

export const SectionRenderer: React.FC<SectionRendererProps> = (props) => {
  const { section, pageBackgroundColor } = props;
  const { config } = section;
  
  // Full-bleed background wrapper style - only backgrounds here
  const getOuterStyle = () => {
    // If section has its own background color set (and not 'transparent'), use it
    // If section explicitly set to 'transparent', don't inherit page background
    // Only inherit page background if no section background is configured at all
    const sectionBgColor = config.backgroundColor;
    
    if (sectionBgColor === 'transparent' || sectionBgColor === '') {
      // Explicitly transparent - don't inherit page background
      return { width: '100%' };
    } else if (sectionBgColor) {
      // Section has its own background color
      return { 
        width: '100%',
        backgroundColor: sectionBgColor
      };
    } else if (pageBackgroundColor) {
      // No section background, inherit from page
      return { 
        width: '100%',
        backgroundColor: pageBackgroundColor
      };
    }
    
    // Default - no background
    return { width: '100%' };
  };

  // Inner content container style - padding and alignment
  const getInnerStyle = () => {
    return {
      maxWidth: 'var(--device-width-px, 390px)',
      margin: '0 auto',
      width: '100%'
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