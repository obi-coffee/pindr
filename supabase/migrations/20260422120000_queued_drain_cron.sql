-- Phase 5c Step 6: schedule the hourly queued-drain job.
--
-- Fires at :05 past every hour so it doesn't collide with the
-- round-tomorrow reminder job at :00. Both call Edge Functions via
-- public.notify_push; staggering by five minutes keeps pg_net's
-- outbound worker pool comfortable on the hour.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'push-on-queued-drain-hourly') then
    perform cron.unschedule('push-on-queued-drain-hourly');
  end if;
end $$;

select cron.schedule(
  'push-on-queued-drain-hourly',
  '5 * * * *',
  $cron$
    select public.notify_push('push-on-queued-drain', '{}'::jsonb);
  $cron$
);
