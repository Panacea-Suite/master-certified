import React from 'react';
import { Card } from '@/components/ui/card';
import { Location } from 'react-router-dom';

interface DebugBoxProps {
  cid?: string | null;
  qr?: string | null;
  ct?: string | null;
  location?: Location;
  lastRequest?: {
    url: string;
    status: number;
    response?: any;
  };
  lastError?: {
    message: string;
    stack?: string;
  };
  visible?: boolean;
}

export const DebugBox: React.FC<DebugBoxProps> = ({
  cid,
  qr,
  ct,
  location,
  lastRequest,
  lastError,
  visible = false
}) => {
  if (!visible && !lastError) return null;

  return (
    <Card className="fixed bottom-4 left-4 p-3 max-w-sm text-xs z-50 bg-background/95 backdrop-blur border-2 border-yellow-500">
      <div className="font-bold text-yellow-600 mb-2">Debug Info</div>
      
      <div className="space-y-1">
        <div><strong>cid:</strong> {cid || 'null'}</div>
        <div><strong>qr:</strong> {qr || 'null'}</div>
        <div><strong>ct:</strong> {ct || 'null'}</div>
        <div><strong>pathname:</strong> {location?.pathname}</div>
        <div><strong>search:</strong> {location?.search}</div>
        <div><strong>hash:</strong> {location?.hash}</div>
      </div>

      {lastRequest && (
        <div className="mt-2 pt-2 border-t border-yellow-200">
          <div className="font-bold text-yellow-600">Last Request:</div>
          <div><strong>URL:</strong> {lastRequest.url}</div>
          <div><strong>Status:</strong> {lastRequest.status}</div>
          {lastRequest.response && (
            <div>
              <strong>Response:</strong> 
              <pre className="text-xs mt-1 p-1 bg-gray-100 rounded max-h-20 overflow-auto">
                {JSON.stringify(lastRequest.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <div className="font-bold text-red-600">Last Error:</div>
          <div className="text-red-500">{lastError.message}</div>
          {lastError.stack && (
            <pre className="text-xs mt-1 p-1 bg-red-50 rounded max-h-20 overflow-auto text-red-600">
              {lastError.stack}
            </pre>
          )}
        </div>
      )}
    </Card>
  );
};