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
    if (!loading && !user) {
      // Only redirect to auth if not on a customer route
      const currentPath = window.location.hash.slice(1); // Remove # from hash
      const isCustomerRoute = currentPath.startsWith('/flow') || 
                              currentPath.startsWith('/qr/') ||
                              currentPath === '/not-found';
      
      if (!isCustomerRoute) {
        navigate('/auth');
      }
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
    // Check if this is a customer route that shouldn't require auth
    const currentPath = window.location.hash.slice(1);
    const isCustomerRoute = currentPath.startsWith('/flow') || 
                            currentPath.startsWith('/qr/') ||
                            currentPath === '/not-found';
    
    if (isCustomerRoute) {
      // For customer routes, show a minimal layout or redirect appropriately
      return null; // Let the customer routes handle themselves
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