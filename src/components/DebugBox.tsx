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
  flowFound?: boolean;
  pagesLength?: number;
  flowMode?: string;
  visible?: boolean;
}

export const DebugBox: React.FC<DebugBoxProps> = ({
  cid,
  qr,
  ct,
  location,
  lastRequest,
  lastError,
  flowFound,
  pagesLength,
  flowMode,
  visible = false
}) => {
  if (!visible && !lastError) return null;

  // Construct current URL for display
  const currentUrl = location ? 
    `${window.location.origin}${location.pathname}${location.search}${location.hash}` :
    window.location.href;

  return (
    <Card className="fixed bottom-4 left-4 p-3 max-w-sm text-xs z-50 bg-background/95 backdrop-blur border-2 border-yellow-500">
      <div className="font-bold text-yellow-600 mb-2">🔍 Flow Debug Panel</div>
      
      <div className="space-y-1">
        <div><strong>Current URL:</strong> 
          <div className="text-xs font-mono bg-gray-100 p-1 rounded mt-1 break-all">
            {currentUrl}
          </div>
        </div>
        
        <div className="pt-2 border-t border-yellow-200">
          <div><strong>Resolved Params:</strong></div>
          <div className="ml-2">
            <div><strong>cid:</strong> <span className={cid ? 'text-green-600' : 'text-red-500'}>{cid || 'MISSING'}</span></div>
            <div><strong>qr:</strong> <span className={qr ? 'text-green-600' : 'text-gray-500'}>{qr || 'none'}</span></div>
            <div><strong>ct:</strong> <span className={ct ? 'text-green-600' : 'text-gray-500'}>{ct || 'none'}</span></div>
          </div>
        </div>

        <div className="pt-2 border-t border-yellow-200">
          <div><strong>Flow Status:</strong></div>
          <div className="ml-2">
            <div><strong>Flow Found:</strong> <span className={flowFound ? 'text-green-600' : 'text-red-500'}>{flowFound ? 'YES' : 'NO'}</span></div>
            <div><strong>Pages Length:</strong> <span className={(pagesLength && pagesLength > 0) ? 'text-green-600' : 'text-red-500'}>{pagesLength ?? 'unknown'}</span></div>
            <div><strong>Flow Mode:</strong> <span className="text-blue-600">{flowMode || 'unknown'}</span></div>
          </div>
        </div>
      </div>

      {lastRequest && (
        <div className="mt-2 pt-2 border-t border-yellow-200">
          <div className="font-bold text-yellow-600">Last Request:</div>
          <div><strong>URL:</strong> {lastRequest.url}</div>
          <div><strong>Status:</strong> <span className={lastRequest.status === 200 ? 'text-green-600' : 'text-red-500'}>{lastRequest.status}</span></div>
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
          <div className="font-bold text-red-600">⚠️ Last Error:</div>
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