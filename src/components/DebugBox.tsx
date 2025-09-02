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
  flowDetails?: {
    campaignId?: string;
    flowId?: string;
    flowName?: string;
    flowCampaignId?: string;
    campaignName?: string;
    brandName?: string;
    hasPublishedSnapshot?: boolean;
    hasFlowConfig?: boolean;
    flowConfigType?: string;
    publishedSnapshotType?: string;
    payloadKeys?: string[];
    contentSource?: string;
    isLive?: boolean;
    debugMode?: boolean;
    totalSections?: number;
    pagesBreakdown?: Array<{
      index: number;
      name: string;
      type: string;
      sectionsCount: number;
    }>;
    latestVersion?: number;
    hasDesignTokens?: boolean;
    loadedAt?: string;
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
  flowFound,
  pagesLength,
  flowMode,
  flowDetails,
  visible = false
}) => {
  if (!visible && !lastError) return null;

  // Construct current URL for display
  const currentUrl = location ? 
    `${window.location.origin}${location.pathname}${location.search}${location.hash}` :
    window.location.href;

  return (
    <Card className="fixed bottom-4 left-4 p-3 max-w-md text-xs z-50 bg-background/95 backdrop-blur border-2 border-yellow-500">
      <div className="font-bold text-yellow-600 mb-2">🔍 Flow Debug Panel</div>
      
      <div className="space-y-2">
        <div><strong>Current URL:</strong> 
          <div className="text-xs font-mono bg-gray-100 p-1 rounded mt-1 break-all">
            {currentUrl}
          </div>
        </div>
        
        <div className="pt-2 border-t border-yellow-200">
          <div><strong>URL Parameters:</strong></div>
          <div className="ml-2">
            <div><strong>cid:</strong> <span className={cid ? 'text-green-600' : 'text-red-500'}>{cid || 'MISSING'}</span></div>
            <div><strong>qr:</strong> <span className={qr ? 'text-green-600' : 'text-gray-500'}>{qr || 'none'}</span></div>
            <div><strong>ct:</strong> <span className={ct ? 'text-green-600' : 'text-gray-500'}>{ct || 'none'}</span></div>
          </div>
        </div>

        {/* Campaign Information */}
        {flowDetails && (
          <div className="pt-2 border-t border-blue-200">
            <div><strong>Campaign Information:</strong></div>
            <div className="ml-2">
              <div><strong>Campaign ID:</strong> <span className="text-blue-600 font-mono text-xs">{flowDetails.campaignId || 'N/A'}</span></div>
              {flowDetails.campaignName && (
                <div><strong>Campaign Name:</strong> <span className="text-blue-600">{flowDetails.campaignName}</span></div>
              )}
              {flowDetails.brandName && (
                <div><strong>Brand:</strong> <span className="text-blue-600">{flowDetails.brandName}</span></div>
              )}
              {flowDetails.flowId && (
                <div><strong>Flow ID:</strong> <span className="text-blue-600 font-mono text-xs">{flowDetails.flowId}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Content Source & Status */}
        <div className="pt-2 border-t border-green-200">
          <div><strong>Content Source & Status:</strong></div>
          <div className="ml-2">
            <div><strong>Flow Found:</strong> <span className={flowFound ? 'text-green-600' : 'text-red-500'}>{flowFound ? 'YES' : 'NO'}</span></div>
            <div><strong>Mode:</strong> <span className={flowMode?.includes('published') ? 'text-green-600' : 'text-orange-600'}>{flowMode || 'unknown'}</span></div>
            {flowDetails?.contentSource && (
              <div><strong>Data Source:</strong> <span className={flowDetails.contentSource === 'published_snapshot' ? 'text-green-600' : 'text-orange-600'}>{flowDetails.contentSource}</span></div>
            )}
            {flowDetails?.isLive !== undefined && (
              <div><strong>Live Content:</strong> <span className={flowDetails.isLive ? 'text-green-600' : 'text-orange-600'}>{flowDetails.isLive ? 'YES (Customers see this)' : 'NO (Draft/Debug only)'}</span></div>
            )}
            {flowDetails?.debugMode && (
              <div><strong>Debug Mode:</strong> <span className="text-orange-600">ACTIVE (useDraft=1)</span></div>
            )}
          </div>
        </div>

        {/* Content Statistics */}
        <div className="pt-2 border-t border-purple-200">
          <div><strong>Content Statistics:</strong></div>
          <div className="ml-2">
            <div><strong>Total Pages:</strong> <span className={(pagesLength && pagesLength > 0) ? 'text-green-600' : 'text-red-500'}>{pagesLength ?? 'unknown'}</span></div>
            {flowDetails?.totalSections !== undefined && (
              <div><strong>Total Sections:</strong> <span className="text-purple-600">{flowDetails.totalSections}</span></div>
            )}
            {flowDetails?.latestVersion && (
              <div><strong>Published Version:</strong> <span className="text-purple-600">v{flowDetails.latestVersion}</span></div>
            )}
          </div>
        </div>

        {/* Pages Breakdown */}
        {flowDetails?.pagesBreakdown && flowDetails.pagesBreakdown.length > 0 && (
          <div className="pt-2 border-t border-indigo-200">
            <div><strong>Pages Breakdown:</strong></div>
            <div className="ml-2 max-h-32 overflow-y-auto">
              {flowDetails.pagesBreakdown.map((page) => (
                <div key={page.index} className="text-xs">
                  <strong>{page.index}.</strong> {page.name} <span className="text-gray-500">({page.type})</span> - <span className="text-indigo-600">{page.sectionsCount} sections</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Details */}
        {flowDetails && (
          <div className="pt-2 border-t border-gray-200">
            <div><strong>Technical Details:</strong></div>
            <div className="ml-2">
              <div><strong>Has Published Snapshot:</strong> <span className={flowDetails.hasPublishedSnapshot ? 'text-green-600' : 'text-yellow-600'}>{flowDetails.hasPublishedSnapshot ? 'YES' : 'NO'}</span></div>
              <div><strong>Has Flow Config:</strong> <span className={flowDetails.hasFlowConfig ? 'text-green-600' : 'text-red-500'}>{flowDetails.hasFlowConfig ? 'YES' : 'NO'}</span></div>
              {flowDetails.payloadKeys && flowDetails.payloadKeys.length > 0 && (
                <div><strong>Payload Keys:</strong> <span className="text-gray-600 text-xs">{flowDetails.payloadKeys.join(', ')}</span></div>
              )}
              {flowDetails.loadedAt && (
                <div><strong>Loaded At:</strong> <span className="text-gray-600 text-xs">{new Date(flowDetails.loadedAt).toLocaleTimeString()}</span></div>
              )}
            </div>
          </div>
        )}
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