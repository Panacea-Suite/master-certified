import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { SectionRendererProps } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

interface DocumentationSectionProps extends SectionRendererProps {}

interface Document {
  id: string;
  title: string;
  uploadDate: string;
  pdfUrl: string;
  description: string;
}

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  section,
  isPreview = false
}) => {
  const { getTemplateClasses } = useTemplateStyle();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const config = section?.config || {};
  const documents: Document[] = config.documents || [];
  const sectionTitle = config.title || 'Documentation & Testing Results';

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
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Documentation & Testing Results</h3>
          <p className="text-muted-foreground text-sm">
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
        <h2 className="text-2xl font-bold mb-6 text-center">{sectionTitle}</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(document.uploadDate).toLocaleDateString()}
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
                        className="flex-1"
                        onClick={() => setSelectedDocument(document)}
                      >
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {document.title}
                        </DialogTitle>
                      </DialogHeader>
                      <DialogDescription className="sr-only">Document details and actions</DialogDescription>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                        </div>
                        
                        {document.description && (
                          <div className="prose prose-sm max-w-none">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: document.description
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
                        )}
                        
                        <div className="flex gap-3 pt-4">
                          <Button 
                            onClick={() => handleView(document)}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View PDF
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleDownload(document)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleView(document)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};