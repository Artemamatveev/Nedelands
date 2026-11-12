// Screen selection works with native scrolling, with or without GSAP.
(() => {
  const gsap = window.gsap;
  const hero = document.querySelector('.hero-art');
  if (!hero) return;
  const screens = [...hero.querySelectorAll('[data-preview-screen]')];
  const buttons = [...hero.querySelectorAll('[data-preview]')];
  const motionButton = document.getElementById('preview-motion');
  let motionEnabled = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selection = 0;
  const settleScreens = () => {
    if (!gsap) return;
    gsap.killTweensOf(screens);
    const selected = buttons.find(button => button.getAttribute('aria-pressed') === 'true')?.dataset.preview;
    for (const screen of screens) { screen.hidden = screen.dataset.previewScreen !== selected; screen.style.removeProperty('transform'); screen.style.removeProperty('opacity'); screen.style.removeProperty('z-index'); }
  };
  reduced.addEventListener('change', settleScreens);
  buttons.forEach(button => button.addEventListener('click', async () => {
    const request = ++selection;
    if (button.getAttribute('aria-pressed') === 'true') return;
    const screen = screens.find(image => image.dataset.previewScreen === button.dataset.preview);
    if (!screen) return;
    screen.loading = 'eager';
    try { await screen.decode(); } catch { return; }
    if (request !== selection) return;
    settleScreens();
    const previous = screens.find(image => !image.hidden);
    screen.hidden = false;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    if (gsap && !reduced.matches) {
      screen.style.zIndex = '2';
      gsap.fromTo(screen, { opacity: 0, scale: 1.008 }, {
        opacity: 1, scale: 1, duration: 0.55, ease: 'power2.inOut', clearProps: 'transform,opacity,zIndex',
        onComplete: () => { if (previous && previous !== screen) previous.hidden = true; }
      });
    } else if (previous && previous !== screen) previous.hidden = true;
  }));
  if (!gsap || !window.IntersectionObserver) return;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const media = gsap.matchMedia();
  const revealed = new WeakSet();
  let introPlayed = false;
  media.add('(prefers-reduced-motion: no-preference)', () => {
    let intro;
    if (!introPlayed && scrollY < 80 && !location.hash) {
      introPlayed = true;
      intro = gsap.timeline({ defaults: { duration: 0.85, ease: 'power3.out', clearProps: 'transform,opacity' } });
      intro.from('.hero-copy > *', { y: 22, opacity: 0, stagger: 0.08 }, 0)
        .from('.phone', { y: 48, rotation: 6, scale: 0.9, opacity: 0, duration: 1.2 }, 0.15)
        .from('.greeter > img', { y: 24, scale: 0.9, rotation: -6, opacity: 0, ease: 'power3.out', duration: 1.1 }, 0.45)
        .from('.greeter .bubble', { y: 12, scale: 0.97, opacity: 0 }, 0.8)
        .from('.preview-switch', { y: 12, opacity: 0 }, 0.95);
    }
    const floating = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
      .to('.phone-float', { y: -8, duration: 3.8 }, 0)
      .to('.greeter > img', { y: -5, rotation: -2, duration: 3.8 }, 0);
    let visible = false;
    const syncMotion = () => visible && motionEnabled && !document.hidden ? floating.play() : floating.pause();
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncMotion(); }, { threshold: 0.1 });
    visibility.observe(hero);
    document.addEventListener('visibilitychange', syncMotion);
    let scrollMotion;
    if (window.ScrollTrigger) {
      scrollMotion = gsap.fromTo('.phone-stage', { y: 0, rotation: 3 }, {
        y: matchMedia('(max-width:640px)').matches ? -38 : -90, rotation: -5, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.15 }
      });
    }
    let onPointer, resetTilt, stopTilt;
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      const tiltX = gsap.quickTo('.phone-float', 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const tiltY = gsap.quickTo('.phone-float', 'rotationY', { duration: 0.9, ease: 'power3.out' });
      stopTilt = () => { tiltX.tween.pause(); tiltY.tween.pause(); };
      onPointer = event => {
        if (!motionEnabled) return;
        const rect = hero.getBoundingClientRect();
        tiltX(-((event.clientY - rect.top) / rect.height - 0.5) * 10);
        tiltY(((event.clientX - rect.left) / rect.width - 0.5) * 14);
      };
      resetTilt = () => { tiltX(0); tiltY(0); };
      hero.addEventListener('pointermove', onPointer);
      hero.addEventListener('pointerleave', resetTilt);
    }
    const toggleMotion = () => {
      motionEnabled = !motionEnabled;
      motionButton.setAttribute('aria-pressed', String(motionEnabled));
      intro?.progress(1);
      syncMotion();
      if (motionEnabled) scrollMotion?.scrollTrigger.enable();
      else { scrollMotion?.scrollTrigger.disable(false); stopTilt?.(); }
    };
    if (motionButton) {
      motionButton.hidden = false;
      motionButton.setAttribute('aria-pressed', String(motionEnabled));
      motionButton.addEventListener('click', toggleMotion);
      if (!motionEnabled) scrollMotion?.scrollTrigger.disable(false);
    }
    const pending = new Map();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const el = entry.target;
        if (!entry.isIntersecting) continue;
        observer.unobserve(el);
        if (revealed.has(el)) continue;
        revealed.add(el);
        if (el.contains(document.activeElement) || location.hash === '#' + el.id || el.matches('#oefenvormen:hover')) continue;
        const cards = [...el.querySelectorAll('.ways > li, .pricing > .card')].filter(node => !node.hidden);
        const tween = gsap.from(cards.length ? cards : [el], {
          y: 24, opacity: 0, duration: 0.85, stagger: 0.075, ease: 'power3.out',
          clearProps: 'transform,opacity', onComplete: () => pending.delete(el)
        });
        pending.set(el, tween);
      }
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
    document.querySelectorAll('.stats, main > .block, .closing').forEach(el => observer.observe(el));
    const finishFocused = event => {
      if (hero.contains(event.target) || event.target.closest('.hero-copy')) intro?.progress(1);
      for (const [el, tween] of pending) if (el.contains(event.target)) tween.progress(1);
    };
    document.addEventListener('focusin', finishFocused);
    // A moving entrance must never carry a disclosure away from a stationary mouse.
    const finishFeatureHover = event => {
      const section = event.target.closest?.('#oefenvormen');
      if (section) pending.get(section)?.progress(1);
    };
    document.addEventListener('pointerover', finishFeatureHover);
    return () => {
      visibility.disconnect(); observer.disconnect();
      if (motionButton) { motionButton.hidden = true; motionButton.removeEventListener('click', toggleMotion); }
      document.removeEventListener('visibilitychange', syncMotion);
      document.removeEventListener('focusin', finishFocused);
      document.removeEventListener('pointerover', finishFeatureHover);
      if (onPointer) hero.removeEventListener('pointermove', onPointer);
      if (resetTilt) hero.removeEventListener('pointerleave', resetTilt);
      for (const tween of pending.values()) tween.progress(1).kill();
      pending.clear();
    };
  });
})();
