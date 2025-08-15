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
}

export interface FlowPage {
  id: string;
  name: string;
  type: 'welcome' | 'store_selection' | 'authentication' | 'purchase_details' | 'thank_you';
  sections: FlowSection[];
}

export interface FlowSection {
  id: string;
  type: 'header' | 'hero' | 'text' | 'image' | 'form' | 'card' | 'button' | 'features' | 'divider' | 'cta' | 'product_showcase';
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
        id: 'hero-text',
        type: 'hero',
        config: {
          title: 'Verify the authenticity and quality of this product',
          align: 'center'
        }
      },
      {
        id: 'features',
        type: 'features',
        config: {
          items: [
            'Authentic product verification',
            'Quality assurance guarantee', 
            'Warranty registration included',
            'Trusted certification process'
          ]
        }
      },
      {
        id: 'cta-button',
        type: 'cta',
        config: {
          text: 'Verify Now',
          color: 'accent',
          size: 'large'
        }
      },
      {
        id: 'divider',
        type: 'divider',
        config: {
          style: 'accent',
          decorative: true
        }
      },
      {
        id: 'product-image',
        type: 'product_showcase',
        config: {
          placeholder: true,
          backgroundColor: 'primary',
          caption: 'Your certified product'
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
        id: 'store-selector',
        type: 'form',
        config: {
          title: 'Where did you purchase this product?',
          subtitle: 'Select your store to continue',
          fields: [
            { name: 'store', type: 'select', label: 'Store Location', required: true, options: ['Best Buy', 'Amazon', 'Target', 'Walmart', 'Other'] }
          ],
          submitText: 'Continue'
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
        id: 'auth-form',
        type: 'form',
        config: {
          title: 'Create Account or Sign In',
          subtitle: 'Register your product and access warranty services',
          fields: [
            { name: 'email', type: 'email', label: 'Email Address', required: true },
            { name: 'password', type: 'password', label: 'Password', required: true }
          ],
          submitText: 'Continue',
          alternateText: 'New user? Create account'
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
        id: 'purchase-form',
        type: 'form',
        config: {
          title: 'Complete Your Registration',
          subtitle: 'Provide purchase details for warranty coverage',
          fields: [
            { name: 'purchase_date', type: 'date', label: 'Purchase Date', required: true },
            { name: 'serial_number', type: 'text', label: 'Serial Number (optional)', required: false },
            { name: 'receipt', type: 'file', label: 'Upload Receipt (optional)', required: false }
          ],
          submitText: 'Complete Registration'
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
        id: 'success',
        type: 'text',
        config: {
          title: '✅ Registration Complete!',
          content: 'Your product has been successfully registered. You will receive a confirmation email with your warranty details.',
          buttonText: 'Download Certificate'
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