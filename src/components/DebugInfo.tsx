import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface DebugInfoProps {
  debug?: {
    used_locked_template?: boolean;
    template_version?: number;
    locked_design_tokens?: boolean;
  };
  campaign?: {
    id: string;
    name?: string;
  };
  flow?: {
    id: string;
    name?: string;
  };
  className?: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ 
  debug, 
  campaign, 
  flow, 
  className = '' 
}) => {
  const { profile } = useAuth();
  
  // Only show to master_admin users
  if (profile?.role !== 'master_admin' || !debug) {
    return null;
  }

  return (
    <Card className={`bg-gray-50 border-dashed border-gray-300 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono text-gray-600">
          DEBUG INFO (Admin Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Campaign ID:</span>
            <br />
            <code className="text-xs bg-gray-200 px-1 rounded">
              {campaign?.id || 'N/A'}
            </code>
          </div>
          <div>
            <span className="font-medium">Flow ID:</span>
            <br />
            <code className="text-xs bg-gray-200 px-1 rounded">
              {flow?.id || 'N/A'}
            </code>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <Badge 
            variant={debug.used_locked_template ? "default" : "secondary"}
            className="text-xs"
          >
            {debug.used_locked_template ? '✓' : '✗'} Locked Template
          </Badge>
          
          <Badge 
            variant={debug.template_version ? "default" : "secondary"}
            className="text-xs"
          >
            v{debug.template_version || '?'}
          </Badge>
          
          <Badge 
            variant={debug.locked_design_tokens ? "default" : "secondary"}
            className="text-xs"
          >
            {debug.locked_design_tokens ? '✓' : '✗'} Design Tokens
          </Badge>
        </div>

        {campaign?.name && (
          <div className="text-xs text-gray-600 mt-2">
            <span className="font-medium">Campaign:</span> {campaign.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
};