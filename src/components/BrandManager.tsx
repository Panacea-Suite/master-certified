import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBrandContext } from '@/contexts/BrandContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  brand_colors?: any;
  created_at: string;
}

interface BrandManagerProps {
  onTabChange: (tab: string) => void;
}

const BrandManager: React.FC<BrandManagerProps> = ({ onTabChange }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrandName, setNewBrandName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { setSelectedBrand } = useBrandContext();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast({
        title: "Error",
        description: "Failed to fetch brands",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Error",
        description: "Brand name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('brands')
        .insert([{ name: newBrandName, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setBrands([data, ...brands]);
      setNewBrandName('');
      toast({
        title: "Success",
        description: "Brand created successfully",
      });
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: "destructive",
      });
    }
  };

  const deleteBrand = async (brandId: string) => {
    try {
      // First, check if there are any templates associated with this brand
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('id, name')
        .eq('brand_id', brandId);

      if (templatesError) throw templatesError;

      // If there are templates, delete them first or set brand_id to null
      if (templates && templates.length > 0) {
        console.log(`Found ${templates.length} templates associated with brand ${brandId}, cleaning up...`);
        
        // Set brand_id to null for associated templates instead of deleting them
        const { error: updateError } = await supabase
          .from('templates')
          .update({ brand_id: null })
          .eq('brand_id', brandId);

        if (updateError) throw updateError;
      }

      // Now delete the brand
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      setBrands(brands.filter(brand => brand.id !== brandId));
      toast({
        title: "Success",
        description: templates && templates.length > 0 
          ? `Brand deleted successfully. ${templates.length} associated templates were unlinked.`
          : "Brand deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand. It may have associated data that needs to be removed first.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading brands...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Brand Management</h1>
      </div>

      {/* Create Brand Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Brand</CardTitle>
          <CardDescription>
            Add a new brand to manage campaigns and QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={createBrand}>
                <Plus className="w-4 h-4 mr-2" />
                Create Brand
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands List */}
      <div className="grid gap-4">
        {brands.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No brands created yet. Create your first brand to get started.</p>
            </CardContent>
          </Card>
        ) : (
          brands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{brand.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(brand.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteBrand(brand.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="default">
                    View Campaigns
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedBrand(brand.id);
                      onTabChange('brand-settings');
                    }}
                  >
                    Brand Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BrandManager;