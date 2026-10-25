/**
 * When the Django backend is unreachable, a page that renders its empty state
 * still answers 200 — that is how /en-us/projects ended up filed as a soft 404
 * in Search Console — and a detail page that can't find its record answers
 * 404, which makes Google drop a URL that is actually fine. A 503 (with the
 * Retry-After set in error.vue) tells crawlers to come back later instead.
 *
 * Pass the `error` of the fetch the page cannot render without.
 */
export const throwIfBackendDown = (error: unknown) => {
  if (!error) return;
  throw createError({
    statusCode: 503,
    statusMessage: "Service Unavailable",
    fatal: true,
  });
};
