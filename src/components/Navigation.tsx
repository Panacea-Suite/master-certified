import React from 'react';
import { BarChart3, QrCode, Settings, Shield } from 'lucide-react';
import { useViewMode } from '@/hooks/useViewMode';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { effectiveRole, isViewingAsBrand } = useViewMode();
  
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['master_admin', 'brand_admin', 'customer'] },
    { id: 'brands', label: 'Brands', icon: Settings, roles: ['master_admin'] },
    { id: 'system-templates', label: 'System Templates', icon: Settings, roles: ['master_admin'] },
    { id: 'brand-settings', label: 'Brand Settings', icon: Settings, roles: ['brand_admin'] },
    { id: 'campaigns', label: 'Campaigns', icon: QrCode, roles: ['master_admin', 'brand_admin'] },
    { id: 'templates', label: 'Templates', icon: Settings, roles: ['brand_admin'] }
  ];

  // Filter navigation items based on effective role
  const navItems = allNavItems.filter(item => 
    item.roles.includes(effectiveRole)
  );

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