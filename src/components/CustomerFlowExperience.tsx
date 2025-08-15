import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Shield, FileText, Package, Truck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FlowContent {
  id: string;
  content_type: string;
  title: string;
  content: any;
  file_url?: string;
}

interface CustomerFlowExperienceProps {
  flowId: string;
  qrCode: string;
}

const CustomerFlowExperience = ({ flowId, qrCode }: CustomerFlowExperienceProps) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [flow, setFlow] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [content, setContent] = useState<FlowContent[]>([]);
  const [isNewSectionFlow, setIsNewSectionFlow] = useState(false);
  const [userInputs, setUserInputs] = useState({
    selectedStore: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isAuthentic, setIsAuthentic] = useState<boolean | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const { toast } = useToast();

  const stages = [
    { type: 'landing', title: 'Welcome to Certified', icon: Shield },
    { type: 'store_location', title: 'Store Location', icon: Package },
    { type: 'account_creation', title: 'Create Account', icon: FileText },
    { type: 'authentication', title: 'Verification', icon: CheckCircle },
    { type: 'content', title: 'Product Information', icon: Truck }
  ];

  useEffect(() => {
    fetchFlowData();
  }, [flowId]);

  const fetchFlowData = async () => {
    try {
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .select(`
          *,
          campaigns (
            *,
            brands (
              name,
              logo_url,
              brand_colors
            )
          )
        `)
        .eq('id', flowId)
        .single();

      if (flowError) throw flowError;

      const { data: contentData, error: contentError } = await supabase
        .from('flow_content')
        .select('*')
        .eq('flow_id', flowId)
        .order('order_index');

      if (contentError) throw contentError;

      setFlow(flowData);
      setCampaign(flowData.campaigns);
      
      // Check if flow uses new section-based structure
      const flowConfig = flowData.flow_config as any;
      if (flowConfig?.pages && Array.isArray(flowConfig.pages) && flowConfig.pages.length > 0) {
        // Use new multi-page flow
        console.log('Using new multi-page flow with pages:', flowConfig.pages);
        setIsNewSectionFlow(true);
        setContent([]); // Clear old content
      } else if (flowConfig?.sections && Array.isArray(flowConfig.sections) && flowConfig.sections.length > 0) {
        // Use new section-based flow
        console.log('Using new section-based flow with sections:', flowConfig.sections);
        setIsNewSectionFlow(true);
        setContent([]); // Clear old content
      } else {
        // Use old flow_content table
        setIsNewSectionFlow(false);
        setContent(contentData || []);
      }
    } catch (error) {
      console.error('Error fetching flow data:', error);
      toast({
        title: "Error",
        description: "Failed to load verification flow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreSelection = (store: string) => {
    setUserInputs({ ...userInputs, selectedStore: store });
  };

  const authenticate = async () => {
    if (!userInputs.selectedStore) {
      toast({
        title: "Error",
        description: "Please select a store",
        variant: "destructive",
      });
      return;
    }

    setAuthenticating(true);
    
    // Simulate authentication check
    setTimeout(() => {
      const approvedStores = campaign?.approved_stores || [];
      const authentic = approvedStores.includes(userInputs.selectedStore);
      setIsAuthentic(authentic);
      setAuthenticating(false);
      
      setTimeout(() => {
        setCurrentStage(4); // Move to content stage
      }, 2000);
    }, 2000);
  };

  const nextStage = () => {
    if (currentStage === 2 && !hasAccount) {
      // Skip account creation if not wanted
      setCurrentStage(3);
      authenticate();
    } else if (currentStage === 3) {
      authenticate();
    } else {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    setCurrentStage(Math.max(0, currentStage - 1));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading verification flow...</p>
        </div>
      </div>
    );
  }

  const renderTemplateSection = (section: any) => {
    const paddingClass = `p-${section.config?.padding || 4}`;
    
    return (
      <div key={section.id} className={paddingClass}>
        {section.type === 'text' && (
          <div 
            style={{ 
              backgroundColor: section.config?.backgroundColor || 'transparent',
              color: section.config?.textColor || '#000000'
            }}
            className={`rounded ${section.config?.align === 'center' ? 'text-center' : ''}`}
          >
            <div 
              style={{ 
                fontSize: `${section.config?.fontSize || 16}px`,
                fontWeight: section.config?.fontWeight || 'normal'
              }}
            >
              {section.config?.content || 'No content'}
            </div>
          </div>
        )}
        
        {section.type === 'image' && (
          <div className="space-y-2">
            {section.config?.imageUrl ? (
              <img 
                src={section.config.imageUrl} 
                alt={section.config?.alt || 'Section image'}
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: section.config?.height || 'auto' }}
              />
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No image</p>
              </div>
            )}
            {section.config?.caption && (
              <p className="text-sm text-muted-foreground text-center">
                {section.config.caption}
              </p>
            )}
          </div>
        )}
        
        {section.type === 'store_selector' && (
          <div className="space-y-2">
            {section.config?.label && (
              <label className="block text-sm font-medium">
                {section.config.label}
              </label>
            )}
            <select
              className="w-full px-3 py-2 text-sm rounded-md border bg-background"
              value={userInputs.selectedStore}
              onChange={(e) => handleStoreSelection(e.target.value)}
            >
              <option value="">{section.config?.placeholder || 'Choose a store...'}</option>
              {campaign?.approved_stores?.map((store: string) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>
        )}
        
        {section.type === 'divider' && (
          <hr 
            className="border-0"
            style={{
              height: `${section.config?.thickness || 1}px`,
              backgroundColor: section.config?.color || '#e5e7eb',
              width: `${section.config?.width || 100}%`,
              margin: '0 auto'
            }}
          />
        )}
        
        {section.type === 'column' && (
          <div 
            className="grid grid-cols-2"
            style={{ 
              gap: `${(section.config?.gap || 4) * 0.25}rem`,
              backgroundColor: section.config?.backgroundColor || 'transparent'
            }}
          >
            <div className="p-4 border border-dashed border-muted-foreground/30 rounded text-center text-muted-foreground">
              Column layout ({section.config?.layout || '2-col-50-50'})
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMultiPageFlow = () => {
    const flowConfig = flow?.flow_config as any;
    const pages = flowConfig?.pages || [];
    
    if (!pages || pages.length === 0) return null;

    // Get the current page based on the current stage (for now, use first page)
    const currentPageIndex = Math.min(currentStage, pages.length - 1);
    const currentPage = pages[currentPageIndex];
    
    if (!currentPage?.sections) return null;

    const backgroundColor = flowConfig?.theme?.backgroundColor || '#ffffff';
    
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor }}
      >
        <div className="max-w-sm mx-auto px-4 py-6">
          <div className="space-y-4">
            {currentPage.sections.map((section: any) => renderTemplateSection(section))}
          </div>
        </div>
      </div>
    );
  };

  const renderSectionBasedFlow = () => {
    const flowConfig = flow?.flow_config as any;
    const sections = flowConfig?.sections || [];
    
    if (!sections || sections.length === 0) {
      console.log('No sections found in flow config');
      return null;
    }
    
    const backgroundColor = flowConfig?.theme?.backgroundColor || '#ffffff';
    
    return (
      <div 
        className="min-h-screen"
        style={{ backgroundColor }}
      >
        <div className="max-w-sm mx-auto px-4 py-6">
          <div className="space-y-4">
            {sections.map((section: any) => renderTemplateSection(section))}
          </div>
        </div>
      </div>
    );
  };

  const renderStageContent = () => {
    const stage = stages[currentStage];

    switch (stage.type) {
      case 'landing':
        return (
          <div className="text-center space-y-6">
            {campaign?.brands?.logo_url && (
              <img 
                src={campaign.brands.logo_url} 
                alt={campaign.brands.name}
                className="h-16 mx-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Certified</h1>
              <p className="text-muted-foreground">
                Verify the authenticity of your {campaign?.brands?.name} product using our secure verification system.
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">What you'll get:</h3>
              <ul className="text-sm space-y-1 text-left">
                <li>✓ Authentic product verification</li>
                <li>✓ Access to product documentation</li>
                <li>✓ Detailed product information</li>
                <li>✓ Supply chain transparency</li>
              </ul>
            </div>
          </div>
        );

      case 'store_location':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Store Location</h2>
              <p className="text-muted-foreground">
                Where did you purchase this product?
              </p>
            </div>
            <div>
              <Label htmlFor="store">Select Store</Label>
              <Select value={userInputs.selectedStore} onValueChange={handleStoreSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your store" />
                </SelectTrigger>
                <SelectContent>
                  {campaign?.approved_stores?.map((store: string) => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                  <SelectItem value="other">Other Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'account_creation':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Create Account (Optional)</h2>
              <p className="text-muted-foreground">
                Create an account for full access to product information
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setHasAccount(false)}
              >
                Skip for now
              </Button>
              
              {!hasAccount ? (
                <Button 
                  className="w-full"
                  onClick={() => setHasAccount(true)}
                >
                  Create Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userInputs.firstName}
                      onChange={(e) => setUserInputs({ ...userInputs, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userInputs.lastName}
                      onChange={(e) => setUserInputs({ ...userInputs, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInputs.email}
                      onChange={(e) => setUserInputs({ ...userInputs, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userInputs.password}
                      onChange={(e) => setUserInputs({ ...userInputs, password: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className="text-center space-y-6">
            {authenticating ? (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-bold mb-2">Verifying...</h2>
                <p className="text-muted-foreground">
                  Checking product authenticity against our database
                </p>
              </div>
            ) : isAuthentic !== null ? (
              <div className={`p-6 rounded-lg ${isAuthentic ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                {isAuthentic ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-green-800 mb-2">Authentic Product</h2>
                    <p className="text-green-700">
                      This product has been verified as authentic through our secure verification system.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h2>
                    <p className="text-red-700">
                      This product could not be verified. Please contact the brand for assistance.
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Product Information</h2>
              <p className="text-muted-foreground">
                Access detailed product documentation and information
              </p>
            </div>
            
            {!hasAccount && isAuthentic ? (
              <div className="bg-card p-4 rounded-lg border text-center">
                <div className="blur-sm mb-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2 w-3/4 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Create an account or login to view detailed product information
                </p>
                <Button className="w-full">
                  Create Account / Login
                </Button>
              </div>
            ) : isAuthentic ? (
              <div className="space-y-4">
                {content.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.content_type === 'testing_document' && <FileText className="h-4 w-4" />}
                        {item.content_type === 'product_info' && <Package className="h-4 w-4" />}
                        {item.content_type === 'logistics_info' && <Truck className="h-4 w-4" />}
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {item.content?.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.content.description}
                        </p>
                      )}
                      {item.file_url && (
                        <Button variant="outline" size="sm" className="w-full">
                          📎 View Document
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {content.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No additional content available for this product.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Product verification failed. Content not available.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Check if this is a multi-page flow, section-based flow, or legacy stage flow
  if (flow?.flow_config?.pages) {
    return renderMultiPageFlow();
  } else if (isNewSectionFlow) {
    return renderSectionBasedFlow();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="bg-card border-b">
        <div className="max-w-sm mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Step {currentStage + 1} of {stages.length}</span>
            <span className="text-xs text-muted-foreground">{Math.round(((currentStage + 1) / stages.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-sm mx-auto px-4 py-6">
        <div className="mb-8">
          {renderStageContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStage > 0 && currentStage < 4 && (
            <Button 
              variant="outline" 
              onClick={prevStage}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStage < 4 && currentStage !== 3 && (
            <Button 
              onClick={nextStage}
              className="flex-1"
              disabled={currentStage === 1 && !userInputs.selectedStore}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFlowExperience;