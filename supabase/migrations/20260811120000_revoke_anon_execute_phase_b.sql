-- Posture fix: strip PUBLIC/anon execute from the two Phase B RPCs.
--
-- The 2026-08-07 advisor hardening set default privileges to withhold
-- PUBLIC execute from new functions, but verification shows the
-- platform still attaches PUBLIC and anon execute grants to freshly
-- created functions (proacl: "=X/postgres, anon=X/postgres, ..."), so
-- the default didn't cover them. Not exploitable — both functions key
-- every write on auth.uid(), which is null for anon, so a signed-out
-- call updates zero rows — but the posture rule is no anon execute
-- anywhere, and the advisor would flag it.
--
-- Lesson recorded for future migrations: every new function needs an
-- explicit revoke alongside its grant; don't rely on default privileges.

revoke execute on function public.touch_last_active() from public, anon;
revoke execute on function public.mark_notification_opened(uuid) from public, anon;
