import React, { useState } from 'react';
import { Shield, QrCode } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/components/Dashboard';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { RedirectManager } from '@/components/RedirectManager';
import { ProductVerification } from '@/components/ProductVerification';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'qr-generator':
        return <QRCodeGenerator />;
      case 'redirects':
        return <RedirectManager />;
      case 'verification':
        return <ProductVerification />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="neu-container p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="neu-subtle p-3 rounded-2xl">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Certified Platform</h1>
              <p className="text-sm text-foreground/60">Secure QR Code Management & Verification</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="neu-subtle px-3 py-2 rounded-xl">
              <span className="text-sm text-foreground/60">Status:</span>
              <span className="text-sm font-medium text-success ml-2">Online</span>
            </div>
            
            <div className="neu-button p-3 rounded-xl cursor-pointer hover:bg-surface-light">
              <QrCode className="w-5 h-5 text-foreground" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
