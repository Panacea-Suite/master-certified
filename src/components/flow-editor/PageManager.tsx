import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { 
  Home, 
  MapPin, 
  UserPlus, 
  Shield, 
  FileText, 
  CheckCircle,
  Loader2,
  XCircle
} from 'lucide-react';

export interface PageData {
  id: string;
  type: 'landing' | 'store_selection' | 'account_creation' | 'authentication' | 'product_authentication' | 'content_display' | 'thank_you';
  name: string;
  sections: any[];
  settings: any;
  isMandatory?: boolean;
  order: number;
  isSubPage?: boolean;
  parentPageId?: string;
}

interface PageManagerProps {
  pages: PageData[];
  currentPageId: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: (pageType: PageData['type']) => void;
  onDeletePage: (pageId: string) => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
}

const pageTypes = [
  { type: 'landing', icon: Home, title: 'Landing Page', description: 'Welcome page with branding', isMandatory: false },
  { type: 'store_selection', icon: MapPin, title: 'Store Selection', description: 'Choose store location', isMandatory: true },
  { type: 'account_creation', icon: UserPlus, title: 'Login/Signup', description: 'User authentication', isMandatory: true },
  { type: 'authentication', icon: Shield, title: 'Verification', description: 'User verification', isMandatory: true },
  { type: 'content_display', icon: FileText, title: 'Content Display', description: 'Show products/content', isMandatory: false },
  { type: 'thank_you', icon: CheckCircle, title: 'Final Sales Page', description: 'Completion message', isMandatory: true }
] as const;

const getPageTypeInfo = (type: PageData['type']) => {
  return pageTypes.find(pt => pt.type === type) || pageTypes[0];
};

const getMandatoryPages = (): PageData[] => {
  return [
    {
      id: 'store-selection',
      type: 'store_selection',
      name: 'Store Selection',
      sections: [],
      settings: {},
      isMandatory: true,
      order: 1
    },
    {
      id: 'login-signup',
      type: 'account_creation', 
      name: 'Login/Signup',
      sections: [],
      settings: {},
      isMandatory: true,
      order: 2
    },
    {
      id: 'verification',
      type: 'authentication',
      name: 'Verification',
      sections: [],
      settings: {},
      isMandatory: true,
      order: 3
    },
    {
      id: 'thank-you',
      type: 'thank_you',
      name: 'Final Sales Page',
      sections: [],
      settings: {},
      isMandatory: true,
      order: 4
    }
  ];
};

export const PageManager: React.FC<PageManagerProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage
}) => {
  const availablePageTypes = pageTypes.filter(pt => 
    !pt.isMandatory && !pages.some(page => page.type === pt.type)
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">Flow Pages</h4>
        {availablePageTypes.length > 0 && (
          <div className="relative group">
            <Button size="sm" variant="outline" className="h-7 w-7 p-0">
              <Plus className="h-3 w-3" />
            </Button>
            
            {/* Dropdown menu for available page types */}
            <div className="absolute top-8 right-0 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-1">
                {availablePageTypes.map((pageType) => {
                  const Icon = pageType.icon;
                  return (
                    <button
                      key={pageType.type}
                      onClick={() => onAddPage(pageType.type)}
                      className="w-full flex items-center gap-2 p-2 text-sm hover:bg-muted rounded text-left"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{pageType.title}</div>
                        <div className="text-xs text-muted-foreground">{pageType.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        {pages.sort((a, b) => (a.order || 0) - (b.order || 0)).map((page, index) => {
          const pageTypeInfo = getPageTypeInfo(page.type);
          const Icon = pageTypeInfo.icon;
          
          // Check if this page has authentication sections
          const hasAuthSections = page.type === 'authentication' || (page.sections || []).some((s: any) => s.type === 'authentication');
          
          return (
            <div key={page.id}>
              <Card
                className={`cursor-pointer transition-colors ${
                  page.id === currentPageId ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                } ${page.isMandatory ? 'border-orange-200 bg-orange-50/50' : ''}`}
                onClick={() => onSelectPage(page.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm">{page.type === 'thank_you' ? 'Final Sales Page' : page.name}</div>
                        {hasAuthSections && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Auth
                          </span>
                        )}
                        {page.isMandatory && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hasAuthSections ? 'Authentication Flow' : `${page.sections.length} sections`}
                      </div>
                    </div>
                    {!page.isMandatory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Show authentication sub-pages when this page is selected and has auth sections */}
              {hasAuthSections && page.id === currentPageId && (
                <div className="ml-6 mt-2 space-y-1">
                  {[
                    { id: 'idle', name: 'Start Authentication', icon: Shield },
                    { id: 'checking', name: 'Verifying...', icon: Loader2 },
                    { id: 'authentic', name: 'Product Verified', icon: CheckCircle },
                    { id: 'not-authentic', name: 'Verification Failed', icon: XCircle }
                  ].map((subPage) => {
                    const SubIcon = subPage.icon;
                    const subPageId = `${page.id}-${subPage.id}`;
                    return (
                      <Card
                        key={subPageId}
                        className={`cursor-pointer transition-colors border-l-2 border-l-primary/20 ${
                          currentPageId === subPageId ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPage(subPageId);
                        }}
                      >
                        <CardContent className="p-2 pl-4">
                          <div className="flex items-center gap-2">
                            <SubIcon className="h-3 w-3 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs">{subPage.name}</div>
                              <div className="text-xs text-muted-foreground">Auth State</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {pages.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">Flow will include all pages</p>
          <p className="text-xs">Landing → Store Selection → Login → Verification → Final Sales Page</p>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground p-2 bg-orange-50 border border-orange-200 rounded">
        💡 Required pages (Store Selection, Login, Verification, Final Sales Page) are automatically included and cannot be removed
      </div>
    </div>
  );
};