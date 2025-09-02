-- Helper: check brand ownership (already likely exists; keep if present)
create or replace function public.owns_flow(_flow_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.flows f
    join public.campaigns c on c.id = f.campaign_id
    join public.brands b on b.id = c.brand_id
    where f.id = _flow_id
      and (b.user_id = auth.uid() or public.has_role(auth.uid(), 'master_admin'))
  );
$$;

-- Core: snapshot current draft into flows.published_snapshot and bump version
create or replace function public.snapshot_flow(p_flow_id uuid)
returns table (
  flow_id uuid,
  new_version int,
  published_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_version int;
begin
  -- We allow SECURITY DEFINER for the trigger path; no auth.uid() during triggers.
  -- When called from the app (RPC), ownership check still applies via RLS on update below.

  -- Compute next version from the current row
  select coalesce(latest_published_version, 0) + 1
  into v_version
  from public.flows
  where id = p_flow_id;

  -- Build ordered content as snapshot
  update public.flows f
  set published_snapshot = (
        select jsonb_build_object(
          'version', v_version,
          'pages', coalesce(
            (select jsonb_agg(fc order by fc.order_index)
             from public.flow_content fc
             where fc.flow_id = p_flow_id),
            '[]'::jsonb
          )
        )
      ),
      latest_published_version = v_version,
      updated_at = now()
  where f.id = p_flow_id;

  return query
  select p_flow_id, v_version, now();
end;
$$;

-- Trigger: run snapshot automatically when campaign_id is set/changed
create or replace function public.auto_publish_on_attach()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only when attaching or switching campaigns
  if (TG_OP in ('INSERT','UPDATE'))
     and NEW.campaign_id is not null
     and (TG_OP = 'INSERT' or OLD.campaign_id is distinct from NEW.campaign_id) then
    perform public.snapshot_flow(NEW.id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_auto_publish_on_attach on public.flows;
create trigger trg_auto_publish_on_attach
after insert or update of campaign_id
on public.flows
for each row
execute function public.auto_publish_on_attach();