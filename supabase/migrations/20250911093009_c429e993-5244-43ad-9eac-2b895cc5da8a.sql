-- Create team_users table to track team membership and roles
CREATE TABLE public.team_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create user_invites table for pending invitations
CREATE TABLE public.user_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  invite_token TEXT NOT NULL UNIQUE DEFAULT gen_hex_token(32),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, team_id)
);

-- Enable RLS on both tables
ALTER TABLE public.team_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_users
CREATE POLICY "Users can view team members of their brands" 
ON public.team_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add members to teams of their brands" 
ON public.team_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update team members of their brands" 
ON public.team_users 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove team members from their brands" 
ON public.team_users 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id 
    AND b.user_id = auth.uid()
  )
);

-- Master admins can view all team users
CREATE POLICY "Master admins can view all team users" 
ON public.team_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'master_admin'
  )
);

-- RLS policies for user_invites
CREATE POLICY "Users can view invites for their brands" 
ON public.user_invites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.brands b
    WHERE b.id = user_invites.brand_id 
    AND b.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'master_admin'
  )
);

CREATE POLICY "Users can create invites for their brands" 
ON public.user_invites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.brands b
    WHERE b.id = user_invites.brand_id 
    AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update invites for their brands" 
ON public.user_invites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.brands b
    WHERE b.id = user_invites.brand_id 
    AND b.user_id = auth.uid()
  )
);

-- Public read access for invite acceptance
CREATE POLICY "Public can view invites by token" 
ON public.user_invites 
FOR SELECT 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_team_users_updated_at
BEFORE UPDATE ON public.team_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_invites_updated_at
BEFORE UPDATE ON public.user_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();