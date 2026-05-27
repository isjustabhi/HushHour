# HushHour - UX Research Memo

## 1) Problem

Campus loneliness is frequent, high-friction, and under-served in the moment. Students often need immediate human presence, not long-form intake.

## 2) Interview Snapshot (Pilot)

Pilot interviews (n=8, 3 campuses):

- 7/8 reported loneliness in the previous week
- 5/8 would not book counseling for that moment
- 6/8 said they would use an anonymous one-tap support flow
- 8/8 said safety controls were non-negotiable

## 3) Journey Trace

Persona: Jordan, sophomore

- T+0s: Opens app, sees one clear CTA
- T+10s: Taps, selects a vibe
- T+24s: Matched on same campus
- T+5:00: Session ends, aftercare shown
- T+7 days: Returns; opts into listener role

## 4) UX Trade-offs

| Shipped | Cut + Why |
|---|---|
| 5-minute default | Open-ended sessions risk dependency |
| No identity layer | Profiles undermine anonymous safety |
| AI moderation before delivery | Post-hoc reporting is too late for harm prevention |
| Crisis path isolated from peer queue | Mixed routing creates safety ambiguity |
| Campus-bounded matching | Global pool lowers trust and increases risk |

## 5) Moderation Accuracy (Current Baseline)

Pending final calibration run (200-message eval set).  
Current implementation captures moderation class/action and confidence for auditing; final precision/recall values should be inserted pre-submission.

Planned report fields:

- CRISIS precision / recall
- PII precision / recall
- ABUSE precision / recall
- p50 moderation latency

## 6) Safety Verification Evidence

- Message TTL and queue expiry enabled
- Crisis routing path bypasses peer matching
- Ban action path wired through abuse-linked report flow
- Aftercare shown at session completion

## 7) Deliberate Non-Features

- No friend add/follow-up loop
- No read receipts
- No streaks, badges, or engagement gamification
- No public feeds
- No AI replacing human primary support
- No mood scoring/profiling

## 8) Privacy Posture

- `.edu` identifiers stored as SHA-256 hash
- No durable full message transcript retention
- Moderation logs store class/action and brief redacted snippets
- Analytics events exclude message content

## 9) Next Research Steps

- Run 200-message moderation benchmark before submission
- Conduct 15-user wait-time and aftercare usefulness test
- A/B copy test for safety brief and crisis CTA clarity
