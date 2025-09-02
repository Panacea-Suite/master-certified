import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FlowTemplateSelector } from './FlowTemplateSelector';

interface Brand {
  id: string;
  name: string;
  approved_stores?: string[];
  logo_url?: string;
}

interface CampaignWizardProps {
  currentBrand: Brand | null;
  onComplete: () => void;
  onCancel: () => void;
}

interface WizardData {
  campaign: {
    name: string;
    description: string;
    approved_stores: string[];
    brand_id?: string;
  };
  batch: {
    name: string;
    qr_code_count: number;
  };
  flow: {
    name: string;
    selectedTemplate: any;
    templateData: any;
  };
}

const CampaignWizard = ({ currentBrand, onComplete, onCancel }: CampaignWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    campaign: {
      name: '',
      description: '',
      approved_stores: currentBrand?.approved_stores || [],
      brand_id: currentBrand?.id
    },
    batch: {
      name: '',
      qr_code_count: 100
    },
    flow: {
      name: '',
      selectedTemplate: null,
      templateData: null
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const { toast } = useToast();

  // Update wizard data when currentBrand becomes available
  useEffect(() => {
    if (!currentBrand) return;
    console.log('🔍 CampaignWizard: currentBrand resolved, updating wizard data:', currentBrand.id);
    setWizardData(d => ({
      ...d,
      campaign: { 
        ...d.campaign, 
        brand_id: currentBrand.id, 
        approved_stores: currentBrand.approved_stores || [] 
      }
    }));
  }, [currentBrand]);

  const steps = [
    { number: 1, title: 'Campaign Details', description: 'Set up your campaign basics' },
    { number: 2, title: 'Create Batch', description: 'Configure QR code generation' },
    { number: 3, title: 'Setup Flow', description: 'Design customer experience' }
  ];

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return wizardData.campaign.name.trim() !== '';
      case 2:
        return wizardData.batch.name.trim() !== '' && wizardData.batch.qr_code_count > 0;
      case 3:
        return wizardData.flow.name.trim() !== '' && wizardData.flow.templateData !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleTemplateSelect = (template: any) => {
    console.log('Template selected:', template);
    setWizardData(prev => ({
      ...prev,
      flow: {
        ...prev.flow,
        selectedTemplate: template,
        templateData: template,
        name: template?.name || prev.flow.name
      }
    }));
    setShowTemplateSelector(false);
  };

  const createCampaignFlow = async () => {
    if (!currentBrand) {
      console.log('🔍 CampaignWizard: No currentBrand at submit time');
      toast({
        title: "Error",
        description: "No brand selected",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 CampaignWizard: Creating campaign for brand:', currentBrand.id);
    setIsProcessing(true);
    try {
      // Step 1: Create Campaign with generated access token
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: wizardData.campaign.name,
          description: wizardData.campaign.description || null,
          brand_id: currentBrand.id,
          approved_stores: wizardData.campaign.approved_stores,
          customer_access_token: crypto.randomUUID().replace(/-/g, '').substring(0, 32)
        }])
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Step 2: Create Batch
      const batchName = wizardData.batch.name || `${wizardData.campaign.name} - Batch 1`;
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .insert([{
          name: batchName,
          campaign_id: campaignData.id,
          qr_code_count: wizardData.batch.qr_code_count,
          status: 'pending'
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Step 3: Create Flow using template data and immediately publish it
      const flowName = wizardData.flow.name || `${wizardData.campaign.name} - Flow`;
      const flowConfig = wizardData.flow.templateData || {
        pages: [
          {
            id: 'landing-page',
            type: 'landing',
            name: 'Landing Page',
            sections: [],
            settings: {},
            order: 0
          }
        ],
        globalHeader: {
          showHeader: true,
          brandName: currentBrand.name,
          logoUrl: currentBrand.logo_url || '',
          backgroundColor: '#6B7280'
        }
      };

      // Create published snapshot with additional metadata
      const publishedSnapshot = {
        ...flowConfig,
        name: flowName,
        publishedAt: new Date().toISOString(),
        version: 1
      };

      console.log('🔍 CampaignWizard: Creating flow with published_snapshot');
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .insert([{
          name: flowName,
          campaign_id: campaignData.id,
          base_url: `${window.location.origin}/flow/${campaignData.id}`,
          flow_config: flowConfig,
          published_snapshot: publishedSnapshot,
          latest_published_version: 1
        }])
        .select()
        .single();

      if (flowError) throw flowError;

      // Also create flow_content records for backup/draft mode
      if (flowConfig.pages && flowConfig.pages.length > 0) {
        console.log('🔍 CampaignWizard: Creating flow_content backup records');
        const contentRecords = flowConfig.pages.map((page: any, index: number) => ({
          flow_id: flowData.id,
          title: page.name || `Page ${index + 1}`,
          content_type: 'page',
          content: page as any,
          order_index: page.order || index
        }));

        const { error: contentError } = await supabase
          .from('flow_content')
          .insert(contentRecords);
        
        if (contentError) {
          console.warn('🔍 CampaignWizard: Failed to create flow_content backup:', contentError);
          // Don't throw - main flow is created
        }
      }

      toast({
        title: "Success!",
        description: `Campaign "${wizardData.campaign.name}" created successfully with custom flow.`,
      });

      onComplete();
    } catch (error) {
      console.error('Error creating campaign flow:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Create New Campaign</CardTitle>
              <CardDescription>
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center space-x-2">
                  {step.number < currentStep ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : step.number === currentStep ? (
                    <Circle className="w-5 h-5 text-primary fill-current" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${
                    step.number <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Set up the basic information for your new campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name *</Label>
              <Input
                id="campaignName"
                value={wizardData.campaign.name}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  campaign: { ...wizardData.campaign, name: e.target.value }
                })}
                placeholder="Enter campaign name"
              />
            </div>
            <div>
              <Label htmlFor="campaignDescription">Description</Label>
              <Textarea
                id="campaignDescription"
                value={wizardData.campaign.description}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  campaign: { ...wizardData.campaign, description: e.target.value }
                })}
                placeholder="Enter campaign description"
              />
            </div>
            <div>
              <Label htmlFor="approvedStores">Approved Stores</Label>
              <Textarea
                id="approvedStores"
                value={wizardData.campaign.approved_stores.join(', ')}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  campaign: { 
                    ...wizardData.campaign, 
                    approved_stores: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                  }
                })}
                placeholder="Enter approved stores (comma-separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pre-populated from your brand settings. You can customize them for this campaign.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Batch</CardTitle>
            <CardDescription>
              Configure QR code generation for your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="batchName">Batch Name *</Label>
              <Input
                id="batchName"
                value={wizardData.batch.name}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  batch: { ...wizardData.batch, name: e.target.value }
                })}
                placeholder={`${wizardData.campaign.name} - Batch 1`}
              />
            </div>
            <div>
              <Label htmlFor="qrCount">QR Code Count *</Label>
              <Input
                id="qrCount"
                type="number"
                min="1"
                max="10000"
                value={wizardData.batch.qr_code_count}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  batch: { ...wizardData.batch, qr_code_count: parseInt(e.target.value) || 0 }
                })}
                placeholder="Number of QR codes to generate"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can generate between 1 and 10,000 QR codes for this batch
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Batch Summary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Campaign: {wizardData.campaign.name}</li>
                <li>• QR Codes: {wizardData.batch.qr_code_count}</li>
                <li>• Status: Will be set to "Pending" (ready for generation)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Flow</CardTitle>
            <CardDescription>
              Configure the customer experience flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentBrand && (
              <div className="p-3 border border-destructive bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Brand information is still loading. Please wait a moment before proceeding.
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="flowName">Flow Name *</Label>
              <Input
                id="flowName"
                value={wizardData.flow.name}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  flow: { ...wizardData.flow, name: e.target.value }
                })}
                placeholder={`${wizardData.campaign.name} - Flow`}
                disabled={!currentBrand}
              />
            </div>
            
            <div>
              <Label>Flow Template</Label>
              <div className="mt-2">
                {wizardData.flow.templateData ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{wizardData.flow.templateData.name || 'Custom Flow'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {wizardData.flow.templateData.pages?.length || 1} pages configured
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateSelector(true)}
                      >
                        Change Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateSelector(true)}
                    className="w-full"
                    disabled={!currentBrand}
                  >
                    Choose Flow Template
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <FlowTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next: {steps[currentStep].title}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={createCampaignFlow}
              disabled={!validateStep(currentStep) || isProcessing || !currentBrand}
            >
              <Rocket className="w-4 h-4 mr-2" />
              {isProcessing ? 'Creating...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignWizard;