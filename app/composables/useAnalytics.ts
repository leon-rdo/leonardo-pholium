/**
 * Thin dataLayer bridge for GTM custom events. The GTM container maps these
 * pushes to GA4 events (see tags "GA4 — contact_form_submit", "GA4 —
 * post_share", "GA4 — newsletter_subscribe"), so event names here must match
 * the container's customEvent triggers: `contact_form_submit`,
 * `newsletter_subscribe`, `post_share`.
 *
 * Outside production the GTM snippet isn't injected — pushes land in a
 * plain array nobody consumes, so calls are always safe.
 */
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export const useAnalytics = () => {
  const trackEvent = (
    event: string,
    params: Record<string, unknown> = {}
  ) => {
    if (import.meta.server) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  };

  return { trackEvent };
};
