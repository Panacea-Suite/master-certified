-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY "Users can view teams of their brands" 
ON public.teams 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id = teams.brand_id 
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams for their brands" 
ON public.teams 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id = teams.brand_id 
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update teams of their brands" 
ON public.teams 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id = teams.brand_id 
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete teams of their brands" 
ON public.teams 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id = teams.brand_id 
    AND brands.user_id = auth.uid()
  )
);

-- Master admins can view all teams
CREATE POLICY "Master admins can view all teams" 
ON public.teams 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'master_admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();