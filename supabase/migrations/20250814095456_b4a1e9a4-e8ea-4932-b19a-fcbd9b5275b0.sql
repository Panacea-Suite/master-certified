-- Add template support to flows table
ALTER TABLE flows 
ADD COLUMN is_template BOOLEAN DEFAULT FALSE,
ADD COLUMN template_category TEXT,
ADD COLUMN created_by UUID;

-- Make campaign_id nullable for template flows
ALTER TABLE flows ALTER COLUMN campaign_id DROP NOT NULL;

-- Create index for template queries  
CREATE INDEX idx_flows_templates ON flows(is_template, template_category) WHERE is_template = true;

-- Insert pre-built template flows
INSERT INTO flows (name, is_template, template_category, flow_config, created_by, campaign_id) VALUES 
(
  'Product Launch Flow',
  true,
  'product_launch',
  '{
    "components": [
      {
        "id": "welcome-1",
        "type": "welcome",
        "order": 0,
        "config": {
          "title": "Welcome!",
          "subtitle": "Thanks for scanning our QR code",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "showLogo": true,
          "buttonText": "Get Started"
        }
      },
      {
        "id": "form-1",
        "type": "registration_form", 
        "order": 1,
        "config": {
          "title": "Tell us about yourself",
          "fields": [
            {"name": "email", "type": "email", "required": true, "label": "Email Address"},
            {"name": "name", "type": "text", "required": true, "label": "Full Name"},
            {"name": "phone", "type": "tel", "required": false, "label": "Phone Number"}
          ],
          "buttonText": "Continue",
          "backgroundColor": "#ffffff"
        }
      },
      {
        "id": "content-1",
        "type": "content_display",
        "order": 2, 
        "config": {
          "title": "Discover Our Latest Product",
          "content": "Learn about our amazing new product features and benefits.",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "buttonText": "Learn More"
        }
      },
      {
        "id": "completion-1",
        "type": "completion",
        "order": 3,
        "config": {
          "title": "Thank You!",
          "message": "Thanks for your interest. We will be in touch soon!",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "showConfetti": true
        }
      }
    ],
    "theme": {
      "primaryColor": "#3b82f6",
      "backgroundColor": "#ffffff",
      "fontFamily": "Inter"
    },
    "settings": {
      "showProgress": true,
      "allowBack": true,
      "autoSave": true
    }
  }'::jsonb,
  NULL,
  NULL
),
(
  'Event Registration Flow',
  true,
  'event',
  '{
    "components": [
      {
        "id": "welcome-1",
        "type": "welcome",
        "order": 0,
        "config": {
          "title": "Join Our Event!",
          "subtitle": "Register now for exclusive access",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "showLogo": true,
          "buttonText": "Register Now"
        }
      },
      {
        "id": "form-1",
        "type": "registration_form",
        "order": 1,
        "config": {
          "title": "Event Registration", 
          "fields": [
            {"name": "email", "type": "email", "required": true, "label": "Email Address"},
            {"name": "name", "type": "text", "required": true, "label": "Full Name"},
            {"name": "company", "type": "text", "required": false, "label": "Company"},
            {"name": "dietary", "type": "select", "required": false, "label": "Dietary Requirements", "options": ["None", "Vegetarian", "Vegan", "Gluten-free"]}
          ],
          "buttonText": "Register",
          "backgroundColor": "#ffffff"
        }
      },
      {
        "id": "verification-1",
        "type": "verification",
        "order": 2,
        "config": {
          "title": "Verify Your Email",
          "message": "Please check your email and click the verification link.",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "buttonText": "Resend Email"
        }
      },
      {
        "id": "completion-1",
        "type": "completion",
        "order": 3,
        "config": {
          "title": "Registration Complete!",
          "message": "You are all set! We will send you event details soon.",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "showConfetti": true
        }
      }
    ],
    "theme": {
      "primaryColor": "#10b981",
      "backgroundColor": "#ffffff",
      "fontFamily": "Inter"
    },
    "settings": {
      "showProgress": true,
      "allowBack": false,
      "autoSave": true
    }
  }'::jsonb,
  NULL,
  NULL
),
(
  'Customer Feedback Flow',
  true,
  'survey',
  '{
    "components": [
      {
        "id": "welcome-1",
        "type": "welcome",
        "order": 0,
        "config": {
          "title": "Share Your Feedback",
          "subtitle": "Help us improve our service",
          "backgroundColor": "#ffffff", 
          "textColor": "#000000",
          "showLogo": true,
          "buttonText": "Start Survey"
        }
      },
      {
        "id": "survey-1",
        "type": "survey_form",
        "order": 1,
        "config": {
          "title": "How was your experience?",
          "questions": [
            {"id": "rating", "type": "rating", "question": "Overall satisfaction", "required": true, "scale": 5},
            {"id": "recommend", "type": "rating", "question": "Likelihood to recommend", "required": true, "scale": 10},
            {"id": "feedback", "type": "textarea", "question": "Additional feedback", "required": false}
          ],
          "buttonText": "Submit Feedback",
          "backgroundColor": "#ffffff"
        }
      },
      {
        "id": "completion-1",
        "type": "completion",
        "order": 2,
        "config": {
          "title": "Thank You!",
          "message": "Your feedback helps us serve you better.",
          "backgroundColor": "#ffffff",
          "textColor": "#000000",
          "showConfetti": false
        }
      }
    ],
    "theme": {
      "primaryColor": "#f59e0b",
      "backgroundColor": "#ffffff",
      "fontFamily": "Inter"
    },
    "settings": {
      "showProgress": true,
      "allowBack": true,
      "autoSave": true
    }
  }'::jsonb,
  NULL,
  NULL
);