-- Clean up any duplicate or incorrect classic certification templates
-- Keep only system templates, remove any user-created duplicates of classic certification
DELETE FROM flows 
WHERE (name ILIKE '%classic certification%' OR template_category = 'certification') 
  AND is_system_template = false;

-- Ensure there's only one system template for classic certification
-- First, delete any existing system templates for classic certification
DELETE FROM flows 
WHERE name ILIKE '%classic certification%' 
  AND is_system_template = true;

-- Create a single canonical classic certification system template
INSERT INTO flows (
  name,
  flow_config,
  template_category,
  template_description,
  is_system_template,
  is_template,
  created_by,
  campaign_id
) VALUES (
  'Classic Certification',
  '{"pages": [{"id": "welcome", "title": "Welcome", "sections": [{"id": "welcome-header", "type": "text", "content": {"text": "Welcome to our certification program", "style": "h1"}}]}, {"id": "store-selection", "title": "Store Selection", "sections": [{"id": "store-form", "type": "form", "content": {"fields": [{"id": "store", "type": "select", "label": "Select Store", "options": ["Store A", "Store B", "Store C"]}]}}]}]}',
  'certification',
  'A classic certification flow template with welcome page and store selection',
  true,
  true,
  null,
  null
);

-- Add unique constraint to prevent duplicate system templates by name
CREATE UNIQUE INDEX IF NOT EXISTS idx_flows_system_template_name 
ON flows (name) 
WHERE is_system_template = true;