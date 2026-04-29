/* ═══════════════════════════════════════════════════════
   HERO CARDS — Fluid Dot Pagination
   Smooth elongating animation synced with scroll position.
   ═══════════════════════════════════════════════════════ */

(function () {
  const track = document.querySelector('.hero-cards-track');
  const dots  = document.querySelectorAll('.hero-dot');
  if (!track || dots.length === 0) return;

  const DOT_MIN   = 8;
  const DOT_MAX   = 28;
  const COLOR_OFF = '#d2d2d7';
  const COLOR_ON  = '#2969E5';

  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(h) { const v = parseInt(h.replace('#',''),16); return [(v>>16)&255,(v>>8)&255,v&255]; }
  function rgbToHex(r,g,b) { return '#'+[r,g,b].map(c=>Math.round(c).toString(16).padStart(2,'0')).join(''); }
  function lerpColor(a,b,t) { const [r1,g1,b1]=hexToRgb(a),[r2,g2,b2]=hexToRgb(b); return rgbToHex(lerp(r1,r2,t),lerp(g1,g2,t),lerp(b1,b2,t)); }

  // Robust step calculation based on actual DOM layout
  let step = 336;
  function calculateStep() {
    const cards = track.querySelectorAll('.hero-card');
    if (cards.length >= 2) {
      step = cards[1].offsetLeft - cards[0].offsetLeft;
    } else if (cards.length === 1) {
      step = cards[0].offsetWidth;
    }
  }

  calculateStep();
  window.addEventListener('resize', calculateStep);

  /* ── Fluid dots interpolation ── */
  function updateDots() {
    const progress = track.scrollLeft / step;

    dots.forEach((dot, i) => {
      // Force disable CSS transitions so JS can animate smoothly in real-time
      dot.style.setProperty('transition', 'none', 'important');

      const distance = Math.abs(progress - i);
      const t = Math.max(0, 1 - distance);

      dot.style.width      = lerp(DOT_MIN, DOT_MAX, t) + 'px';
      dot.style.background = lerpColor(COLOR_OFF, COLOR_ON, t);
    });
  }

  /* ── Scroll listener ── */
  let ticking = false;
  track.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateDots();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ── Dot click ── */
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      const index = parseInt(this.dataset.index, 10);
      if (isNaN(index)) return;
      
      track.scrollTo({
        left: index * step,
        behavior: 'smooth'
      });
    });
  });

  // Initial state
  setTimeout(() => {
    calculateStep();
    updateDots();
  }, 50);
})();
