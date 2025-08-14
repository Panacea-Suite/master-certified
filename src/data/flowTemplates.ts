// Pre-built flow templates with complete content structure
export interface FlowTemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  pages: FlowPage[];
  designTemplate?: string;
}

export interface FlowPage {
  id: string;
  name: string;
  type: 'welcome' | 'content' | 'form' | 'thank_you' | 'custom';
  sections: FlowSection[];
}

export interface FlowSection {
  id: string;
  type: 'header' | 'hero' | 'text' | 'image' | 'form' | 'card' | 'button' | 'features';
  config: any;
}

export const FLOW_TEMPLATES: FlowTemplateData[] = [
  // E-COMMERCE TEMPLATES
  {
    id: 'product-launch',
    name: 'Product Launch Flow',
    description: 'Complete product launch experience with features, pricing, and pre-order',
    category: 'ecommerce',
    tags: ['product', 'launch', 'ecommerce', 'preorder'],
    icon: 'package',
    pages: [
      {
        id: 'welcome',
        name: 'Welcome',
        type: 'welcome',
        sections: [
          {
            id: 'hero',
            type: 'hero',
            config: {
              title: 'Introducing the Future',
              subtitle: 'Revolutionary new product that changes everything',
              description: 'Be among the first to experience innovation that will transform your daily routine.',
              buttonText: 'Discover More',
              backgroundType: 'gradient'
            }
          }
        ]
      },
      {
        id: 'product-showcase',
        name: 'Product Showcase',
        type: 'content',
        sections: [
          {
            id: 'product-hero',
            type: 'image',
            config: {
              title: 'Meet Your New Favorite',
              imageUrl: '/placeholder-product.jpg',
              description: 'Crafted with precision, designed for perfection.'
            }
          },
          {
            id: 'key-benefits',
            type: 'features',
            config: {
              title: 'Why You\'ll Love It',
              features: [
                { title: 'Premium Quality', description: 'Built to last with the finest materials' },
                { title: 'Smart Design', description: 'Intuitive features that just make sense' },
                { title: 'Instant Results', description: 'See the difference from day one' }
              ]
            }
          }
        ]
      },
      {
        id: 'pricing',
        name: 'Pricing',
        type: 'content',
        sections: [
          {
            id: 'pricing-header',
            type: 'text',
            config: {
              title: 'Early Bird Special',
              content: 'Limited time pricing for our first 100 customers'
            }
          },
          {
            id: 'price-card',
            type: 'card',
            config: {
              title: '$299',
              subtitle: 'Launch Price',
              content: 'Regular price $399 • Save $100',
              features: ['Free shipping', '30-day guarantee', 'Premium support']
            }
          }
        ]
      },
      {
        id: 'preorder',
        name: 'Pre-order',
        type: 'form',
        sections: [
          {
            id: 'preorder-form',
            type: 'form',
            config: {
              title: 'Secure Your Order',
              subtitle: 'Reserve yours today with just $50 down',
              fields: [
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'name', type: 'text', label: 'Full Name', required: true },
                { name: 'phone', type: 'tel', label: 'Phone Number', required: false }
              ],
              submitText: 'Reserve Mine'
            }
          }
        ]
      },
      {
        id: 'confirmation',
        name: 'Thank You',
        type: 'thank_you',
        sections: [
          {
            id: 'success',
            type: 'text',
            config: {
              title: '🎉 You\'re In!',
              content: 'Your pre-order has been confirmed. We\'ll send you updates as we get closer to launch.',
              buttonText: 'Share with Friends'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'store-locator',
    name: 'Store Locator Flow',
    description: 'Help customers find your nearest location with directions and contact info',
    category: 'ecommerce',
    tags: ['retail', 'location', 'store', 'directions'],
    icon: 'map-pin',
    pages: [
      {
        id: 'welcome',
        name: 'Find a Store',
        type: 'welcome',
        sections: [
          {
            id: 'hero',
            type: 'hero',
            config: {
              title: 'Find Your Nearest Store',
              subtitle: 'Discover our locations near you',
              description: 'Visit us in person to experience our products and get expert advice.',
              buttonText: 'Find Stores'
            }
          }
        ]
      },
      {
        id: 'location-finder',
        name: 'Location Search',
        type: 'form',
        sections: [
          {
            id: 'search-form',
            type: 'form',
            config: {
              title: 'Enter Your Location',
              fields: [
                { name: 'location', type: 'text', label: 'City, State or ZIP', required: true }
              ],
              submitText: 'Find Stores'
            }
          }
        ]
      },
      {
        id: 'store-details',
        name: 'Store Information',
        type: 'content',
        sections: [
          {
            id: 'store-card',
            type: 'card',
            config: {
              title: 'Downtown Store',
              subtitle: '2.1 miles away',
              content: '123 Main Street, City, State 12345',
              features: ['Open until 9 PM', 'Full product range', 'Expert staff'],
              buttonText: 'Get Directions'
            }
          },
          {
            id: 'store-hours',
            type: 'text',
            config: {
              title: 'Store Hours',
              content: 'Mon-Sat: 9 AM - 9 PM\nSun: 11 AM - 7 PM\nPhone: (555) 123-4567'
            }
          }
        ]
      }
    ]
  },

  // EVENT TEMPLATES
  {
    id: 'event-registration',
    name: 'Event Registration Flow',
    description: 'Complete event signup with speaker info, schedule, and registration form',
    category: 'events',
    tags: ['event', 'registration', 'conference', 'workshop'],
    icon: 'calendar',
    pages: [
      {
        id: 'event-intro',
        name: 'Event Details',
        type: 'welcome',
        sections: [
          {
            id: 'event-hero',
            type: 'hero',
            config: {
              title: 'Innovation Summit 2024',
              subtitle: 'March 15-16, 2024 • San Francisco',
              description: 'Join industry leaders for two days of insights, networking, and breakthrough ideas.',
              buttonText: 'View Schedule'
            }
          }
        ]
      },
      {
        id: 'speakers',
        name: 'Speakers',
        type: 'content',
        sections: [
          {
            id: 'speakers-intro',
            type: 'text',
            config: {
              title: 'World-Class Speakers',
              content: 'Learn from the brightest minds in technology and innovation.'
            }
          },
          {
            id: 'speaker-lineup',
            type: 'features',
            config: {
              title: 'Featured Speakers',
              features: [
                { title: 'Sarah Chen', description: 'CEO, Tech Innovations • Keynote: Future of AI' },
                { title: 'Marcus Johnson', description: 'Director, Design Lab • Workshop: UX Trends' },
                { title: 'Dr. Elena Rodriguez', description: 'Research Lead • Talk: Sustainable Tech' }
              ]
            }
          }
        ]
      },
      {
        id: 'schedule',
        name: 'Schedule',
        type: 'content',
        sections: [
          {
            id: 'day-one',
            type: 'card',
            config: {
              title: 'Day 1 - March 15',
              features: [
                '9:00 AM - Registration & Coffee',
                '10:00 AM - Opening Keynote',
                '11:30 AM - Panel Discussion',
                '1:00 PM - Lunch & Networking',
                '2:30 PM - Breakout Sessions',
                '5:00 PM - Closing Reception'
              ]
            }
          },
          {
            id: 'day-two',
            type: 'card',
            config: {
              title: 'Day 2 - March 16',
              features: [
                '9:00 AM - Welcome Coffee',
                '9:30 AM - Workshop Sessions',
                '12:00 PM - Lunch',
                '1:30 PM - Innovation Showcase',
                '3:00 PM - Final Presentations',
                '4:30 PM - Wrap-up & Next Steps'
              ]
            }
          }
        ]
      },
      {
        id: 'registration',
        name: 'Registration',
        type: 'form',
        sections: [
          {
            id: 'registration-form',
            type: 'form',
            config: {
              title: 'Register Now',
              subtitle: 'Early bird pricing ends soon!',
              fields: [
                { name: 'name', type: 'text', label: 'Full Name', required: true },
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'company', type: 'text', label: 'Company', required: false },
                { name: 'role', type: 'text', label: 'Job Title', required: false },
                { name: 'dietary', type: 'text', label: 'Dietary Restrictions', required: false }
              ],
              submitText: 'Complete Registration'
            }
          }
        ]
      },
      {
        id: 'confirmation',
        name: 'Registration Complete',
        type: 'thank_you',
        sections: [
          {
            id: 'success',
            type: 'text',
            config: {
              title: '✅ You\'re Registered!',
              content: 'Check your email for event details and your digital ticket. We can\'t wait to see you there!',
              buttonText: 'Add to Calendar'
            }
          }
        ]
      }
    ]
  },

  // SERVICE TEMPLATES
  {
    id: 'consultation-booking',
    name: 'Consultation Booking',
    description: 'Service overview with calendar booking and contact details collection',
    category: 'services',
    tags: ['consultation', 'booking', 'service', 'appointment'],
    icon: 'user-check',
    pages: [
      {
        id: 'service-intro',
        name: 'Our Services',
        type: 'welcome',
        sections: [
          {
            id: 'service-hero',
            type: 'hero',
            config: {
              title: 'Expert Consultation',
              subtitle: 'Get personalized advice from our specialists',
              description: 'Book a 1-on-1 consultation to discuss your specific needs and get tailored recommendations.',
              buttonText: 'Learn More'
            }
          }
        ]
      },
      {
        id: 'service-details',
        name: 'What We Offer',
        type: 'content',
        sections: [
          {
            id: 'services',
            type: 'features',
            config: {
              title: 'Consultation Services',
              features: [
                { title: 'Strategy Planning', description: 'Develop a roadmap for success' },
                { title: 'Expert Analysis', description: 'Get insights from industry professionals' },
                { title: 'Custom Solutions', description: 'Tailored recommendations for your situation' }
              ]
            }
          },
          {
            id: 'pricing',
            type: 'card',
            config: {
              title: 'Consultation Package',
              subtitle: '60-minute session',
              content: '$150 per hour',
              features: ['One-on-one expert time', 'Detailed recommendations', 'Follow-up summary', '30-day email support']
            }
          }
        ]
      },
      {
        id: 'booking',
        name: 'Book Appointment',
        type: 'form',
        sections: [
          {
            id: 'booking-form',
            type: 'form',
            config: {
              title: 'Schedule Your Consultation',
              subtitle: 'Choose your preferred time slot',
              fields: [
                { name: 'name', type: 'text', label: 'Full Name', required: true },
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'phone', type: 'tel', label: 'Phone Number', required: true },
                { name: 'service', type: 'select', label: 'Service Type', required: true, options: ['Strategy Planning', 'Expert Analysis', 'Custom Solutions'] },
                { name: 'message', type: 'textarea', label: 'Brief description of your needs', required: false }
              ],
              submitText: 'Book Consultation'
            }
          }
        ]
      },
      {
        id: 'confirmation',
        name: 'Booking Confirmed',
        type: 'thank_you',
        sections: [
          {
            id: 'success',
            type: 'text',
            config: {
              title: '📅 Consultation Booked!',
              content: 'Your consultation has been scheduled. We\'ll send you a calendar invite and preparation materials shortly.',
              buttonText: 'Prepare for Session'
            }
          }
        ]
      }
    ]
  },

  // MARKETING TEMPLATES
  {
    id: 'lead-generation',
    name: 'Lead Generation Flow',
    description: 'Value proposition with lead magnet and email capture for marketing',
    category: 'marketing',
    tags: ['lead generation', 'email', 'marketing', 'conversion'],
    icon: 'target',
    pages: [
      {
        id: 'value-prop',
        name: 'Value Proposition',
        type: 'welcome',
        sections: [
          {
            id: 'hero',
            type: 'hero',
            config: {
              title: 'Double Your Productivity',
              subtitle: 'Free Ultimate Productivity Guide',
              description: 'Discover the proven strategies that top performers use to get more done in less time.',
              buttonText: 'Get Free Guide'
            }
          }
        ]
      },
      {
        id: 'lead-magnet',
        name: 'Free Resource',
        type: 'content',
        sections: [
          {
            id: 'guide-preview',
            type: 'image',
            config: {
              title: 'What\'s Inside the Guide',
              imageUrl: '/placeholder-guide.jpg',
              description: '50+ pages of actionable productivity strategies'
            }
          },
          {
            id: 'guide-contents',
            type: 'features',
            config: {
              title: 'You\'ll Learn',
              features: [
                { title: 'Time Management', description: 'Master your schedule and priorities' },
                { title: 'Focus Techniques', description: 'Eliminate distractions and stay on track' },
                { title: 'Energy Optimization', description: 'Work with your natural rhythms' },
                { title: 'Tool Integration', description: 'Streamline your workflow with the right apps' }
              ]
            }
          }
        ]
      },
      {
        id: 'email-capture',
        name: 'Get Your Guide',
        type: 'form',
        sections: [
          {
            id: 'email-form',
            type: 'form',
            config: {
              title: 'Download Your Free Guide',
              subtitle: 'Enter your email to get instant access',
              fields: [
                { name: 'email', type: 'email', label: 'Email Address', required: true },
                { name: 'name', type: 'text', label: 'First Name', required: true }
              ],
              submitText: 'Send Me the Guide'
            }
          }
        ]
      },
      {
        id: 'thank-you',
        name: 'Download Ready',
        type: 'thank_you',
        sections: [
          {
            id: 'success',
            type: 'text',
            config: {
              title: '🎉 Check Your Email!',
              content: 'Your Productivity Guide is on its way to your inbox. Start implementing these strategies today!',
              buttonText: 'Share with Friends'
            }
          }
        ]
      }
    ]
  },

  {
    id: 'survey-feedback',
    name: 'Survey & Feedback Flow',
    description: 'Multi-step survey with feedback collection and results sharing',
    category: 'marketing',
    tags: ['survey', 'feedback', 'research', 'insights'],
    icon: 'message-square',
    pages: [
      {
        id: 'survey-intro',
        name: 'Help Us Improve',
        type: 'welcome',
        sections: [
          {
            id: 'intro',
            type: 'hero',
            config: {
              title: 'Your Opinion Matters',
              subtitle: 'Quick 2-minute survey',
              description: 'Help us understand how we can serve you better. Your feedback shapes our future.',
              buttonText: 'Start Survey'
            }
          }
        ]
      },
      {
        id: 'questions',
        name: 'Survey Questions',
        type: 'form',
        sections: [
          {
            id: 'survey-form',
            type: 'form',
            config: {
              title: 'Tell Us About Your Experience',
              fields: [
                { name: 'satisfaction', type: 'select', label: 'How satisfied are you with our service?', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
                { name: 'recommendation', type: 'select', label: 'How likely are you to recommend us?', required: true, options: ['10 - Extremely Likely', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0 - Not at all likely'] },
                { name: 'improvement', type: 'textarea', label: 'What could we improve?', required: false },
                { name: 'features', type: 'text', label: 'What features would you like to see?', required: false }
              ],
              submitText: 'Submit Survey'
            }
          }
        ]
      },
      {
        id: 'contact-info',
        name: 'Stay Connected',
        type: 'form',
        sections: [
          {
            id: 'contact-form',
            type: 'form',
            config: {
              title: 'Get Survey Results',
              subtitle: 'We\'ll share insights from this survey with participants',
              fields: [
                { name: 'email', type: 'email', label: 'Email Address (optional)', required: false },
                { name: 'updates', type: 'checkbox', label: 'Send me product updates', required: false }
              ],
              submitText: 'Complete Survey'
            }
          }
        ]
      },
      {
        id: 'thank-you',
        name: 'Thank You',
        type: 'thank_you',
        sections: [
          {
            id: 'success',
            type: 'text',
            config: {
              title: '🙏 Thank You!',
              content: 'Your feedback helps us improve. We\'ll review every response and use it to enhance our service.',
              buttonText: 'View Our Blog'
            }
          }
        ]
      }
    ]
  }
];

export const CATEGORIES = {
  ecommerce: {
    label: 'E-commerce',
    description: 'Product launches, store locators, and shopping experiences',
    icon: 'shopping-bag'
  },
  events: {
    label: 'Events',
    description: 'Event registration, workshops, and conference flows',
    icon: 'calendar'
  },
  services: {
    label: 'Services',
    description: 'Consultations, bookings, and service inquiries',
    icon: 'briefcase'
  },
  marketing: {
    label: 'Marketing',
    description: 'Lead generation, surveys, and conversion flows',
    icon: 'target'
  }
};