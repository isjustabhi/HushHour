# HushHour Privacy Overview

## What We Store

- `edu_hash` (SHA-256 of normalized `.edu` email)
- session metadata (timing, duration, vibe tag, end reason)
- moderation events (classification, action, confidence, short redacted snippet)
- optional journal theme summaries (metadata-derived)

## What We Do Not Store

- plain-text `.edu` emails in product tables
- persistent full conversation transcripts
- analytics containing message body text

## Retention

- queue rows: short TTL expiry
- messages: ephemeral + post-session TTL cleanup
- moderation and report data: retained for safety review
- journal entries: user-owned and private

## Access Controls

- Row Level Security enabled on core tables
- users can access only their own records or sessions they participate in
- report/journal inserts restricted to authenticated owner context

## Analytics Scope

Tracked events are behavioral counters and safety classes only, e.g.:

- button tap
- match found latency
- moderation class label
- session end reason
- report filed

No message content is sent to analytics.
