create table if not exists public.store_ai_feedback (
  id uuid primary key default gen_random_uuid(),
  rating smallint not null check (rating in (-1, 1)),
  reason text not null check (reason in ('helpful','wrong_information','irrelevant','tone','other')),
  intent text not null default 'general' check (length(intent) <= 40),
  sentiment text not null default 'neutral' check (sentiment in ('angry','frustrated','confused','positive','neutral','urgent')),
  model text,
  session_hash text not null check (session_hash ~ '^[0-9a-f]{64}$'),
  page_path text,
  latency_ms integer check (latency_ms is null or (latency_ms >= 0 and latency_ms <= 180000)),
  created_at timestamptz not null default now()
);
create index if not exists store_ai_feedback_created_at_idx on public.store_ai_feedback (created_at desc);
create index if not exists store_ai_feedback_rating_created_idx on public.store_ai_feedback (rating, created_at desc);
alter table public.store_ai_feedback enable row level security;
revoke all on table public.store_ai_feedback from public, anon, authenticated;
grant select, insert on table public.store_ai_feedback to service_role;

create or replace function public.create_store_ai_feedback(
  p_rating smallint,p_reason text,p_intent text,p_sentiment text,p_model text,
  p_session_hash text,p_page_path text,p_latency_ms integer
)
returns uuid language plpgsql set search_path = pg_catalog, public
as $function$
declare v_id uuid;
begin
  if p_rating not in (-1,1) then raise exception 'Invalid feedback rating'; end if;
  if p_reason not in ('helpful','wrong_information','irrelevant','tone','other') then raise exception 'Invalid feedback reason'; end if;
  if p_sentiment not in ('angry','frustrated','confused','positive','neutral','urgent') then raise exception 'Invalid sentiment'; end if;
  if p_session_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid feedback session'; end if;
  if p_intent is null or length(p_intent)>40 then raise exception 'Invalid feedback intent'; end if;
  if p_model is not null and length(p_model)>100 then raise exception 'Invalid model'; end if;
  if p_page_path is not null and length(p_page_path)>180 then raise exception 'Invalid page path'; end if;
  if p_latency_ms is not null and (p_latency_ms<0 or p_latency_ms>180000) then raise exception 'Invalid response latency'; end if;
  insert into public.store_ai_feedback(rating,reason,intent,sentiment,model,session_hash,page_path,latency_ms)
  values(p_rating,p_reason,p_intent,p_sentiment,p_model,p_session_hash,p_page_path,p_latency_ms)
  returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.list_store_ai_feedback(p_limit integer default 120)
returns table(id uuid,rating smallint,reason text,intent text,sentiment text,model text,session_hash text,page_path text,latency_ms integer,created_at timestamptz)
language sql stable set search_path = pg_catalog, public
as $function$
  select f.id,f.rating,f.reason,f.intent,f.sentiment,f.model,f.session_hash,f.page_path,f.latency_ms,f.created_at
  from public.store_ai_feedback f order by f.created_at desc
  limit least(greatest(coalesce(p_limit,120),1),500);
$function$;

revoke all on function public.create_store_ai_feedback(smallint,text,text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.create_store_ai_feedback(smallint,text,text,text,text,text,text,integer) to service_role;
revoke all on function public.list_store_ai_feedback(integer) from public,anon,authenticated;
grant execute on function public.list_store_ai_feedback(integer) to service_role;

create or replace function public.consume_store_rate_limit(p_action text,p_fingerprint text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql
set search_path to 'pg_catalog','public','extensions'
as $function$
declare
  v_key text;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_count integer;
begin
  if p_action not in ('order','catalogue_order','contact','newsletter','review','track','ai_customer_care','admin_login','ai_feedback') then
    raise exception 'Unsupported rate-limit action';
  end if;
  if p_fingerprint is null or length(p_fingerprint)<3 or length(p_fingerprint)>500 then raise exception 'Invalid rate-limit fingerprint'; end if;
  if p_limit<1 or p_limit>100 or p_window_seconds<30 or p_window_seconds>86400 then raise exception 'Invalid rate-limit parameters'; end if;
  v_key:=p_action||':'||pg_catalog.encode(extensions.digest(pg_catalog.lower(pg_catalog.btrim(p_fingerprint)),'sha256'),'hex');
  insert into public.store_request_throttles(throttle_key,action_name,window_started_at,request_count,updated_at)
  values(v_key,p_action,v_now,1,v_now)
  on conflict(throttle_key) do update
    set window_started_at=case when public.store_request_throttles.window_started_at<=v_now-pg_catalog.make_interval(secs=>p_window_seconds) then v_now else public.store_request_throttles.window_started_at end,
        request_count=case when public.store_request_throttles.window_started_at<=v_now-pg_catalog.make_interval(secs=>p_window_seconds) then 1 else public.store_request_throttles.request_count+1 end,
        updated_at=v_now
  returning request_count into v_count;
  return v_count<=p_limit;
end;
$function$;
