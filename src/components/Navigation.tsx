import React from 'react';
import { BarChart3, QrCode, Settings, Shield } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'brands', label: 'Brands', icon: Settings },
    { id: 'campaigns', label: 'Campaigns', icon: QrCode },
    { id: 'batches', label: 'Batches', icon: QrCode },
    { id: 'verification', label: 'Verification', icon: Shield }
  ];

  return (
    <nav className="bg-card border border-border rounded-lg p-6 mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground font-medium' 
                  : 'hover:bg-accent hover:text-accent-foreground text-foreground'
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