-- Loop Phase C: schedule the hourly post-round check-in job. Same shape
-- as the round-tomorrow cron; the Edge Function owns the window query
-- and the one-push-per-round-per-user dedup against notifications_log.
-- Runs at :30 so it interleaves with push-round-tomorrow at :00.

create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'push-round-checkin-hourly') then
    perform cron.unschedule('push-round-checkin-hourly');
  end if;
end $$;

select cron.schedule(
  'push-round-checkin-hourly',
  '30 * * * *',
  $cron$
    select public.notify_push('push-round-checkin', '{}'::jsonb);
  $cron$
);
