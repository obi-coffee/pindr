# Pindr — Claude Code Project Brief

## What we're building
Pindr is a swipe-based matching app that helps solo golfers find compatible
playing partners locally or when traveling. It works like Hinge/Tinder in
interaction model, but matches on golf compatibility (handicap, pace, style
of play, teaching mindset) plus lifestyle fit (age, pronouns, interests,
post-round vibe). Primary target users: golfers in their 20s–30s, women and
underrepresented golfers, and traveling/relocating solo players.

The full project plan — product vision, user personas, feature scope, data
model, and phased build plan — lives one directory up at
`../Pindr-Project-Plan.md`. Read it if you need fuller context before making
a design decision.

## Non-negotiable product principles
1. **Trust and safety first.** Every feature must consider the safety of
   women and underrepresented users. Default to private, opt-in to public.
   Report/block is always one tap away.
2. **Mobile-native feel.** This is not a web app ported to mobile. Gestures,
   transitions, and haptics should feel like a modern dating app.
3. **Golf IQ matters.** The matching model's job is to prevent mismatched
   rounds (a competitive player paired with a beginner who wants to hang
   out). When in doubt, surface a compatibility signal the user can see.
4. **Beginner developer.** The human working with you is new to coding with
   AI. Explain what you're doing in plain English before writing code.
   Favor clear, boring solutions over clever ones. Small, reviewable diffs.

## Tech stack (do not deviate without asking)
- React Native with Expo (managed workflow), Expo Router, TypeScript
- Supabase (Postgres + Auth + Storage + Realtime); PostGIS for location
- Zustand for UI state, TanStack Query for server data
- react-hook-form + zod for forms
- NativeWind for styling (Tailwind classes)
- react-native-deck-swiper for the card stack
- react-native-reanimated v3 + react-native-gesture-handler + expo-haptics
  for all motion and haptics (Phase 5d). **No other animation libraries**
  — no Moti, Lottie, or react-native-animatable.

Supabase client is already initialized at `lib/supabase.ts`. Environment
variables live in `.env` (gitignored) with the `EXPO_PUBLIC_` prefix.
Motion tokens (durations, springs, easings) live in `lib/motion.ts` and
are the single source of truth — no inline magic numbers anywhere else
in the codebase. Haptics go through the `useHaptics()` hook in
`lib/haptics.ts`.

## How we work
- **One phase at a time.** Don't build ahead of what the user asked for.
- **Explain, then code.** Start each phase with a short plan in plain
  English: what files you'll create/change, what the data flow looks like,
  what the user will see at the end. Wait for approval before coding.
- **Migrations are source-controlled.** All schema changes go in
  `supabase/migrations/` as timestamped SQL files. Never edit the database
  directly through the Supabase dashboard once we're past Phase 1.
- **RLS on by default.** Every table has row-level security enabled with
  explicit policies. Never ship a table with RLS disabled.
- **Environment safety.** Secrets go in `.env` (gitignored). `.env.example`
  is committed with placeholder values.
- **Commits are small and descriptive.** One feature or fix per commit.
  Conventional commit style: `feat: ...`, `fix: ...`, `chore: ...`.
- **When stuck, ask.** If a requirement is ambiguous, ask the user a
  specific multiple-choice question rather than guessing.

## Data model (authoritative — update this section if it changes)
Core tables: users, profiles, interests, profile_interests, courses, swipes,
matches, messages, reports, travel_sessions. Phase 5b adds: rounds,
round_requests, plus a `partner_refs` jsonb column on courses. Phase 5c
adds: push_tokens, notification_preferences, notifications_log. See the
project plan for full schema. Location columns use `geography(point, 4326)`
with PostGIS. The `rounds.source`, `rounds.external_ref`,
`rounds.price_cents`, and `courses.partner_refs` fields are V2-readiness
slots — present in V1 but unused/null; partner inventory (GolfNow) will
populate them in V2 without a schema change.

## Safety requirements that must ship in MVP
- Phone + email verification at signup
- Report user with reason (spam, harassment, fake profile, safety concern,
  other)
- Block user (two-way hide in discovery)
- Women-only discovery filter
- "Share my plans" — native share sheet with match name, photo, course, tee
  time
- Community guidelines acceptance at signup, linked in settings

## What is explicitly out of scope for MVP
Swing video uploads, tee-time booking integration (V2 — GolfNow affiliate),
GHIN handicap verification, photo/selfie verification, subscriptions,
pro/coach profile type, post-round reviews. Do not build these without
explicit approval, even if they seem small. NOTE: user-posted "open
rounds" are IN scope as of Phase 5b — see project plan §8. Push
notifications are IN scope as of Phase 5c — see §8 and
`../Pindr-Push-Notification-Plan.md`. Micro-interactions and motion
polish are IN scope as of Phase 5d — see §8 and
`../Pindr-MicroInteractions-Plan.md`.

## Where we are right now
Phases 0–5c are complete: Expo + TypeScript scaffold, Supabase client
wired, auth + app shell, profile creation, discovery & swipe, matches &
chat, safety + polish, user-posted open rounds, and push notifications.
Notifications are rate-limited, quiet-hour-aware, and delivered via
Supabase Edge Functions + Expo Push; the Settings → Notifications group
is live.

## Your current task (Phase 5d — micro-interactions & motion, "the perfect putt")
Add a minimal, elegant motion layer across the existing app — swipe
feel, match moment, tap feedback, screen transitions, skeleton loading,
and optimistic UI. **No new screens, no new data model, no new routes.**
Pure polish on top of Phases 0–5c.

**`../Pindr-MicroInteractions-Plan.md` is the authoritative spec** —
read it end-to-end before starting. Token values, gesture math, and
behavior rules all come from it. The plan's non-negotiables (§5) are
binding: animate `transform` and `opacity` only; all gesture animations
run on the UI thread via Reanimated worklets; every animated component
checks `useReducedMotion` and falls back; no new libraries beyond the
three in the tech stack above.

The seven-step build order lives in §8 "Phase 5d" of
`../Pindr-Project-Plan.md`. Follow the process rules in "How we work"
above — propose each step in plain English first, wait for approval,
then build with review pauses between steps. Do not touch the data
model, the existing card composition (beyond swapping in new motion
primitives), the push notification system, or the open-rounds feature
beyond swapping their buttons/chips/skeletons.
