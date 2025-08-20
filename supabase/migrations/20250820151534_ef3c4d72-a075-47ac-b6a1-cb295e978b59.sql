-- Insert Classic Certification template as a system template
INSERT INTO public.templates (
  kind,
  status,
  name,
  description,
  created_by,
  brand_id,
  base_template_id,
  version,
  schema,
  content
) VALUES (
  'system',
  'published',
  'Classic Certification',
  'A comprehensive certification flow template for product verification and customer engagement',
  (SELECT user_id FROM public.profiles WHERE role = 'master_admin' LIMIT 1),
  NULL,
  NULL,
  1,
  '{
    "version": "1.0",
    "type": "certification_flow",
    "pages": ["welcome", "store_selection", "authentication", "purchase_details", "thank_you"],
    "design_system": "classic",
    "required_fields": ["store", "purchase_info"],
    "optional_fields": ["customer_feedback"]
  }'::jsonb,
  '{
    "pages": [
      {
        "type": "welcome",
        "sections": [
          {
            "type": "text",
            "config": {
              "text": "Welcome to Product Certification",
              "variant": "heading"
            }
          },
          {
            "type": "text",
            "config": {
              "text": "Verify your authentic product purchase and unlock exclusive benefits.",
              "variant": "body"
            }
          },
          {
            "type": "button",
            "config": {
              "text": "Get Started",
              "variant": "primary",
              "action": "next_page"
            }
          }
        ]
      },
      {
        "type": "store_selection",
        "sections": [
          {
            "type": "text",
            "config": {
              "text": "Where did you purchase this product?",
              "variant": "heading"
            }
          },
          {
            "type": "store_selector",
            "config": {
              "options": ["Store A", "Store B", "Store C", "Other"],
              "required": true
            }
          },
          {
            "type": "button",
            "config": {
              "text": "Continue",
              "variant": "primary",
              "action": "next_page"
            }
          }
        ]
      },
      {
        "type": "authentication",
        "sections": [
          {
            "type": "text",
            "config": {
              "text": "Verify Your Purchase",
              "variant": "heading"
            }
          },
          {
            "type": "form",
            "config": {
              "fields": [
                {
                  "type": "email",
                  "label": "Email Address",
                  "required": true
                },
                {
                  "type": "text",
                  "label": "Order Number",
                  "required": false
                }
              ]
            }
          },
          {
            "type": "button",
            "config": {
              "text": "Verify",
              "variant": "primary",
              "action": "next_page"
            }
          }
        ]
      },
      {
        "type": "purchase_details",
        "sections": [
          {
            "type": "text",
            "config": {
              "text": "Purchase Details",
              "variant": "heading"
            }
          },
          {
            "type": "form",
            "config": {
              "fields": [
                {
                  "type": "date",
                  "label": "Purchase Date",
                  "required": true
                },
                {
                  "type": "text",
                  "label": "Product Model",
                  "required": true
                }
              ]
            }
          },
          {
            "type": "button",
            "config": {
              "text": "Submit",
              "variant": "primary",
              "action": "next_page"
            }
          }
        ]
      },
      {
        "type": "thank_you",
        "sections": [
          {
            "type": "text",
            "config": {
              "text": "Certification Complete!",
              "variant": "heading"
            }
          },
          {
            "type": "text",
            "config": {
              "text": "Your product has been successfully verified. Thank you for choosing authentic products.",
              "variant": "body"
            }
          },
          {
            "type": "divider",
            "config": {}
          },
          {
            "type": "text",
            "config": {
              "text": "What would you like to do next?",
              "variant": "subheading"
            }
          },
          {
            "type": "button",
            "config": {
              "text": "View Certificate",
              "variant": "primary",
              "action": "download_certificate"
            }
          }
        ]
      }
    ],
    "designConfig": {
      "primaryColor": "#007bff",
      "secondaryColor": "#6c757d",
      "backgroundColor": "#ffffff",
      "textColor": "#333333",
      "fontFamily": "Inter, sans-serif",
      "borderRadius": "8px",
      "spacing": "16px"
    }
  }'::jsonb
);