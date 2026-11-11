// Progressive enhancement: the page stays visible without GSAP or motion support.
(() => {
  const gsap = window.gsap;
  if (!gsap || !window.IntersectionObserver) return;
  const revealed = new WeakSet();
  let introPlayed = false;
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const introTargets = [...document.querySelectorAll('.hero-copy > *, .phone, .greeter > img, .greeter .bubble')];
    let intro;
    if (!introPlayed && window.scrollY < 80 && !location.hash) {
      introPlayed = true;
      intro = gsap.timeline({ defaults: { duration: 0.65, ease: 'power3.out', clearProps: 'transform,opacity' } });
      intro.from('.hero-copy > *', { y: 16, opacity: 0, stagger: 0.065 }, 0)
        .from('.phone', { y: 26, rotation: 2, opacity: 0, duration: 0.85 }, 0.08)
        .from('.greeter > img', { y: 18, scale: 0.9, rotation: -6, opacity: 0, transformOrigin: '50% 100%', clearProps: 'transform,opacity,transformOrigin' }, 0.22)
        .from('.greeter .bubble', { y: 8, scale: 0.97, opacity: 0 }, 0.47);
    }

    const pending = new Map();
    // Only animate a section once it enters the viewport; nothing is hidden while waiting.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const el = entry.target;
        if (!entry.isIntersecting) continue;
        observer.unobserve(el);
        if (revealed.has(el)) continue;
        revealed.add(el);
        // Keyboard navigation and direct anchor links keep their targets immediately visible.
        if (el.contains(document.activeElement) || location.hash === '#' + el.id) continue;
        const cards = [...el.querySelectorAll('.ways > li, .pricing > .card')].filter(node => !node.hidden);
        const targets = cards.length ? cards : [el];
        const tween = gsap.from(targets, {
          y: 18, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out',
          clearProps: 'transform,opacity', onComplete: () => pending.delete(el)
        });
        pending.set(el, tween);
      }
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('.stats, main > .block, .closing').forEach(el => observer.observe(el));
    const finishFocused = event => {
      if (introTargets.some(el => el.contains(event.target))) intro?.progress(1);
      for (const [el, tween] of pending) if (el.contains(event.target)) tween.progress(1);
    };
    document.addEventListener('focusin', finishFocused);
    return () => {
      observer.disconnect();
      for (const tween of pending.values()) tween.progress(1).kill();
      pending.clear();
      document.removeEventListener('focusin', finishFocused);
    };
  });
})();
