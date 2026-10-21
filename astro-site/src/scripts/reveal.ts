import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

const SELECTOR = '[data-reveal]';
const STAGGER_ATTR = 'data-reveal-stagger';
const REVEALED = 'is-revealed';
const DONE = 'reveal-done';
const READY = 'reveal-ready';
const FAILSAFE_MS = 2500;
const DEFAULT_STEP = 80;
const MAX_STAGGER_STEPS = 8;
const SETTLE_GRACE_MS = 1200;

let observer: IntersectionObserver | undefined;
let observed = new WeakSet<Element>();
let scannedBody: HTMLElement | undefined;
let isSetUp = false;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pendingTargets(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(`${SELECTOR}:not(.${REVEALED})`));
}

function settle(el: HTMLElement) {
  el.classList.add(REVEALED, DONE);
  el.style.removeProperty('--reveal-stagger-delay');
}

function parseMs(value: string): number {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return value.trim().endsWith('ms') ? n : n * 1000;
}

function reveal(el: HTMLElement, batchIndex: number) {
  let delay = parseMs(el.style.getPropertyValue('--reveal-delay'));
  const parent = el.parentElement;
  if (!delay && parent?.hasAttribute(STAGGER_ATTR)) {
    const step = Number(parent.getAttribute(STAGGER_ATTR)) || DEFAULT_STEP;
    delay = Math.min(batchIndex, MAX_STAGGER_STEPS) * step;
    el.style.setProperty('--reveal-stagger-delay', `${delay}ms`);
  }

  let timer = 0;
  const finish = () => {
    window.clearTimeout(timer);
    el.removeEventListener('transitionend', onEnd);
    settle(el);
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === el && event.propertyName === 'opacity') finish();
  };
  el.addEventListener('transitionend', onEnd);
  timer = window.setTimeout(finish, delay + SETTLE_GRACE_MS);
  el.classList.add(REVEALED);
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  const batch = new Map<Element | null, number>();
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target as HTMLElement;
    observer?.unobserve(el);
    const parent = el.parentElement;
    const index = batch.get(parent) ?? 0;
    batch.set(parent, index + 1);
    reveal(el, index);
  }
}

function inViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function teardown() {
  observer?.disconnect();
  observer = undefined;
  observed = new WeakSet();
}

/**
 * Observes every `[data-reveal]` element of the current page that is not yet
 * revealed. Safe to call repeatedly (e.g. after inserting content): elements
 * are observed once and a single observer is shared.
 */
export function initReveal() {
  document.documentElement.classList.add(READY);
  scannedBody = document.body;
  const targets = pendingTargets();
  if (!targets.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach(settle);
    return;
  }

  observer ??= new IntersectionObserver(onIntersect, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0,
  });
  for (const el of targets) {
    if (observed.has(el)) continue;
    observed.add(el);
    observer.observe(el);
  }
}

function onBeforeSwap(event: Event) {
  teardown();
  (event as TransitionBeforeSwapEvent).newDocument.documentElement.classList.add(READY);
}

function onAfterSwap() {
  document.documentElement.classList.add(READY);
  const reduced = prefersReducedMotion();
  for (const el of pendingTargets()) {
    if (reduced || inViewport(el)) settle(el);
  }
}

function onPageLoad() {
  if (document.body !== scannedBody) initReveal();
}

/**
 * Wires reveal into the page lifecycle once: runs immediately for the first
 * page, reveals in-view content synchronously after each client-side swap (so
 * view-transition snapshots never capture hidden content), and re-observes on
 * astro:page-load.
 */
export function setupReveal() {
  if (isSetUp) return;
  isSetUp = true;

  if (performance.now() > FAILSAFE_MS - 200) {
    pendingTargets().forEach(settle);
  }
  initReveal();

  document.addEventListener('astro:before-swap', onBeforeSwap);
  document.addEventListener('astro:after-swap', onAfterSwap);
  document.addEventListener('astro:page-load', onPageLoad);
}
