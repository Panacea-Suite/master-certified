import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import BrandManager from '@/components/BrandManager';
import BrandSettings from '@/components/BrandSettings';
import CampaignManager from '@/components/CampaignManager';
import BatchManager from '@/components/BatchManager';
import TemplateManager from '@/components/TemplateManager';
import { SystemTemplateManager } from '@/components/SystemTemplateManager';

import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const AdminIndex = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Early return for customer routes - never redirect to auth
    const currentPath = window.location.hash.slice(1);
    const isCustomerRoute = currentPath.startsWith('/flow') || 
                            currentPath.startsWith('/qr') ||
                            currentPath === '/not-found';
    
    if (isCustomerRoute) {
      return; // Never redirect customer routes to auth
    }
    
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'brands':
        return <BrandManager />;
      case 'system-templates':
        return <SystemTemplateManager />;
      case 'brand-settings':
        return <BrandSettings />;
      case 'campaigns':
        return <CampaignManager />;
      case 'batches':
        return <BatchManager />;
      case 'templates':
        return <TemplateManager />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Customer routes should never reach this point due to routing changes
    // but keeping as safety net
    const currentPath = window.location.hash.slice(1);
    const isCustomerRoute = currentPath.startsWith('/flow') || 
                            currentPath.startsWith('/qr') ||
                            currentPath === '/not-found';
    
    if (isCustomerRoute) {
      return null; // Let customer routes handle themselves
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-3xl font-bold">Certified Platform</h1>
          <p className="text-muted-foreground">Please sign in to access the platform</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </>
  );
};

export default AdminIndex;