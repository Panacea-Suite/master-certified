import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { SectionRendererProps } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DocumentationSectionProps extends SectionRendererProps {}

interface Document {
  id: string;
  title: string;
  uploadDate: string;
  pdfUrl: string;
  description: string;
  simpleDescription: string;
  scientificDescription: string;
}

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  section,
  isPreview = false
}) => {
  const { getTemplateClasses } = useTemplateStyle();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [descriptionType, setDescriptionType] = useState<'simple' | 'scientific'>('simple');
  
  const config = section?.config || {};
  const documents: Document[] = config.documents || [];
  const sectionTitle = config.title || 'Documentation & Testing Results';
  const titleColor = config.titleColor || '#000000';
  const textColor = config.textColor || '#666666';
  const iconColor = config.iconColor || '#3b82f6';

  const handleDownload = (document: Document) => {
    if (document.pdfUrl) {
      window.open(document.pdfUrl, '_blank');
    }
  };

  const handleView = (document: Document) => {
    if (document.pdfUrl) {
      window.open(document.pdfUrl, '_blank');
    }
  };

  if (documents.length === 0 && isPreview) {
    return (
      <div className="py-8 text-center">
        <div className="max-w-md mx-auto">
          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: iconColor }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: titleColor }}>Documentation & Testing Results</h3>
          <p className="text-sm" style={{ color: textColor }}>
            Add documents in the settings panel to display them here.
          </p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: titleColor }}>{sectionTitle}</h2>
        
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <FileText className="w-5 h-5" style={{ color: iconColor }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg" style={{ color: titleColor }}>{document.title}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" style={{ color: textColor }} />
                        <span className="text-sm" style={{ color: textColor }}>
                          {new Date(document.uploadDate).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">PDF</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedDocument(document)}
                      >
                        <ChevronRight className="w-4 h-4 mr-1" style={{ color: iconColor }} />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2" style={{ color: titleColor }}>
                          <FileText className="w-5 h-5" style={{ color: iconColor }} />
                          {document.title}
                        </DialogTitle>
                      </DialogHeader>
                      <DialogDescription className="sr-only">Document details and actions</DialogDescription>
                      
                        <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
                          <Calendar className="w-4 h-4" style={{ color: iconColor }} />
                          Uploaded: {new Date(document.uploadDate).toLocaleDateString('en-GB')}
                        </div>
                        
                        {/* Description Type Toggle */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <button
                            onClick={() => setDescriptionType('simple')}
                            className={cn(
                              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                              descriptionType === 'simple' 
                                ? "bg-white shadow-sm text-primary" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Simple
                          </button>
                          <button
                            onClick={() => setDescriptionType('scientific')}
                            className={cn(
                              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                              descriptionType === 'scientific' 
                                ? "bg-white shadow-sm text-primary" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Scientific
                          </button>
                        </div>
                        
                        {/* Description Content */}
                        {(() => {
                          let content = '';
                          if (descriptionType === 'simple' && document.simpleDescription?.trim()) {
                            content = document.simpleDescription;
                          } else if (descriptionType === 'scientific' && document.scientificDescription?.trim()) {
                            content = document.scientificDescription;
                          } else if (document.description?.trim()) {
                            content = document.description;
                          }
                          
                          if (!content?.trim()) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">
                                  {descriptionType === 'simple' 
                                    ? 'No simple description available. Add one in the Flow Builder settings.'
                                    : descriptionType === 'scientific'
                                    ? 'No scientific description available. Add one in the Flow Builder settings.'
                                    : 'No description available. Add one in the Flow Builder settings.'
                                  }
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="prose prose-sm max-w-none">
                              <div 
                                style={{ color: textColor }}
                                dangerouslySetInnerHTML={{ 
                                  __html: content
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    .replace(/__(.*?)__/g, '<u>$1</u>')
                                    .replace(/• (.*?)(?=\n|$)/g, '<li>$1</li>')
                                    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
                                    .replace(/\n/g, '<br/>')
                                }}
                              />
                            </div>
                          );
                        })()}
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={() => handleView(document)}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" style={{ color: iconColor }} />
                            View PDF
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleDownload(document)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" style={{ color: iconColor }} />
                            Download
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};