-- Update flows table to support multi-page structure
-- Add comment to clarify the new multi-page structure in flow_config
COMMENT ON COLUMN flows.flow_config IS 'JSON configuration containing either legacy sections array or new pages array structure: {pages: [{id, type, name, sections, settings}], theme, settings}';

-- Create enum for page types
CREATE TYPE page_type AS ENUM (
  'landing',
  'store_selection', 
  'account_creation',
  'authentication',
  'content_display',
  'thank_you'
);

-- No structural changes needed to flows table as flow_config is already jsonb
-- The migration is just to document the new structure