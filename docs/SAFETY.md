# HushHour Safety Architecture

Safety is the product moat, not a feature. HushHour is designed as bounded social support, not open-ended anonymous chat.

## Pillar 1: Identity and Bounding

- Verified `.edu` email only via magic link and server-side domain whitelist.
- 18+ attestation on first sign-in.
- Campus-bounded matching by default.
- No persistent identity; only hashed `.edu` identifier retained for bans.

## Pillar 2: Real-time AI Moderation

Every outbound message is moderated before recipient delivery.

- `SAFE`: pass through.
- `CRISIS`: pause chat, show crisis banner, route sender to professional resources.
- `ABUSE`: block message, warn sender, alert receiver.
- `PII`: redact before delivery.
- `INAPPROPRIATE`: warn first, block repeat.

Calibration: for `CRISIS` and `ABUSE`, false positives are preferred over false negatives.

## Pillar 3: Crisis Routing (Separate from Peer Match)

The crisis path never enters peer matching.

- Landing includes "I'm in crisis right now".
- One-tap links to 988, Crisis Text Line, Trevor Project, and campus counseling.
- Optional AI Safety Guide is listener-and-router, never a peer substitute.
- Automatic crisis routing triggers when moderation detects `CRISIS`.

## Pillar 4: Time Bounding

- 5-minute default chat.
- Mutual +5 minute extend at 4:30 (both must accept).
- 15-minute maximum.
- No re-match with same person.
- 60-minute cooldown between sessions.

## Pillar 5: Ephemeral by Design

- Messages live only in active memory and short-lived rows.
- Session rooms are wiped post-end.
- Stored: hash IDs, session metadata, moderation events with redacted snippets.
- Not stored: durable full chat transcripts.

## Pillar 6: Aftercare Every Time

Each session ends with:

- "How do you feel now?" quick check-in.
- Campus and national resources.
- Listener reciprocity CTA.
- Optional reflection based on moderation metadata only.

## Pillar 7: Reporting and Bans

- One-tap report button available throughout chat.
- Reports include moderation event history and minimal safety metadata.
- Severe abuse triggers immediate hash-based ban pending review.
- Repeat reports trigger escalating temporary/permanent bans.

## Pillar 8: Pre-Chat Safety Brief

First-time users must acknowledge:

1. HushHour is not therapy.
2. Crisis should route to 988/campus resources.
3. No contact info exchange; messages are moderated.
4. Tap to begin.

## Deliberate Non-Features

- No friend follow-ups.
- No read receipts.
- No streaks/gamification.
- No public feeds.
- No AI-primary replacement for human support.
- No mood scoring.
