import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Download, ExternalLink, Award, FileText, ShoppingBag, Sparkles } from 'lucide-react';
import type { FlowSession } from '@/hooks/useCertificationFlow';

interface FinalPageStepProps {
  session: FlowSession | null;
  onTrackEvent: (eventName: string, metadata?: any) => void;
}

export const FinalPageStep: React.FC<FinalPageStepProps> = ({
  session,
  onTrackEvent
}) => {
  React.useEffect(() => {
    onTrackEvent('final_viewed', {
      session_id: session?.id,
      verification_result: session?.verification?.result
    });
  }, [onTrackEvent, session]);

  const handleDocumentOpen = (docType: string) => {
    onTrackEvent('doc_opened', {
      session_id: session?.id,
      doc_type: docType
    });
  };

  const handleUpsellClick = (sku: string) => {
    onTrackEvent('upsell_clicked', {
      session_id: session?.id,
      sku: sku
    });
  };

  const mockCOAUrl = '/mock-coa.pdf';
  const mockTestResultsUrl = '/mock-test-results.pdf';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Verification Success Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <CardTitle className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
              <Award className="w-8 h-8" />
              Verified Authentic
            </CardTitle>
            
            <CardDescription className="text-lg mt-2">
              This product has been successfully verified as authentic from {session?.brand.name}
            </CardDescription>

            {session?.verification && (
              <div className="flex justify-center mt-4">
                <Badge variant={
                  session.verification.result === 'pass' ? 'default' : 
                  session.verification.result === 'warn' ? 'secondary' : 'destructive'
                } className="text-sm px-4 py-1">
                  Verification: {session.verification.result.toUpperCase()}
                </Badge>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Batch Details */}
        {session?.verification?.batch_info && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Batch ID</p>
                  <p className="font-mono font-medium">{session.verification.batch_info.batch_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch Name</p>
                  <p className="font-medium">{session.verification.batch_info.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="default">{session.verification.batch_info.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified Date</p>
                  <p className="font-medium">
                    {new Date(session.verification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents & Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Download className="w-5 h-5" />
              Certificates & Test Results
            </CardTitle>
            <CardDescription>
              Access official documentation and test results for this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-between h-auto p-4"
                onClick={() => handleDocumentOpen('coa')}
              >
                <div className="text-left">
                  <div className="font-medium">Certificate of Analysis (COA)</div>
                  <div className="text-sm text-muted-foreground">
                    Official lab analysis and potency results
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button 
                variant="outline" 
                className="justify-between h-auto p-4"
                onClick={() => handleDocumentOpen('test_results')}
              >
                <div className="text-left">
                  <div className="font-medium">Third-Party Test Results</div>
                  <div className="text-sm text-muted-foreground">
                    Independent lab verification reports
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button 
                variant="outline" 
                className="justify-between h-auto p-4"
                onClick={() => handleDocumentOpen('authenticity_cert')}
              >
                <div className="text-left">
                  <div className="font-medium">Authenticity Certificate</div>
                  <div className="text-sm text-muted-foreground">
                    Official verification document
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                What these documents show
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Detailed cannabinoid and terpene profiles</li>
                <li>• Heavy metals and pesticide screening results</li>
                <li>• Microbial contamination testing</li>
                <li>• Potency verification and consistency data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Brand Upsell/Cross-sell */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Exclusive Products from {session?.brand.name}
            </CardTitle>
            <CardDescription>
              Discover more authentic products from this trusted brand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                   onClick={() => handleUpsellClick('premium-gummies')}>
                <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium">Premium Gummies</h4>
                <p className="text-sm text-muted-foreground">25mg THC • 30 count</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">$45.99</span>
                  <Badge variant="secondary">New</Badge>
                </div>
              </div>

              <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                   onClick={() => handleUpsellClick('tincture-oil')}>
                <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-medium">Full Spectrum Tincture</h4>
                <p className="text-sm text-muted-foreground">1000mg CBD • 30ml</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">$89.99</span>
                  <Badge variant="default">Bestseller</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleUpsellClick('brand-store')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shop All {session?.brand.name} Products
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleUpsellClick('newsletter-signup')}
              >
                Get Exclusive Offers & Updates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Redirect Option */}
        {session?.campaign.final_redirect_url && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Continue to the brand's website for more information
                </p>
                <Button asChild>
                  <a href={session.campaign.final_redirect_url} target="_blank" rel="noopener noreferrer">
                    Visit {session.brand.name}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Verification completed at {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};