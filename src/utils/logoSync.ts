/**
 * Utility functions to ensure logo consistency across the application
 * All logo sources should point to the brand's logo_url in the database
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current brand logo URL from the database
 * This is the single source of truth for all logo displays
 */
export async function getBrandLogoUrl(userId: string): Promise<string | null> {
  try {
    const { data: brand } = await supabase
      .from('brands')
      .select('logo_url')
      .eq('user_id', userId)
      .maybeSingle();

    return brand?.logo_url || null;
  } catch (error) {
    console.error('Error fetching brand logo URL:', error);
    return null;
  }
}

/**
 * Update the brand logo in the database
 * This ensures all components using the logo will show the updated version
 */
export async function updateBrandLogo(userId: string, logoFile: File): Promise<string | null> {
  try {
    // Get user's brand
    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!brand) throw new Error('No brand found');

    // Upload the logo
    const fileExt = logoFile.name.split('.').pop() || 'png';
    const fileName = `${brand.id}/logo.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(fileName, logoFile, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(fileName);

    // Update brand with new logo URL
    const { error: updateError } = await supabase
      .from('brands')
      .update({ logo_url: publicUrl })
      .eq('id', brand.id);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error) {
    console.error('Error updating brand logo:', error);
    return null;
  }
}

/**
 * Check if a given URL is the current brand logo URL
 * Helps identify outdated logo references
 */
export async function isCurrentBrandLogo(userId: string, logoUrl: string): Promise<boolean> {
  const currentLogoUrl = await getBrandLogoUrl(userId);
  return currentLogoUrl === logoUrl;
}