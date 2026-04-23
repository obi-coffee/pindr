---
title: Pindr Privacy Policy
---

# Privacy Policy

_Last updated: April 23, 2026_

Pindr is a swipe-based matching app that helps solo golfers find
compatible playing partners. This policy explains what data we
collect, why, and what your rights are.

If you have a question we don't answer here, email
**obi@obiekweokolo.com**.

---

## Who we are

Pindr is built and operated by Obi Ekweokolo as an independent
project. You can reach us at obi@obiekweokolo.com.

## Who can use Pindr

Pindr is intended for people **18 years of age and older**. We do not
knowingly collect information from anyone under 18. If we learn that
we've collected data from someone under 18, we'll delete it.

---

## What we collect

When you sign up and use Pindr, we collect the following, all of which
is necessary to make the app work:

**Account basics**
- Email address (for sign-in and account recovery)
- A password, stored as a hash (we never see your actual password)

**Profile**
- Display name, age, gender, pronouns, short bio
- Handicap (optional) and years playing
- Playing-style preferences: pace, walking vs. riding, 9 vs. 18
  holes, betting comfort, drinks comfort, teaching mindset, etc.
- Home city and home course (optional)
- Photos you upload to your profile
- Outside interests you tag

**Location**
- A city-level home location you set on your profile. This is a
  geographic coordinate, stored to a precision of roughly a city
  block, used to surface nearby matches.
- An optional travel location when you enable Travel Mode, used for
  the duration you specify.
- Pindr does **not** track your real-time GPS location in the
  background. We only read your coordinates when you tap a "use my
  location" button inside the app.

**Activity**
- Swipes you make (right / left / super) on other profiles
- Mutual matches that result from those swipes
- Messages you send in chat threads with your matches
- Open rounds you post and round requests you send or receive
- Reports you file against other users (for trust & safety review)
- Users you block

**Notifications**
- An Expo push token per device so we can deliver push notifications
  when matches, messages, or round events happen
- Your notification preferences (which categories you've opted into,
  your quiet-hours window, your timezone)
- A log of push notifications we attempt to send to you (for rate
  limiting, delivery troubleshooting, and the in-app history if we
  ever add one)

We do **not** collect: your contacts, your call history, your web
browsing history, your real-time GPS position, or any data from other
apps on your device.

---

## How we use it

We use the data above to:

- Let you sign in to your account.
- Show you relevant matches nearby (or near your travel location).
- Deliver messages between you and your matches.
- Send push notifications for events you've opted into.
- Enforce the rate limits and quiet hours in our notification system.
- Respond to reports, enforce our community guidelines, and remove
  users who violate them.
- Debug problems when the app breaks.

We do **not** use your data to train AI models, sell to third parties,
show ads, or build behavioral profiles for purposes beyond making the
app work.

---

## Where we store it

Pindr stores data with **Supabase**, a hosted Postgres backend that
acts as our database, authentication provider, and file storage for
photos. Supabase hosts data in the United States.

We use **Expo's push notification service** (run by Expo, Inc.) to
relay push notifications to Apple and Google. Expo receives the push
token and the notification payload at delivery time but does not
retain message history.

We do not share your data with any other third party.

---

## Your rights

You can, at any time:

- **See your data.** Your profile, matches, messages, and settings
  are all visible inside the app.
- **Edit your profile.** Use the Edit profile flow to change any
  field.
- **Disable push notifications.** In Settings → Notifications, toggle
  off any category, or set quiet hours. You can also revoke push
  permission entirely in iOS Settings.
- **Block or report another user.** Use the overflow menu on any
  profile or chat thread.
- **Delete your account.** Email obi@obiekweokolo.com from the
  address you signed up with. We'll delete your account, profile,
  photos, swipes, matches, and messages within 14 days. Backup copies
  age out of our provider's retention within 30 days.
- **Request a copy of your data.** Email the same address. We'll
  send a machine-readable export within 30 days.

If you're in a jurisdiction with formal data-privacy rights (such as
the EU under GDPR or California under CCPA), you have the additional
rights that law provides, including the right to object to
processing, the right to data portability, and the right to lodge a
complaint with a supervisory authority. Email the address above and
we'll handle the request.

---

## Data retention

We keep your account data while your account is active. If you delete
your account, we delete your data within 14 days (with up to 30 days
of backup retention at our provider).

Reports you file are kept indefinitely in aggregate form (the fact
that a report existed, its reason, and the outcome) even after your
account is deleted, because that history is how trust & safety
reviews work over time. The specific report content is scrubbed of
identifiers along with your other data.

---

## Security

Data in transit is encrypted via HTTPS. Data at rest in Supabase is
encrypted by the provider. Passwords are stored as bcrypt hashes; we
never handle your plaintext password.

No system is perfectly secure. If we ever learn of a breach that
affects you, we'll notify you by email.

---

## Changes to this policy

If we change this policy in a way that materially affects how we use
your data, we'll update the "Last updated" date at the top and notify
active users inside the app or by email before the change takes
effect.

---

## Contact

Questions, requests, or complaints go to
**obi@obiekweokolo.com**.
