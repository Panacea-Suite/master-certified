import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { 
  ChevronDown,
  CheckCircle,
  Package,
  Edit2,
  ImageIcon,
  Minus,
  Type,
  AlertTriangle
} from 'lucide-react';
import { LoginStep } from '@/components/steps/LoginStep';

// Common interfaces
export interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

export interface SectionRendererProps {
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
  // CTA navigation
  onNavigateToPage?: (pageId: string) => void;
  // Page background
  pageBackgroundColor?: string;
  // Authentication props  
  approvedStores?: string[];
}

export type SectionComponent = React.FC<SectionRendererProps>;

// Cache bust utility
const withCacheBust = (url: string, seed?: string | number): string => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = seed || Date.now();
  return `${url}${separator}cb=${timestamp}`;
};

// Safe fallback component for unknown section types
const UnknownSectionFallback: SectionComponent = ({ section, isPreview = false }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
  console.warn(`🔍 SectionRegistry: Unknown section type "${section.type}" encountered`, {
    sectionId: section.id,
    availableKeys: Object.keys(section.config || {}),
    config: section.config
  });

  return (
    <div className={`${paddingClass} ${getTemplateClasses('card')} border border-dashed border-orange-300 bg-orange-50/50`}>
      <div className="flex items-center gap-2 text-orange-700">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium text-sm">Unknown Section Type</span>
      </div>
      <div className="mt-2 text-xs text-orange-600">
        <div>Type: <code className="bg-orange-100 px-1 rounded">{section.type}</code></div>
        <div>ID: <code className="bg-orange-100 px-1 rounded">{section.id}</code></div>
        {!isPreview && (
          <div className="mt-1 text-orange-500">
            This section type is not recognized. Please check the section configuration or update the section registry.
          </div>
        )}
      </div>
    </div>
  );
};

// Error boundary wrapper for individual sections
class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionId: string; sectionType: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; sectionId: string; sectionType: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`🔍 SectionRegistry: Error in section ${this.props.sectionType} (${this.props.sectionId}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 bg-red-50/50 rounded">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">Section Error</span>
          </div>
          <div className="mt-2 text-xs text-red-600">
            <div>Type: <code className="bg-red-100 px-1 rounded">{this.props.sectionType}</code></div>
            <div>ID: <code className="bg-red-100 px-1 rounded">{this.props.sectionId}</code></div>
            <div className="mt-1 text-red-500">
              {this.state.error?.message || 'An error occurred while rendering this section'}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Section Registry - Maps section types to components
class SectionRegistryClass {
  private registry = new Map<string, SectionComponent>();
  private fallbackComponent: SectionComponent = UnknownSectionFallback;

  register(type: string, component: SectionComponent) {
    console.log(`🔍 SectionRegistry: Registering section type "${type}"`);
    this.registry.set(type, component);
  }

  get(type: string): SectionComponent {
    const component = this.registry.get(type);
    if (!component) {
      console.warn(`🔍 SectionRegistry: Section type "${type}" not found, using fallback`);
      return this.fallbackComponent;
    }
    return component;
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys()).sort();
  }

  setFallback(component: SectionComponent) {
    this.fallbackComponent = component;
  }

  // Utility function to check if a type is registered
  isRegistered(type: string): boolean {
    return this.registry.has(type);
  }

  // Utility function to get registry stats for debugging
  getStats() {
    return {
      totalRegistered: this.registry.size,
      registeredTypes: this.getRegisteredTypes(),
      hasFallback: !!this.fallbackComponent
    };
  }

  // Utility function to safely render any section with comprehensive error handling
  renderSection(section: SectionData, props: Omit<SectionRendererProps, 'section'>): React.ReactElement {
    console.log(`🔍 SectionRegistry: Rendering section ${section.type} (${section.id})`);
    
    const SectionComponent = this.get(section.type);
    const childElement = React.createElement(SectionComponent, { section, ...props });
    
    return React.createElement(
      SectionErrorBoundary, 
      {
        sectionId: section.id,
        sectionType: section.type,
        key: section.id,
        children: childElement
      }
    );
  }
}

// Export singleton instance
export const SectionRegistry = new SectionRegistryClass();

// Safe renderer that wraps sections in error boundaries
export const SafeSectionRenderer: React.FC<SectionRendererProps> = (props) => {
  const SectionComponent = SectionRegistry.get(props.section.type);
  
  return (
    <SectionErrorBoundary 
      sectionId={props.section.id} 
      sectionType={props.section.type}
    >
      <SectionComponent {...props} />
    </SectionErrorBoundary>
  );
};