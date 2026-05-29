// Lightweight motion helpers — scroll reveal, parallax, count-up.
// All respect prefers-reduced-motion.
import { useEffect, useRef } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Global reveal: watches every .reveal element and adds .is-visible when it
 * scrolls into view. Call once on app mount. Re-scans on DOM changes so
 * async-rendered sections (Firestore data) get observed too.
 */
export function initReveal() {
  if (typeof window === 'undefined') return;
  if (prefersReduced()) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  const scan = () => document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
  scan();
  const mo = new MutationObserver(scan);
  mo.observe(document.body, { childList: true, subtree: true });
}

/** Parallax: translate an element on scroll. speed ~0.1–0.4 (fraction of scroll). */
export function useParallax(speed = 0.25) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return ref;
}

/** Count-up: animates an element's text from 0 → target when scrolled into view. */
export function useCountUp(target, { duration = 1600, suffix = '' } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const end = parseFloat(target) || 0;
    if (!el) return;
    if (prefersReduced()) { el.textContent = `${end}${suffix}`; return; }
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = `${Math.round(end * eased)}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, suffix]);
  return ref;
}
