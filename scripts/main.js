/* ═══════════════════════════════════════════════════════
   ALIDA HEALTH — Main JavaScript
   Animations, scroll effects, and interactivity
   ═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initChartBars();
  initSmoothScroll();
  initCtaForm();
  initCounterAnimation();
});

/* ── Navbar Scroll Effect ── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ── Mobile Menu ── */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const overlay = document.getElementById('mobileMenu');
  const navbar = document.getElementById('navbar');

  if (!toggle || !overlay) return;

  function openMenu() {
    toggle.classList.add('active');
    overlay.classList.add('open');
    navbar.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    toggle.classList.remove('active');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      // Only remove menu-open if it wasn't re-opened quickly
      if (!overlay.classList.contains('open')) {
        navbar.classList.remove('menu-open');
      }
    }, 500);
  }

  toggle.addEventListener('click', () => {
    if (toggle.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking a link inside overlay
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* ── Scroll Reveal (Intersection Observer) ── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ── Dashboard Chart Bars ── */
function initChartBars() {
  const container = document.getElementById('chartBars');
  if (!container) return;

  const data = [
    { blue: 65, green: 30 },
    { blue: 80, green: 45 },
    { blue: 55, green: 25 },
    { blue: 90, green: 55 },
    { blue: 70, green: 40 },
    { blue: 85, green: 50 },
    { blue: 60, green: 35 },
    { blue: 95, green: 60 },
    { blue: 75, green: 45 },
    { blue: 88, green: 52 },
  ];

  data.forEach((item, index) => {
    const group = document.createElement('div');
    group.className = 'chart-bar-group';

    const blueBar = document.createElement('div');
    blueBar.className = 'chart-bar blue';
    blueBar.style.height = '0%';

    const greenBar = document.createElement('div');
    greenBar.className = 'chart-bar green';
    greenBar.style.height = '0%';

    group.appendChild(blueBar);
    group.appendChild(greenBar);
    container.appendChild(group);

    // Animate after a short delay
    setTimeout(() => {
      blueBar.style.height = item.blue + '%';
      greenBar.style.height = item.green + '%';
    }, 800 + (index * 80));
  });
}

/* ── Smooth Scroll ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      const navHeight = document.getElementById('navbar')?.offsetHeight || 0;
      // Subtract an extra 24px for breathing room below the header
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 24;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/* ── CTA Form Interaction ── */
function initCtaForm() {
  const button = document.getElementById('ctaButton');
  const input = document.getElementById('ctaEmail');

  if (!button || !input) return;

  button.addEventListener('click', (e) => {
    e.preventDefault();
    const email = input.value.trim();

    if (!email) {
      input.style.borderColor = '#ff5f56';
      input.placeholder = 'Ingresa tu email...';
      setTimeout(() => {
        input.style.borderColor = '';
        input.placeholder = 'tu@email.com';
      }, 2000);
      return;
    }

    if (!isValidEmail(email)) {
      input.style.borderColor = '#ff5f56';
      setTimeout(() => {
        input.style.borderColor = '';
      }, 2000);
      return;
    }

    // Success state
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ¡Enviado!
    `;
    button.style.pointerEvents = 'none';
    input.value = '';
    input.placeholder = '¡Te contactaremos pronto!';
    input.disabled = true;
    input.style.borderColor = 'var(--color-accent)';

    setTimeout(() => {
      button.innerHTML = `
        Solicitar Demo
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      `;
      button.style.pointerEvents = '';
      input.disabled = false;
      input.placeholder = 'tu@email.com';
      input.style.borderColor = '';
    }, 3000);
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Counter Animation for Stats ── */
function initCounterAnimation() {
  const stats = document.querySelectorAll('.stat-number');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
  const text = element.textContent;
  const hasPlus = text.includes('+');
  const hasPercent = text.includes('%');
  const numericValue = parseFloat(text.replace(/[^0-9.]/g, ''));

  if (isNaN(numericValue)) return;

  const isDecimal = numericValue % 1 !== 0;
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = numericValue * eased;

    let displayValue;
    if (isDecimal) {
      displayValue = current.toFixed(1);
    } else {
      displayValue = Math.floor(current).toString();
    }

    if (hasPlus) displayValue += '+';
    if (hasPercent) displayValue += '%';

    element.textContent = displayValue;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ── Parallax for Hero Orbs ── */
window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset;
  const orbs = document.querySelectorAll('.hero-orb');

  orbs.forEach((orb, index) => {
    const speed = 0.05 * (index + 1);
    orb.style.transform = `translateY(${scrollY * speed}px)`;
  });
}, { passive: true });
