import React from 'react';
import { BarChart3, QrCode, Settings, Shield } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'qr-generator', label: 'QR Generator', icon: QrCode },
    { id: 'redirects', label: 'Redirects', icon: Settings },
    { id: 'verification', label: 'Verification', icon: Shield }
  ];

  return (
    <nav className="neu-card p-6 mb-8">
      <div className="flex flex-col sm:flex-row gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive 
                  ? 'neu-pressed bg-card-pressed text-primary font-medium' 
                  : 'neu-button hover:bg-surface-light text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};