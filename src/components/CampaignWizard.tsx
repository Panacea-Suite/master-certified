import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Rocket } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Brand {
  id: string;
  name: string;
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
    approved_stores: string;
  };
  batch: {
    name: string;
    qr_code_count: number;
  };
  flow: {
    name: string;
    redirect_url: string;
  };
}

const CampaignWizard = ({ currentBrand, onComplete, onCancel }: CampaignWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    campaign: {
      name: '',
      description: '',
      approved_stores: ''
    },
    batch: {
      name: '',
      qr_code_count: 100
    },
    flow: {
      name: '',
      redirect_url: 'https://example.com'
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

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
        return wizardData.flow.name.trim() !== '' && wizardData.flow.redirect_url.trim() !== '';
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

  const createCampaignFlow = async () => {
    if (!currentBrand) {
      toast({
        title: "Error",
        description: "No brand selected",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create Campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: wizardData.campaign.name,
          description: wizardData.campaign.description || null,
          brand_id: currentBrand.id,
          approved_stores: wizardData.campaign.approved_stores 
            ? wizardData.campaign.approved_stores.split(',').map(s => s.trim()).filter(s => s)
            : []
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

      // Step 3: Create Flow
      const flowName = wizardData.flow.name || `${wizardData.campaign.name} - Flow`;
      const { data: flowData, error: flowError } = await supabase
        .from('flows')
        .insert([{
          name: flowName,
          campaign_id: campaignData.id,
          redirect_url: wizardData.flow.redirect_url,
          flow_config: {
            stages: [
              { title: 'Welcome', description: 'Customer scans QR code' },
              { title: 'Registration', description: 'Customer enters details' },
              { title: 'Verification', description: 'Email/SMS verification' },
              { title: 'Information', description: 'Product information display' },
              { title: 'Content', description: 'Testing docs & logistics' },
              { title: 'Completion', description: 'Thank you & redirect' }
            ]
          }
        }])
        .select()
        .single();

      if (flowError) throw flowError;

      toast({
        title: "Success!",
        description: `Campaign "${wizardData.campaign.name}" created successfully with batch and flow setup.`,
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
                value={wizardData.campaign.approved_stores}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  campaign: { ...wizardData.campaign, approved_stores: e.target.value }
                })}
                placeholder="Enter approved stores (comma-separated)"
              />
            </div>
            {currentBrand && (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Brand</Label>
                <p className="text-sm text-muted-foreground">
                  This campaign will be created for: <strong>{currentBrand.name}</strong>
                </p>
              </div>
            )}
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
              />
            </div>
            <div>
              <Label htmlFor="redirectUrl">Redirect URL *</Label>
              <Input
                id="redirectUrl"
                type="url"
                value={wizardData.flow.redirect_url}
                onChange={(e) => setWizardData({
                  ...wizardData,
                  flow: { ...wizardData.flow, redirect_url: e.target.value }
                })}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Where customers will be redirected after completing the flow
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Flow Stages Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                  <span>Welcome - Customer scans QR code</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                  <span>Registration - Customer enters details</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                  <span>Verification - Email/SMS verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">4</span>
                  <span>Information - Product information display</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">5</span>
                  <span>Content - Testing docs & logistics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">6</span>
                  <span>Completion - Thank you & redirect to {wizardData.flow.redirect_url}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              disabled={!validateStep(currentStep) || isProcessing}
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