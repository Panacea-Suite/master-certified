import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BrandColorPicker } from '@/components/ui/brand-color-picker';
import { ChevronDown, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export interface AuthenticationSubPage {
  id: string;
  name: string;
  icon: React.ElementType;
  type: 'idle' | 'checking' | 'authentic' | 'not-authentic';
  config: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    backgroundColor?: string;
    titleColor?: string;
    subtitleColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    progressColor?: string;
    successMessage?: string;
    failureMessage?: string;
    contactMessage?: string;
  };
}

const defaultAuthSubPages: AuthenticationSubPage[] = [
  {
    id: 'auth-idle',
    name: 'Start Authentication',
    icon: Shield,
    type: 'idle',
    config: {
      title: 'Product Authentication',
      subtitle: 'Preparing to verify your product',
      buttonText: 'Start Authentication',
      backgroundColor: '#ffffff',
      titleColor: '#000000',
      subtitleColor: '#6b7280',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff'
    }
  },
  {
    id: 'auth-checking',
    name: 'Verification Progress',
    icon: Loader2,
    type: 'checking',
    config: {
      title: 'Authenticating Product...',
      subtitle: 'Please wait while we verify your product authenticity',
      backgroundColor: '#ffffff',
      titleColor: '#000000',
      subtitleColor: '#6b7280',
      progressColor: '#3b82f6'
    }
  },
  {
    id: 'auth-success',
    name: 'Authentication Success',
    icon: CheckCircle,
    type: 'authentic',
    config: {
      title: 'Product Authenticated!',
      subtitle: 'Your product is genuine and verified',
      successMessage: 'Your product has been successfully verified as authentic!',
      backgroundColor: '#ffffff',
      titleColor: '#16a34a',
      subtitleColor: '#6b7280'
    }
  },
  {
    id: 'auth-failure',
    name: 'Authentication Failed',
    icon: XCircle,
    type: 'not-authentic',
    config: {
      title: 'Product Not Authentic',
      subtitle: 'This product could not be authenticated',
      failureMessage: 'This product could not be authenticated. This product may be counterfeit or from an unauthorized retailer.',
      contactMessage: 'Please contact the brand directly if you believe this is an error.',
      buttonText: 'Close',
      backgroundColor: '#ffffff',
      titleColor: '#dc2626',
      subtitleColor: '#6b7280',
      buttonColor: '#6b7280',
      buttonTextColor: '#ffffff'
    }
  }
];

interface AuthenticationSubPageManagerProps {
  authConfig?: any;
  onUpdateAuthConfig?: (config: any) => void;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
}

