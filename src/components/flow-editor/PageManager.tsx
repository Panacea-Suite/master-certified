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
  CheckCircle 
} from 'lucide-react';

export interface PageData {
  id: string;
  type: 'landing' | 'store_selection' | 'account_creation' | 'authentication' | 'content_display' | 'thank_you';
  name: string;
  sections: any[];
  settings: any;
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
  { type: 'landing', icon: Home, title: 'Landing Page', description: 'Welcome page with branding' },
  { type: 'store_selection', icon: MapPin, title: 'Store Selection', description: 'Choose store location' },
  { type: 'account_creation', icon: UserPlus, title: 'Account Creation', description: 'User registration form' },
  { type: 'authentication', icon: Shield, title: 'Authentication', description: 'User verification' },
  { type: 'content_display', icon: FileText, title: 'Content Display', description: 'Show products/content' },
  { type: 'thank_you', icon: CheckCircle, title: 'Thank You', description: 'Completion message' }
] as const;

const getPageTypeInfo = (type: PageData['type']) => {
  return pageTypes.find(pt => pt.type === type) || pageTypes[0];
};

export const PageManager: React.FC<PageManagerProps> = ({
  pages,
  currentPageId,
  onSelectPage,
  onAddPage,
  onDeletePage
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">Flow Pages</h4>
        <div className="relative group">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0">
            <Plus className="h-3 w-3" />
          </Button>
          
          {/* Dropdown menu for page types */}
          <div className="absolute top-8 right-0 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-1">
              {pageTypes.map((pageType) => {
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
      </div>
      
      <div className="space-y-1">
        {pages.map((page, index) => {
          const pageTypeInfo = getPageTypeInfo(page.type);
          const Icon = pageTypeInfo.icon;
          
          return (
            <Card
              key={page.id}
              className={`cursor-pointer transition-colors ${
                page.id === currentPageId ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectPage(page.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{page.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {page.sections.length} sections
                    </div>
                  </div>
                  {pages.length > 1 && (
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
          );
        })}
      </div>
      
      {pages.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">No pages in flow yet</p>
          <p className="text-xs">Add a page to get started</p>
        </div>
      )}
    </div>
  );
};