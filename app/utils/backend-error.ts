/**
 * Turns the error of a fetch a page can't render without into the right
 * status, instead of letting the page render its empty state with a 200 —
 * that is how /en-us/projects ended up filed as a soft 404 in Search Console.
 *
 * - The backend answered 4xx: it is up and says the thing doesn't exist (DRF
 *   answers 404 "Invalid page." for a `?page=` past the end). That is this
 *   page's 404.
 * - Anything else (network error, timeout, 5xx): the backend is down. A 503
 *   (Retry-After is set in error.vue) tells crawlers to come back later,
 *   rather than dropping a URL that is actually fine.
 *
 * Pass the `error` of the fetch the page cannot render without.
 */
export const throwIfBackendDown = (error: unknown) => {
  if (!error) return;
  const status = (error as { statusCode?: number }).statusCode;
  if (status && status >= 400 && status < 500) {
    throw createError({
      statusCode: 404,
      statusMessage: "Not Found",
      fatal: true,
    });
  }
  throw createError({
    statusCode: 503,
    statusMessage: "Service Unavailable",
    fatal: true,
  });
};
