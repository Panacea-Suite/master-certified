import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Palette, Save, Image, Store, Plus, X, Edit, Trash2 } from 'lucide-react';
import { ImageEditor } from '@/components/ImageEditor';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  brand_colors?: any;
  approved_stores?: string[];
}

const BrandSettings = () => {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#6B7280');
  const [accentColor, setAccentColor] = useState('#10B981');
  const [approvedStores, setApprovedStores] = useState<string[]>([]);
  const [newStore, setNewStore] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBrandData();
  }, []);

  const fetchBrandData = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBrand(data);
        // Load existing colors if available
        if (data.brand_colors && typeof data.brand_colors === 'object') {
          const colors = data.brand_colors as { primary?: string; secondary?: string; accent?: string };
          setPrimaryColor(colors.primary || '#3B82F6');
          setSecondaryColor(colors.secondary || '#6B7280');
          setAccentColor(colors.accent || '#10B981');
        }
        // Load existing approved stores if available
        setApprovedStores(data.approved_stores || []);
      }
    } catch (error) {
      console.error('Error fetching brand:', error);
      toast({
        title: "Error",
        description: "Failed to fetch brand data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      // Clear the input to allow same file selection
      event.target.value = '';
      return;
    }

    // Auto-trim the image before opening editor
    try {
      setIsUploading(true);
      const { trimImage } = await import('@/utils/trimImage');
      const trimmedFile = await trimImage(file, 15); // Higher tolerance for logos
      setSelectedFile(trimmedFile);
      setShowImageEditor(true);
      toast({
        title: "Image processed",
        description: "White space automatically trimmed",
      });
    } catch (error) {
      console.error('Error trimming image:', error);
      // Fallback to original file if trimming fails
      setSelectedFile(file);
      setShowImageEditor(true);
    } finally {
      setIsUploading(false);
      // Clear the input to allow same file selection next time
      event.target.value = '';
    }
  };

  const handleImageSave = async (editedFile: File) => {
    if (!brand) {
      console.error('No brand found when trying to save image');
      toast({
        title: "Error",
        description: "No brand found. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setShowImageEditor(false);
    
    try {
      console.log('Starting image upload for brand:', brand.id);
      console.log('File details:', {
        name: editedFile.name,
        size: editedFile.size,
        type: editedFile.type
      });

      // Upload to storage
      const fileExt = editedFile.name.split('.').pop() || 'png';
      const fileName = `${brand.id}/logo.${fileExt}`;
      
      console.log('Uploading to path:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brand-logos')
        .upload(fileName, editedFile, { upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL (store clean URL in database)
      const { data: { publicUrl } } = supabase.storage
        .from('brand-logos')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // Update brand with clean logo URL
      const { error: updateError } = await supabase
        .from('brands')
        .update({ logo_url: publicUrl })
        .eq('id', brand.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Brand updated successfully');

      // Update state with clean URL, we'll apply cache-busting when displaying
      setBrand({ ...brand, logo_url: publicUrl });
      setSelectedFile(null);
      // Clear file input to allow same file selection
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      toast({
        title: "Success",
        description: "Logo uploaded and saved successfully",
      });
    } catch (error: any) {
      console.error('Error in handleImageSave:', error);
      
      let errorMessage = "Failed to upload logo";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageCancel = () => {
    setShowImageEditor(false);
    setSelectedFile(null);
    // Clear file input to allow same file selection
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteLogo = async () => {
    if (!brand || !brand.logo_url) return;

    setIsUploading(true);
    try {
      // Extract file path from logo URL
      const url = new URL(brand.logo_url);
      const pathSegments = url.pathname.split('/');
      const fileName = pathSegments[pathSegments.length - 1];
      const brandFolder = pathSegments[pathSegments.length - 2];
      const filePath = `${brandFolder}/${fileName}`;

      console.log('Deleting logo file:', filePath);

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('brand-logos')
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage deletion error:', deleteError);
        // Continue with database update even if storage deletion fails
      }

      // Update brand to remove logo URL
      const { error: updateError } = await supabase
        .from('brands')
        .update({ logo_url: null })
        .eq('id', brand.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Logo deleted successfully');

      // Update state
      setBrand({ ...brand, logo_url: null });
      // Clear file input to allow same file selection
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      toast({
        title: "Success",
        description: "Logo deleted successfully",
      });
    } catch (error: any) {
      console.error('Error in handleDeleteLogo:', error);
      
      let errorMessage = "Failed to delete logo";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Delete Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


  const saveColors = async () => {
    if (!brand) return;

    setIsSaving(true);
    try {
      const colors = {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor
      };

      const { error } = await supabase
        .from('brands')
        .update({ brand_colors: colors })
        .eq('id', brand.id);

      if (error) throw error;

      setBrand({ ...brand, brand_colors: colors });
      toast({
        title: "Success",
        description: "Brand colors saved successfully",
      });
    } catch (error) {
      console.error('Error saving colors:', error);
      toast({
        title: "Error",
        description: "Failed to save brand colors",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addApprovedStore = () => {
    if (newStore.trim() && !approvedStores.includes(newStore.trim())) {
      setApprovedStores([...approvedStores, newStore.trim()]);
      setNewStore('');
    }
  };

  const removeApprovedStore = (store: string) => {
    setApprovedStores(approvedStores.filter(s => s !== store));
  };

  const saveApprovedStores = async () => {
    if (!brand) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('brands')
        .update({ approved_stores: approvedStores })
        .eq('id', brand.id);

      if (error) throw error;

      setBrand({ ...brand, approved_stores: approvedStores });
      toast({
        title: "Success",
        description: "Approved stores saved successfully",
      });
    } catch (error) {
      console.error('Error saving approved stores:', error);
      toast({
        title: "Error",
        description: "Failed to save approved stores",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading brand settings...</div>;
  }

  if (!brand) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No brand found. Please create a brand first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Brand Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Brand Logo
            </CardTitle>
            <CardDescription>
              Upload your brand logo. Recommended size: 300x300px
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {brand.logo_url && (
              <div className="flex justify-center relative">
                <img
                  src={`${brand.logo_url}?t=${Date.now()}`}
                  alt="Brand Logo"
                  className="w-32 h-32 object-contain border rounded-lg"
                  key={brand.logo_url} // Force re-render when URL changes
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteLogo}
                  disabled={isUploading}
                  className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full"
                  title="Delete logo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-center w-full">
              <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Edit className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload & edit</span> logo
                  </p>
                  <p className="text-xs text-muted-foreground">Resize and crop after upload • PNG, JPG (MAX. 5MB)</p>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />
              </label>
            </div>
            
            
            {isUploading && (
              <p className="text-sm text-muted-foreground text-center">Uploading...</p>
            )}
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Brand Colors
            </CardTitle>
            <CardDescription>
              Define your brand's color palette for campaigns and flows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#6B7280"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Color Preview</p>
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: primaryColor }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: secondaryColor }}
                  title="Secondary"
                />
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: accentColor }}
                  title="Accent"
                />
              </div>
            </div>

            <Button onClick={saveColors} disabled={isSaving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Colors'}
            </Button>
          </CardContent>
        </Card>

        {/* Approved Stores */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Approved Stores
            </CardTitle>
            <CardDescription>
              Manage the list of stores approved for your brand campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                placeholder="Add new store name"
                onKeyPress={(e) => e.key === 'Enter' && addApprovedStore()}
                className="flex-1"
              />
              <Button onClick={addApprovedStore} disabled={!newStore.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {approvedStores.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Approved Stores:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {approvedStores.map((store, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 p-2 rounded border"
                    >
                      <span className="text-sm">{store}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeApprovedStore(store)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approvedStores.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No approved stores added yet</p>
                <p className="text-xs">Add stores that can be used in your campaigns</p>
              </div>
            )}

            <Button 
              onClick={saveApprovedStores} 
              disabled={isSaving} 
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Approved Stores'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Image Editor Modal */}
      {showImageEditor && selectedFile && (
        <ImageEditor
          file={selectedFile}
          onSave={handleImageSave}
          onCancel={handleImageCancel}
        />
      )}
    </div>
  );
};

export default BrandSettings;