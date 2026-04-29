/* ═══════════════════════════════════════════════════════
   TESTIMONIALS — Fluid Dot Pagination
   Smooth elongating animation synced with scroll position.
   ═══════════════════════════════════════════════════════ */

(function () {
  const wrapper = document.querySelector('.testimonials-carousel-wrapper');
  const dots    = document.querySelectorAll('.tc-dot');
  const cards   = document.querySelectorAll('.testimonial-card');
  if (!wrapper || !dots.length || !cards.length) return;

  const DOT_MIN   = 8;
  const DOT_MAX   = 28;
  const COLOR_OFF = '#d2d2d7';
  const COLOR_ON  = '#2969E5';

  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(h) { const v = parseInt(h.replace('#',''),16); return [(v>>16)&255,(v>>8)&255,v&255]; }
  function rgbToHex(r,g,b) { return '#'+[r,g,b].map(c=>Math.round(c).toString(16).padStart(2,'0')).join(''); }
  function lerpColor(a,b,t) { const [r1,g1,b1]=hexToRgb(a),[r2,g2,b2]=hexToRgb(b); return rgbToHex(lerp(r1,r2,t),lerp(g1,g2,t),lerp(b1,b2,t)); }

  // Robust step calculation based on actual DOM layout
  let step = 316;
  function calculateStep() {
    if (cards.length >= 2) {
      step = cards[1].offsetLeft - cards[0].offsetLeft;
    } else if (cards.length === 1) {
      step = cards[0].offsetWidth;
    }
  }
  
  // Calculate on load and resize
  calculateStep();
  window.addEventListener('resize', calculateStep);

  /* ── Fluid dots interpolation ── */
  function updateDots() {
    const progress = wrapper.scrollLeft / step;

    dots.forEach((dot, i) => {
      // Force disable CSS transitions so JS can animate smoothly in real-time
      dot.style.setProperty('transition', 'none', 'important');
      
      const distance = Math.abs(progress - i);
      const t = Math.max(0, 1 - distance); // t is 1 when centered, 0 when far away

      dot.style.width      = lerp(DOT_MIN, DOT_MAX, t) + 'px';
      dot.style.background = lerpColor(COLOR_OFF, COLOR_ON, t);
    });
  }

  /* ── In-view highlighting ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('in-view', entry.intersectionRatio >= 0.5);
    });
  }, {
    root: wrapper,
    threshold: [0, 0.5, 1]
  });
  cards.forEach(card => observer.observe(card));

  /* ── Scroll listener ── */
  let ticking = false;
  wrapper.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateDots();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ── Dot click ── */
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      wrapper.scrollTo({
        left: i * step,
        behavior: 'smooth'
      });
    });
  });

  // Initial render
  // Slight delay to ensure DOM is fully laid out for calculateStep
  setTimeout(() => {
    calculateStep();
    updateDots();
  }, 50);
})();
