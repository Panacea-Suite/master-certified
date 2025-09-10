import { SectionRegistry } from './SectionRegistry';
import {
  HeaderSection,
  HeroSection,
  FeaturesSection,
  CtaSection,
  TextSection,
  ImageSection,
  StoreSelector,
  DividerSection,
  LoginStepSection,
  FooterSection,
  ProductShowcaseSection,
  ProductListingSection,
  ColumnSection,
  AuthenticationSection,
  DocumentationSection,
} from './sections';

// Initialize the section registry with all known section types
export function initializeSectionRegistry() {
  console.log('🔍 SectionRegistry: Initializing section registry');
  
  // Register all section components
  SectionRegistry.register('header', HeaderSection);
  SectionRegistry.register('hero', HeroSection);
  SectionRegistry.register('features', FeaturesSection);
  SectionRegistry.register('cta', CtaSection);
  SectionRegistry.register('text', TextSection);
  SectionRegistry.register('image', ImageSection);
  SectionRegistry.register('store_selector', StoreSelector);
  SectionRegistry.register('divider', DividerSection);
  SectionRegistry.register('login_step', LoginStepSection);
  SectionRegistry.register('footer', FooterSection);
  SectionRegistry.register('product_showcase', ProductShowcaseSection);
  SectionRegistry.register('product_listing', ProductListingSection);
  SectionRegistry.register('column', ColumnSection);
  SectionRegistry.register('authentication', AuthenticationSection);
  SectionRegistry.register('documentation', DocumentationSection);
  
  console.log('🔍 SectionRegistry: Registered section types:', SectionRegistry.getRegisteredTypes());
}

// Auto-initialize when this module is imported
initializeSectionRegistry();