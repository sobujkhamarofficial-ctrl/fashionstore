-- Add a dedicated, independently rate-limited action for Gemini Live Voice sessions.
-- The function is SECURITY INVOKER (default); existing grants and ownership are preserved.
CREATE OR REPLACE FUNCTION public.consume_store_rate_limit(
  p_action text,
  p_fingerprint text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public', 'extensions'
AS $function$
declare
  v_key text;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_count integer;
begin
  if p_action not in (
    'order', 'catalogue_order', 'contact', 'newsletter', 'review', 'track',
    'ai_customer_care', 'ai_live_voice', 'admin_login', 'ai_feedback'
  ) then
    raise exception 'Unsupported rate-limit action';
  end if;
  if p_fingerprint is null or length(p_fingerprint) < 3 or length(p_fingerprint) > 500 then
    raise exception 'Invalid rate-limit fingerprint';
  end if;
  if p_limit < 1 or p_limit > 100 or p_window_seconds < 30 or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit parameters';
  end if;
  v_key := p_action || ':' || pg_catalog.encode(
    extensions.digest(pg_catalog.lower(pg_catalog.btrim(p_fingerprint)), 'sha256'),
    'hex'
  );
  insert into public.store_request_throttles(throttle_key, action_name, window_started_at, request_count, updated_at)
  values (v_key, p_action, v_now, 1, v_now)
  on conflict (throttle_key) do update
    set window_started_at = case
          when public.store_request_throttles.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
            then v_now else public.store_request_throttles.window_started_at end,
        request_count = case
          when public.store_request_throttles.window_started_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds)
            then 1 else public.store_request_throttles.request_count + 1 end,
        updated_at = v_now
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$function$;
