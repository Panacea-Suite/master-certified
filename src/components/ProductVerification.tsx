import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Search, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VerificationResult {
  isValid: boolean;
  productName: string;
  productId: string;
  manufacturer: string;
  verificationDate: Date;
  authenticity: 'verified' | 'suspicious' | 'invalid';
  details: string;
}

export const ProductVerification = () => {
  const [qrCode, setQrCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifyProduct = async () => {
    if (!qrCode.trim()) return;

    setIsVerifying(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock verification result
    const mockResult: VerificationResult = {
      isValid: Math.random() > 0.3, // 70% chance of valid
      productName: 'Premium Luxury Watch',
      productId: 'LW-2024-001',
      manufacturer: 'Certified Timepieces Co.',
      verificationDate: new Date(),
      authenticity: Math.random() > 0.3 ? 'verified' : Math.random() > 0.5 ? 'suspicious' : 'invalid',
      details: 'Product authenticity verified through blockchain verification and manufacturer validation.'
    };

    setResult(mockResult);
    setIsVerifying(false);
  };

  const getStatusIcon = (authenticity: string) => {
    switch (authenticity) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'suspicious':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      case 'invalid':
        return <XCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Shield className="w-6 h-6 text-foreground/40" />;
    }
  };

  const getStatusColor = (authenticity: string) => {
    switch (authenticity) {
      case 'verified': return 'text-success';
      case 'suspicious': return 'text-warning';
      case 'invalid': return 'text-destructive';
      default: return 'text-foreground/60';
    }
  };

  const getStatusText = (authenticity: string) => {
    switch (authenticity) {
      case 'verified': return 'Verified Authentic';
      case 'suspicious': return 'Requires Review';
      case 'invalid': return 'Invalid Product';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Product Verification</h1>
        <p className="text-foreground/60">Verify product authenticity using QR codes</p>
      </div>

      {/* Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Search className="w-5 h-5 text-primary" />
            </div>
            Verify Product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">QR Code or Product ID</label>
            <Input
              placeholder="Enter QR code URL or scan QR code..."
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
          </div>

          <Button 
            onClick={verifyProduct} 
            disabled={!qrCode.trim() || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </div>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Verify Product
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Status Header */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    {getStatusIcon(result.authenticity)}
                  </div>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${getStatusColor(result.authenticity)}`}>
                    {getStatusText(result.authenticity)}
                  </h3>
                  <p className="text-muted-foreground mt-1">Verification completed</p>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm text-muted-foreground">Product Name</label>
                    <p className="font-medium text-foreground">{result.productName}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm text-muted-foreground">Product ID</label>
                    <p className="font-medium text-foreground">{result.productId}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm text-muted-foreground">Manufacturer</label>
                    <p className="font-medium text-foreground">{result.manufacturer}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm text-muted-foreground">Verification Date</label>
                    <p className="font-medium text-foreground">
                      {result.verificationDate.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm text-muted-foreground">Verification Details</label>
                  <p className="text-foreground mt-1">{result.details}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button className="flex-1">
                  View Certificate
                </Button>
                <Button variant="outline" className="flex-1">
                  Report Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Verifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { product: 'Luxury Handbag #LH-2024-003', status: 'verified', time: '2 hours ago' },
            { product: 'Premium Sneakers #PS-2024-127', status: 'verified', time: '5 hours ago' },
            { product: 'Designer Watch #DW-2024-089', status: 'suspicious', time: '1 day ago' },
            { product: 'Luxury Perfume #LP-2024-234', status: 'verified', time: '2 days ago' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="bg-primary/10 p-2 rounded-lg">
                {getStatusIcon(item.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.product}</p>
                <p className={`text-xs ${getStatusColor(item.status)}`}>{getStatusText(item.status)}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};