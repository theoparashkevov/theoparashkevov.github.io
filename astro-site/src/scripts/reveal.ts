let observer: IntersectionObserver | undefined;

function applyStagger(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((group) => {
    const step = Number(group.dataset.revealStagger) || 80;
    group.querySelectorAll<HTMLElement>(':scope > [data-reveal]').forEach((child, index) => {
      if (!child.style.getPropertyValue('--reveal-delay')) {
        child.style.setProperty('--reveal-delay', `${index * step}ms`);
      }
    });
  });
}

export function initReveal() {
  observer?.disconnect();
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  applyStagger(document);
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  targets.forEach((el) => observer?.observe(el));
}