export const AuthenticationSubPageManager: React.FC<AuthenticationSubPageManagerProps> = ({
  authConfig = {},
  onUpdateAuthConfig = () => {},
  brandColors
}) => {
  const [selectedSubPageId, setSelectedSubPageId] = useState<string>('auth-idle');
  const [subPages, setSubPages] = useState<AuthenticationSubPage[]>(() => {
    // Merge default config with saved config
    return defaultAuthSubPages.map(defaultPage => ({
      ...defaultPage,
      config: {
        ...defaultPage.config,
        ...(authConfig.subPages?.[defaultPage.id] || {})
      }
    }));
  });

  const selectedSubPage = subPages.find(page => page.id === selectedSubPageId) || subPages[0];

  const updateSubPageConfig = (configUpdates: Partial<AuthenticationSubPage['config']>) => {
    const updatedSubPages = subPages.map(page =>
      page.id === selectedSubPageId
        ? { ...page, config: { ...page.config, ...configUpdates } }
        : page
    );
    
    setSubPages(updatedSubPages);
    
    // Convert to save format
    const subPagesConfig = updatedSubPages.reduce((acc, page) => ({
      ...acc,
      [page.id]: page.config
    }), {});
    
    onUpdateAuthConfig({
      ...authConfig,
      subPages: subPagesConfig
    });
  };

  const renderConfigEditor = () => {
    if (!selectedSubPage) return null;

    const { config, type } = selectedSubPage;

    return (
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={config.title || ''}
            onChange={(e) => updateSubPageConfig({ title: e.target.value })}
            placeholder="Enter title text"
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={config.subtitle || ''}
            onChange={(e) => updateSubPageConfig({ subtitle: e.target.value })}
            placeholder="Enter subtitle text"
          />
        </div>

        {/* Button Text (for idle and failure states) */}
        {(type === 'idle' || type === 'not-authentic') && (
          <div className="space-y-2">
            <Label htmlFor="buttonText">Button Text</Label>
            <Input
              id="buttonText"
              value={config.buttonText || ''}
              onChange={(e) => updateSubPageConfig({ buttonText: e.target.value })}
              placeholder="Enter button text"
            />
          </div>
        )}

        {/* Success Message (for authentic state) */}
        {type === 'authentic' && (
          <div className="space-y-2">
            <Label htmlFor="successMessage">Success Message</Label>
            <Textarea
              id="successMessage"
              value={config.successMessage || ''}
              onChange={(e) => updateSubPageConfig({ successMessage: e.target.value })}
              placeholder="Enter success message"
            />
          </div>
        )}

        {/* Failure Messages (for not-authentic state) */}
        {type === 'not-authentic' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="failureMessage">Failure Message</Label>
              <Textarea
                id="failureMessage"
                value={config.failureMessage || ''}
                onChange={(e) => updateSubPageConfig({ failureMessage: e.target.value })}
                placeholder="Enter failure message"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactMessage">Contact Message</Label>
              <Textarea
                id="contactMessage"
                value={config.contactMessage || ''}
                onChange={(e) => updateSubPageConfig({ contactMessage: e.target.value })}
                placeholder="Enter contact message"
              />
            </div>
          </>
        )}

        {/* Colors */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Colors</h4>
          
          {/* Background Color */}
          <div className="space-y-2">
            <Label>Background Color</Label>
            <BrandColorPicker
              value={config.backgroundColor || '#ffffff'}
              onChange={(color) => updateSubPageConfig({ backgroundColor: color })}
              brandColors={brandColors}
            />
          </div>

          {/* Title Color */}
          <div className="space-y-2">
            <Label>Title Color</Label>
            <BrandColorPicker
              value={config.titleColor || '#000000'}
              onChange={(color) => updateSubPageConfig({ titleColor: color })}
              brandColors={brandColors}
            />
          </div>

          {/* Subtitle Color */}
          <div className="space-y-2">
            <Label>Subtitle Color</Label>
            <BrandColorPicker
              value={config.subtitleColor || '#6b7280'}
              onChange={(color) => updateSubPageConfig({ subtitleColor: color })}
              brandColors={brandColors}
            />
          </div>

          {/* Button Colors (for idle and failure states) */}
          {(type === 'idle' || type === 'not-authentic') && (
            <>
              <div className="space-y-2">
                <Label>Button Color</Label>
                <BrandColorPicker
                  value={config.buttonColor || '#3b82f6'}
                  onChange={(color) => updateSubPageConfig({ buttonColor: color })}
                  brandColors={brandColors}
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text Color</Label>
                <BrandColorPicker
                  value={config.buttonTextColor || '#ffffff'}
                  onChange={(color) => updateSubPageConfig({ buttonTextColor: color })}
                  brandColors={brandColors}
                />
              </div>
            </>
          )}

          {/* Progress Color (for checking state) */}
          {type === 'checking' && (
            <div className="space-y-2">
              <Label>Progress Color</Label>
              <BrandColorPicker
                value={config.progressColor || '#3b82f6'}
                onChange={(color) => updateSubPageConfig({ progressColor: color })}
                brandColors={brandColors}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Authentication Sub-Pages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sub-page selector */}
        <div className="space-y-2">
          <Label>Select Sub-Page to Edit</Label>
          <Select value={selectedSubPageId} onValueChange={setSelectedSubPageId}>
            <SelectTrigger>
              <SelectValue placeholder="Select authentication sub-page" />
            </SelectTrigger>
            <SelectContent>
              {subPages.map((subPage) => {
                const Icon = subPage.icon;
                return (
                  <SelectItem key={subPage.id} value={subPage.id}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {subPage.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Config editor for selected sub-page */}
        {renderConfigEditor()}
      </CardContent>
    </Card>
  );
};