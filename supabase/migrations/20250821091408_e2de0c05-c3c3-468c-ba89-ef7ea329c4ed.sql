-- Create enums for flow system
CREATE TYPE flow_session_status AS ENUM ('active', 'completed', 'failed');
CREATE TYPE verification_result AS ENUM ('pass', 'warn', 'fail');
CREATE TYPE auth_provider AS ENUM ('google', 'apple', 'email');

-- Create flow_sessions table
CREATE TABLE public.flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_meta JSONB DEFAULT '{}',
  status flow_session_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_users table to track users per brand
CREATE TABLE public.brand_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_campaign_id UUID,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_via auth_provider NOT NULL DEFAULT 'email',
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_id, user_id)
);

-- Create verifications table
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_session_id UUID NOT NULL REFERENCES public.flow_sessions(id) ON DELETE CASCADE,
  qr_id UUID NOT NULL,
  batch_id UUID,
  result verification_result NOT NULL,
  reasons TEXT[] DEFAULT '{}',
  store_ok BOOLEAN DEFAULT true,
  expiry_ok BOOLEAN DEFAULT true,
  batch_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.flow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flow_sessions
CREATE POLICY "Public read access for customer flows"
ON public.flow_sessions FOR SELECT
USING (true);

CREATE POLICY "Users can create flow sessions"
ON public.flow_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their flow sessions"
ON public.flow_sessions FOR UPDATE
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Brands can view their flow sessions"
ON public.flow_sessions FOR SELECT
USING (
  brand_id IN (
    SELECT id FROM public.brands WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);

-- RLS Policies for brand_users
CREATE POLICY "Brands can view their users"
ON public.brand_users FOR SELECT
USING (
  brand_id IN (
    SELECT id FROM public.brands WHERE user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);

CREATE POLICY "Public insert for user registration"
ON public.brand_users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their brand relationships"
ON public.brand_users FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for verifications
CREATE POLICY "Public read for verification results"
ON public.verifications FOR SELECT
USING (true);

CREATE POLICY "Public insert for verification creation"
ON public.verifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Brands can view their verifications"
ON public.verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.flow_sessions fs
    WHERE fs.id = verifications.flow_session_id
    AND (
      fs.brand_id IN (
        SELECT id FROM public.brands WHERE user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'master_admin'
      )
    )
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_flow_sessions_updated_at
  BEFORE UPDATE ON public.flow_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_users_updated_at
  BEFORE UPDATE ON public.brand_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_flow_sessions_qr_id ON public.flow_sessions(qr_id);
CREATE INDEX idx_flow_sessions_campaign_id ON public.flow_sessions(campaign_id);
CREATE INDEX idx_flow_sessions_brand_id ON public.flow_sessions(brand_id);
CREATE INDEX idx_flow_sessions_user_id ON public.flow_sessions(user_id);
CREATE INDEX idx_brand_users_brand_id ON public.brand_users(brand_id);
CREATE INDEX idx_brand_users_user_id ON public.brand_users(user_id);
CREATE INDEX idx_verifications_flow_session_id ON public.verifications(flow_session_id);
CREATE INDEX idx_verifications_qr_id ON public.verifications(qr_id);