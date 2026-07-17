-- Phase 5c Step 5: schedule the hourly "round tomorrow" reminder job.
--
-- pg_cron runs inside Postgres; the job invokes public.notify_push, which
-- POSTs to the Edge Function. The function itself owns the query + dedup
-- logic — this migration just wires the schedule.
--
-- Cadence: 0 * * * * (top of every hour). Plan §2 allows only one
-- reminder per round ever; dedup lives in the Edge Function against
-- notifications_log, not here.

create extension if not exists pg_cron;

-- Drop any previously scheduled job with this name so this migration is
-- rerun-safe (cron.unschedule errors if the job doesn't exist, hence the
-- conditional).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'push-round-tomorrow-hourly') then
    perform cron.unschedule('push-round-tomorrow-hourly');
  end if;
end $$;

select cron.schedule(
  'push-round-tomorrow-hourly',
  '0 * * * *',
  $cron$
    select public.notify_push('push-round-tomorrow', '{}'::jsonb);
  $cron$
);
