-- Drop existing policies to recreate them with better access control
DROP POLICY IF EXISTS "Users can view their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can create their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
DROP POLICY IF EXISTS "Users can delete their own brands" ON public.brands;

DROP POLICY IF EXISTS "Users can view teams of their brands" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams for their brands" ON public.teams;
DROP POLICY IF EXISTS "Users can update teams of their brands" ON public.teams;
DROP POLICY IF EXISTS "Users can delete teams of their brands" ON public.teams;
DROP POLICY IF EXISTS "Master admins can view all teams" ON public.teams;

DROP POLICY IF EXISTS "Users can view team members of their brands" ON public.team_users;
DROP POLICY IF EXISTS "Users can add members to teams of their brands" ON public.team_users;
DROP POLICY IF EXISTS "Users can update team members of their brands" ON public.team_users;
DROP POLICY IF EXISTS "Users can remove team members from their brands" ON public.team_users;
DROP POLICY IF EXISTS "Master admins can view all team users" ON public.team_users;

DROP POLICY IF EXISTS "Users can view flows of their campaigns" ON public.flows;
DROP POLICY IF EXISTS "Users can create flows for their campaigns or templates" ON public.flows;
DROP POLICY IF EXISTS "Users can update flows of their campaigns" ON public.flows;
DROP POLICY IF EXISTS "Users can delete flows of their campaigns or templates" ON public.flows;
DROP POLICY IF EXISTS "Public access to flows for customer experience" ON public.flows;
DROP POLICY IF EXISTS "Public access to system templates" ON public.flows;
DROP POLICY IF EXISTS "TEMP public read flows" ON public.flows;

DROP POLICY IF EXISTS "Users can view campaigns of their brands" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns for their brands" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns of their brands" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns of their brands" ON public.campaigns;
DROP POLICY IF EXISTS "Secure customer flow access to campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Users can view batches of their campaigns" ON public.batches;
DROP POLICY IF EXISTS "Users can create batches for their campaigns" ON public.batches;
DROP POLICY IF EXISTS "Users can update batches of their campaigns" ON public.batches;
DROP POLICY IF EXISTS "Users can delete batches of their campaigns" ON public.batches;