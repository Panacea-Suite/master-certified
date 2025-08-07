import React from 'react';
import { BarChart3, QrCode, Settings, Shield, Users, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend }) => {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-foreground/60';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className={`text-xs ${trendColor} flex items-center gap-1`}>
              <TrendingUp className="w-3 h-3" />
              {change}
            </p>
          </div>
          <div className="bg-primary/10 p-4 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard = () => {
  const stats = [
    {
      title: 'Total QR Codes',
      value: '1,247',
      change: '+12% from last month',
      icon: <QrCode className="w-6 h-6 text-primary" />,
      trend: 'up' as const
    },
    {
      title: 'Total Scans',
      value: '28,659',
      change: '+18% from last month',
      icon: <BarChart3 className="w-6 h-6 text-success" />,
      trend: 'up' as const
    },
    {
      title: 'Verified Products',
      value: '896',
      change: '+8% from last month',
      icon: <Shield className="w-6 h-6 text-primary" />,
      trend: 'up' as const
    },
    {
      title: 'Active Users',
      value: '2,431',
      change: '+24% from last month',
      icon: <Users className="w-6 h-6 text-success" />,
      trend: 'up' as const
    }
  ];

  const recentActivity = [
    { action: 'QR Code Generated', details: 'Premium Collection QR', time: '2 minutes ago', type: 'create' },
    { action: 'Product Verified', details: 'Luxury Watch #LW-2024-001', time: '5 minutes ago', type: 'verify' },
    { action: 'Redirect Updated', details: 'QR-001 → New landing page', time: '12 minutes ago', type: 'update' },
    { action: 'New User Registration', details: 'manufacturer@brand.com', time: '18 minutes ago', type: 'user' },
    { action: 'QR Code Scanned', details: 'Electronics QR #EL-445', time: '23 minutes ago', type: 'scan' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <QrCode className="w-4 h-4 text-primary" />;
      case 'verify': return <Shield className="w-4 h-4 text-success" />;
      case 'update': return <Settings className="w-4 h-4 text-warning" />;
      case 'user': return <Users className="w-4 h-4 text-primary" />;
      case 'scan': return <BarChart3 className="w-4 h-4 text-foreground/60" />;
      default: return <BarChart3 className="w-4 h-4 text-foreground/60" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground/60">Monitor your Certified Platform performance and manage QR codes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-2 rounded-lg">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="default" className="w-full justify-start h-auto p-4">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Generate QR Code</p>
                  <p className="text-sm text-muted-foreground">Create a new authenticated QR code</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-success" />
                <div className="text-left">
                  <p className="font-medium">Verify Product</p>
                  <p className="text-sm text-muted-foreground">Check product authenticity</p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-warning" />
                <div className="text-left">
                  <p className="font-medium">Manage Redirects</p>
                  <p className="text-sm text-muted-foreground">Update QR code destinations</p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};