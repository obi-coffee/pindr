// Canonical push-notification copy. Strings are verbatim from
// Pindr-Push-Notification-Plan.md §5. Do NOT paraphrase — the plan controls,
// this library serves it. If a new event is needed, add it to plan §5 first
// and then to this file.
//
// Each builder takes a typed event payload and returns { title, body,
// deepLink }. Bodies must stay ≤150 chars and titles ≤50 chars (§3).

export type PushCopy = {
  title: string;
  body: string;
  deepLink: string;
};

function firstName(displayName: string | null | undefined): string {
  const name = (displayName ?? '').trim();
  if (!name) return 'someone';
  return name.split(/\s+/)[0].toLowerCase();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

// §5.1 — New match
export function matchCopy(input: {
  otherDisplayName: string | null;
  matchId: string;
}): PushCopy {
  const other = firstName(input.otherDisplayName);
  return {
    title: 'you found your people.',
    body: `${other} locked in too. chat's open.`,
    deepLink: `pindr:///chat/${input.matchId}`,
  };
}

// §5.2 — New message
export function messageCopy(input: {
  senderDisplayName: string | null;
  messageBody: string;
  matchId: string;
}): PushCopy {
  const sender = firstName(input.senderDisplayName);
  const firstLine = input.messageBody.split('\n')[0] ?? '';
  return {
    title: sender,
    body: truncate(firstLine, 140),
    deepLink: `pindr:///chat/${input.matchId}`,
  };
}

// §5.3 — Round request received (host)
export function roundRequestCopy(input: {
  requesterDisplayName: string | null;
  courseName: string;
  teeTimeLabel: string; // e.g. "sat 7:20"
  seatsOpen: number;
  roundId: string;
}): PushCopy {
  const requester = firstName(input.requesterDisplayName);
  const seatsPhrase =
    input.seatsOpen === 1 ? '1 seat open' : `${input.seatsOpen} seats open`;
  return {
    title: `${requester} wants in on your round.`,
    body: `${input.teeTimeLabel} · ${input.courseName.toLowerCase()} · ${seatsPhrase}. tap to accept.`,
    deepLink: `pindr:///rounds/${input.roundId}?requests=1`,
  };
}

// §5.4 — Round request accepted (requester)
export function roundAcceptedCopy(input: {
  hostDisplayName: string | null;
  courseName: string;
  teeTimeLabel: string;
  roundId: string;
}): PushCopy {
  const host = firstName(input.hostDisplayName);
  return {
    title: "you're in.",
    body: `${host} locked you in. ${input.teeTimeLabel} at ${input.courseName.toLowerCase()}. pull up.`,
    deepLink: `pindr:///rounds/${input.roundId}`,
  };
}

// §5.5 — Round filled
export function roundFilledCopy(input: {
  courseName: string;
  teeTimeLabel: string;
  roundId: string;
}): PushCopy {
  return {
    title: "your foursome's full.",
    body: `${input.courseName.toLowerCase()}, ${input.teeTimeLabel}. group chat's open.`,
    deepLink: `pindr:///rounds/${input.roundId}`,
  };
}

// §5.6 — Round cancelled by host
export function roundCancelledCopy(input: {
  hostDisplayName: string | null;
  courseName: string;
  weekdayLabel: string; // e.g. "sat"
}): PushCopy {
  const host = firstName(input.hostDisplayName);
  return {
    title: `${input.courseName.toLowerCase()} ${input.weekdayLabel} is off.`,
    body: `${host} cancelled. other open rounds are in the rounds tab.`,
    deepLink: 'pindr:///rounds',
  };
}

// §5.7 — Round tomorrow (24h reminder)
export function roundTomorrowCopy(input: {
  courseName: string;
  teeTimeClockLabel: string; // e.g. "7:20"
  roundId: string;
}): PushCopy {
  return {
    title: `tomorrow at ${input.courseName.toLowerCase()}.`,
    body: `${input.teeTimeClockLabel} tee time. your foursome's set.`,
    deepLink: `pindr:///rounds/${input.roundId}`,
  };
}

// §5.8 — Round request declined (in-app only — NOT pushed; included for
// parity so the in-app notification surface can reuse this library).
export function roundDeclinedCopy(input: {
  hostDisplayName: string | null;
}): PushCopy {
  const host = firstName(input.hostDisplayName);
  return {
    title: '',
    body: `${host} passed on this one. other open rounds are up.`,
    deepLink: 'pindr:///rounds',
  };
}
