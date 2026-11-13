// iOS displays a static launch image before its web view can run any animation.
// Match the current device instead of shipping dozens of full-screen PNGs.
// https://web.dev/learn/pwa/enhancements#splash_screens
(() => {
  if (typeof navigator.standalone === 'undefined') return;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const dark = matchMedia('(prefers-color-scheme:dark)');
  const image = document.createElement('img');
  image.alt = '';
  image.src = motion.matches ? '/art/bittie-loading-v1.webp' : '/art/bittie-dance-v4.svg';
  let scheduled = false;
  function paint() {
    scheduled = false;
    if (!image.naturalWidth) return;
    const width = screen.width, height = screen.height, ratio = devicePixelRatio || 1;
    if (!width || !height) return;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(ratio, ratio);
    const bg = dark.matches ? '#1D2436' : '#FBFCFE';
    const ink = dark.matches ? '#EEF1F7' : '#14213D';
    const soft = dark.matches ? '#9EA7BA' : '#56617C';
    const size = Math.min(width * .62, 240), top = (height - size - 108) / 2;
    context.fillStyle = bg; context.fillRect(0, 0, width, height);
    context.drawImage(image, (width - size) / 2, top, size, size);
    context.textAlign = 'center'; context.fillStyle = ink;
    context.font = '700 28px -apple-system, system-ui, sans-serif';
    context.fillText('Bittertalen', width / 2, top + size + 38);
    context.fillStyle = soft; context.font = '15px -apple-system, system-ui, sans-serif';
    const lang = document.documentElement.lang?.split('-')[0] || 'nl';
    const labels = {nl:'Laden…',en:'Loading…',ar:'جارٍ التحميل…',tr:'Yükleniyor…',hi:'लोड हो रहा है…',zh:'加载中…',es:'Cargando…',ru:'Загрузка…'};
    context.fillText(labels[lang] || labels.nl, width / 2, top + size + 72);
    const link = document.getElementById('ios-startup-image') || document.createElement('link');
    link.id = 'ios-startup-image'; link.rel = 'apple-touch-startup-image';
    link.href = canvas.toDataURL('image/png');
    if (!link.isConnected) document.head.appendChild(link);
    canvas.width = canvas.height = 0;
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true; requestAnimationFrame(paint);
  }
  image.addEventListener('load', schedule, {once:true});
  if (image.complete && image.naturalWidth) schedule();
  dark.addEventListener('change', schedule);
  addEventListener('orientationchange', schedule);
})();
