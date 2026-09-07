import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface FadeUpOptions {
  /** Travel distance in px. */
  y?: number;
  /** Tween duration in seconds. */
  duration?: number;
  /** ScrollTrigger start offset. */
  start?: string;
  /** Selector for the elements to animate. */
  selector?: string;
}

/**
 * Scroll-triggered "fade up" entrance used by every list/marketing page.
 *
 * Two things this centralises beyond de-duplicating the five copies that used
 * to live inline in the pages:
 *
 * 1. `prefers-reduced-motion` — the tween sets `opacity: 0` from JS, so a CSS
 *    `@media (prefers-reduced-motion)` rule cannot undo it. Users who ask for
 *    reduced motion must never get the tween registered at all, otherwise the
 *    content animates regardless (WCAG 2.3.3 / 2.2.2).
 * 2. It is client-only and self-cleaning — ScrollTrigger instances created on
 *    one route were previously left behind on navigation.
 */
export const useFadeUp = (options: FadeUpOptions = {}) => {
  const {
    y = 32,
    duration = 0.6,
    start = "top 92%",
    selector = ".fade-up",
  } = options;

  onMounted(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Bail out entirely: leave the markup at its natural, fully visible state.
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const triggers: ScrollTrigger[] = [];
    gsap.utils.toArray<HTMLElement>(selector).forEach((element) => {
      const tween = gsap.from(element, {
        y,
        opacity: 0,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: element, start, once: true },
      });
      const st = tween.scrollTrigger;
      if (st) triggers.push(st);
    });

    onBeforeUnmount(() => {
      triggers.forEach((t) => t.kill());
    });
  });
};
