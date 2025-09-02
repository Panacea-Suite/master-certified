/**
 * Centralized style token resolution with safe fallbacks
 * Merges tokens in priority order: base defaults → template defaults → flowSnapshot.designConfig → campaign.locked_design_tokens
 */

export interface StyleTokens {
  // Colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Design Config
  backgroundStyle: 'solid' | 'gradient' | 'pattern';
  colorScheme: 'primary' | 'secondary' | 'monochrome' | 'vibrant';
  borderStyle: 'rounded' | 'sharp' | 'soft';
  dividerStyle: 'line' | 'gradient' | 'decorative' | 'none';
  cardStyle: 'elevated' | 'flat' | 'bordered' | 'glass';
  spacing: 'compact' | 'comfortable' | 'spacious';
  
  // Layout & Sizing
  borderRadius: string;
  logoSize: 'small' | 'medium' | 'large' | '60';
  shadowLevel: 'none' | 'subtle' | 'elevated' | 'strong';
}

/**
 * Base default tokens using design system HSL values
 */
const BASE_DEFAULTS: StyleTokens = {
  // Colors from design system
  primary: 'hsl(221.2 83.2% 53.3%)', // --primary
  secondary: 'hsl(210 40% 98%)', // --secondary  
  accent: 'hsl(210 40% 98%)', // --accent
  background: 'hsl(0 0% 100%)', // --background
  foreground: 'hsl(222.2 84% 4.9%)', // --foreground
  textPrimary: 'hsl(222.2 84% 4.9%)', // --foreground
  textSecondary: 'hsl(215.4 16.3% 46.9%)', // --muted-foreground
  textMuted: 'hsl(215.4 16.3% 46.9%)', // --muted-foreground
  
  // Design defaults
  backgroundStyle: 'solid',
  colorScheme: 'primary',
  borderStyle: 'rounded',
  dividerStyle: 'line',
  cardStyle: 'elevated',
  spacing: 'comfortable',
  
  // Layout defaults
  borderRadius: '0.5rem', // --radius
  logoSize: 'medium',
  shadowLevel: 'elevated'
};

/**
 * Template-specific defaults (can be extended later)
 */
const TEMPLATE_DEFAULTS: Record<string, Partial<StyleTokens>> = {
  classic: {
    colorScheme: 'primary',
    cardStyle: 'elevated',
    borderStyle: 'rounded'
  },
  modern: {
    colorScheme: 'vibrant',
    cardStyle: 'glass',
    borderStyle: 'soft'
  },
  minimal: {
    colorScheme: 'monochrome',
    cardStyle: 'flat',
    borderStyle: 'sharp',
    spacing: 'spacious'
  }
};

/**
 * Converts hex colors to HSL format for consistency
 */
function normalizeColor(color: string): string {
  if (!color) return '';
  
  // If already HSL, return as-is
  if (color.startsWith('hsl(')) return color;
  
  // If hex, convert to HSL (simplified - for production, use a proper color library)
  if (color.startsWith('#')) {
    // For now, return the hex as-is - in production, convert to HSL
    return color;
  }
  
  return color;
}

/**
 * Safely merges style token objects with proper fallbacks
 */
function mergeTokens(base: StyleTokens, override: any): StyleTokens {
  if (!override || typeof override !== 'object') return base;
  
  return {
    ...base,
    // Colors
    primary: normalizeColor(override.primary) || base.primary,
    secondary: normalizeColor(override.secondary) || base.secondary,
    accent: normalizeColor(override.accent) || base.accent,
    background: normalizeColor(override.background) || base.background,
    foreground: normalizeColor(override.foreground) || base.foreground,
    textPrimary: normalizeColor(override.textPrimary) || base.textPrimary,
    textSecondary: normalizeColor(override.textSecondary) || base.textSecondary,
    textMuted: normalizeColor(override.textMuted) || base.textMuted,
    
    // Design config
    backgroundStyle: override.backgroundStyle || base.backgroundStyle,
    colorScheme: override.colorScheme || base.colorScheme,
    borderStyle: override.borderStyle || base.borderStyle,
    dividerStyle: override.dividerStyle || base.dividerStyle,
    cardStyle: override.cardStyle || base.cardStyle,
    spacing: override.spacing || base.spacing,
    
    // Layout
    borderRadius: override.borderRadius || base.borderRadius,
    logoSize: override.logoSize || base.logoSize,
    shadowLevel: override.shadowLevel || base.shadowLevel
  };
}

/**
 * Resolves style tokens from multiple sources with proper priority order
 * Priority: base defaults → template defaults → flowSnapshot.designConfig → campaign.locked_design_tokens
 */
export function resolveStyleTokens(
  campaign?: any,
  flowSnapshot?: any,
  templateId?: string
): StyleTokens {
  console.log('Resolving style tokens:', { 
    campaignId: campaign?.id,
    hasLockedTokens: !!campaign?.locked_design_tokens,
    templateId,
    hasFlowDesignConfig: !!(flowSnapshot?.designConfig || flowSnapshot?.flow_config?.designConfig || flowSnapshot?.published_snapshot?.designConfig)
  });

  // Start with base defaults
  let tokens = { ...BASE_DEFAULTS };
  
  // Layer in template defaults
  if (templateId && TEMPLATE_DEFAULTS[templateId]) {
    tokens = mergeTokens(tokens, TEMPLATE_DEFAULTS[templateId]);
  }
  
  // Layer in flow design config (multiple possible locations)
  const flowDesignConfig = 
    flowSnapshot?.designConfig || 
    flowSnapshot?.flow_config?.designConfig || 
    flowSnapshot?.published_snapshot?.designConfig;
    
  if (flowDesignConfig) {
    tokens = mergeTokens(tokens, flowDesignConfig);
  }
  
  // Layer in campaign locked tokens (highest priority)
  if (campaign?.locked_design_tokens) {
    tokens = mergeTokens(tokens, campaign.locked_design_tokens);
  }
  
  console.log('Final resolved tokens:', tokens);
  return tokens;
}

/**
 * Converts style tokens to format expected by TemplateStyleProvider
 */
export function tokensToProviderFormat(tokens: StyleTokens) {
  return {
    primary: tokens.primary,
    secondary: tokens.secondary,
    accent: tokens.accent
  };
}