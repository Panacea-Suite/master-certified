// Pre-built flow templates with certification flow structure and design variations
export interface FlowTemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  designType: string;
  icon: string;
  pages: FlowPage[];
  designConfig: DesignConfig;
  globalHeader?: {
    showHeader: boolean;
    brandName: string;
    logoUrl: string;
    backgroundColor: string;
    logoSize: 'small' | 'medium' | 'large';
  };
}

export interface FlowPage {
  id: string;
  name: string;
  type: 'welcome' | 'store_selection' | 'authentication' | 'purchase_details' | 'thank_you';
  sections: FlowSection[];
}

export interface FlowSection {
  id: string;
  type: 'header' | 'hero' | 'text' | 'image' | 'form' | 'card' | 'button' | 'features' | 'divider' | 'cta' | 'product_showcase' | 'store_selector';
  config: any;
}

export interface DesignConfig {
  backgroundStyle: 'solid' | 'gradient' | 'pattern';
  colorScheme: 'primary' | 'secondary' | 'monochrome' | 'vibrant';
  borderStyle: 'rounded' | 'sharp' | 'soft';
  dividerStyle: 'line' | 'gradient' | 'decorative' | 'none';
  cardStyle: 'elevated' | 'flat' | 'bordered' | 'glass';
  spacing: 'compact' | 'comfortable' | 'spacious';
}

// Standard certification flow structure that all templates follow
const CERTIFICATION_FLOW_PAGES: FlowPage[] = [
  {
    id: 'landing-page',
    name: 'Welcome',
    type: 'welcome',
    sections: [
      {
        id: 'hero-title',
        type: 'text',
        config: {
          content: 'Verify the authenticity and quality of this product.',
          fontSize: 20,
          textColor: '#1a1a1a',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center',
          fontWeight: 'bold'
        }
      },
      {
        id: 'features-list',
        type: 'text',
        config: {
          content: "• Ensure this product is genuine and not counterfeit.\n• Trace the origin of each ingredient.\n• Access verified results from independent lab testing.\n• Review documentation audited by trusted third parties.",
          fontSize: 12,
          textColor: '#333333',
          backgroundColor: 'transparent',
          padding: 2
        }
      },
      {
        id: 'cta-button',
        type: 'cta',
        config: {
          text: 'Verify Now',
          color: 'primary',
          size: 'default',
          padding: 6
        }
      },
      {
        id: 'divider',
        type: 'divider',
        config: {
          width: 100,
          thickness: 1,
          color: '#e5e7eb',
          backgroundColor: '#f3f4f6',
          padding: 0
        }
      },
      {
        id: 'product-image',
        type: 'image',
        config: {
          imageUrl: '',
          alt: 'Product verification image',
          height: '300',
          padding: 4
        }
      }
    ]
  },
  {
    id: 'store-selection',
    name: 'Store Selection', 
    type: 'store_selection',
    sections: [
      {
        id: 'store-title',
        type: 'text',
        config: {
          content: 'Where did you purchase this product?',
          fontSize: 24,
          textColor: '#1a1a1a',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center',
          fontWeight: 'bold'
        }
      },
      {
        id: 'store-subtitle',
        type: 'text',
        config: {
          content: 'Select your store location to continue with verification',
          fontSize: 16,
          textColor: '#666666',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center'
        }
      },
      {
        id: 'store-selector',
        type: 'store_selector',
        config: {
          label: 'Store Location',
          placeholder: 'Choose where you purchased...',
          storeOptions: 'Best Buy\nAmazon\nTarget\nWalmart\nOther Retailer',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          borderColor: '#e5e7eb',
          focusBorderColor: '#3b82f6',
          padding: 4
        }
      }
    ]
  },
  {
    id: 'authentication',
    name: 'User Login',
    type: 'authentication', 
    sections: [
      {
        id: 'auth-title',
        type: 'text',
        config: {
          content: 'Create Account or Sign In',
          fontSize: 24,
          textColor: '#1a1a1a',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center',
          fontWeight: 'bold'
        }
      },
      {
        id: 'auth-subtitle',
        type: 'text',
        config: {
          content: 'Register your product and access warranty services',
          fontSize: 16,
          textColor: '#666666',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center'
        }
      }
    ]
  },
  {
    id: 'purchase-details',
    name: 'Purchase Details',
    type: 'purchase_details',
    sections: [
      {
        id: 'details-title',
        type: 'text',
        config: {
          content: 'Complete Your Registration',
          fontSize: 24,
          textColor: '#1a1a1a',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center',
          fontWeight: 'bold'
        }
      },
      {
        id: 'details-subtitle',
        type: 'text',
        config: {
          content: 'Provide purchase details for warranty coverage',
          fontSize: 16,
          textColor: '#666666',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center'
        }
      }
    ]
  },
  {
    id: 'thank-you',
    name: 'Registration Complete',
    type: 'thank_you',
    sections: [
      {
        id: 'success-title',
        type: 'text',
        config: {
          content: '✅ Registration Complete!',
          fontSize: 28,
          textColor: '#16a34a',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center',
          fontWeight: 'bold'
        }
      },
      {
        id: 'success-message',
        type: 'text',
        config: {
          content: 'Your product has been successfully registered. You will receive a confirmation email with your warranty details.',
          fontSize: 16,
          textColor: '#333333',
          backgroundColor: 'transparent',
          padding: 4,
          align: 'center'
        }
      },
      {
        id: 'download-button',
        type: 'text',
        config: {
          content: 'Download Certificate',
          fontSize: 16,
          textColor: '#ffffff',
          backgroundColor: 'var(--primary)',
          padding: 4,
          align: 'center',
          fontWeight: 'semibold',
          borderRadius: '8px'
        }
      }
    ]
  }
];

export const FLOW_TEMPLATES: FlowTemplateData[] = [
  // CLASSIC DESIGN
  {
    id: 'classic-certification',
    name: 'Classic Certification',
    description: 'Clean, professional design with subtle borders and traditional styling',
    category: 'certification',
    designType: 'classic',
    icon: 'shield',
    pages: CERTIFICATION_FLOW_PAGES,
    designConfig: {
      backgroundStyle: 'solid',
      colorScheme: 'primary',
      borderStyle: 'rounded',
      dividerStyle: 'line',
      cardStyle: 'bordered',
      spacing: 'comfortable'
    },
    globalHeader: {
      showHeader: true,
      brandName: '',
      logoUrl: '',
      backgroundColor: '#000000',
      logoSize: 'medium'
    }
  }
];

export const CATEGORIES = {
  certification: {
    label: 'Certification',
    description: 'Product authentication and warranty registration flows',
    icon: 'shield-check'
  }
};