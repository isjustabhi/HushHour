"use client";

import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    persistence: "memory",
    autocapture: false,
  });
  initialized = true;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  initAnalytics();
  if (!initialized) return;
  posthog.capture(event, properties);
}
