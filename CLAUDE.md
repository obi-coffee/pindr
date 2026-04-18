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

Supabase client is already initialized at `lib/supabase.ts`. Environment
variables live in `.env` (gitignored) with the `EXPO_PUBLIC_` prefix.

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
matches, messages, reports, travel_sessions. See the project plan for full
schema. Location columns use `geography(point, 4326)` with PostGIS.

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
Swing video uploads, tee-time booking integration, GHIN handicap
verification, photo/selfie verification, group rounds, push notifications,
subscriptions, pro/coach profile type, post-round reviews. Do not build
these without explicit approval, even if they seem small.

## Where we are right now
Phase 0 is complete: Expo + TypeScript scaffold running, Supabase project
provisioned, client initialized at `lib/supabase.ts`, env vars in place,
repo pushed to GitHub.

## Your first task (Phase 1)
Phase 1: authentication and app shell. Before writing any code, walk the
user through your plan in plain English:
- What auth methods we're enabling (phone OTP + email/password)
- What files you'll create or change
- What the user will see on screen at the end of this phase
- Which parts of the Supabase dashboard the user needs to touch (e.g.,
  enabling phone provider) and what exact setting to flip

Wait for the user's approval before writing code. When you do write code,
do it in small, reviewable chunks — show the user one screen or one
concept working end-to-end before moving to the next.
