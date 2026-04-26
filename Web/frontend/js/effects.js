/* ═════════════════════════
   PARTICLES
   ═════════════════════════ */
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const PARTICLE_COUNT = 30;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 10;
    const opacity = Math.random() * 0.4 + 0.1;

    const colors = ['#e52d27', '#f97316', '#f59e0b', '#2563eb', '#8b5cf6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${x}%;
      top: ${y}%;
      opacity: ${opacity * 0.6};
      animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
      pointer-events: none;
    `;

    container.appendChild(particle);
  }

  // Add keyframes
  if (!document.getElementById('particle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'particle-keyframes';
    style.textContent = `
      @keyframes particleFloat {
        0%, 100% {
          transform: translate(0, 0) scale(1);
          opacity: var(--opacity, 0.2);
        }
        25% {
          transform: translate(${Math.random() > 0.5 ? '' : '-'}30px, -40px) scale(1.2);
        }
        50% {
          transform: translate(${Math.random() > 0.5 ? '' : '-'}20px, -80px) scale(0.8);
          opacity: calc(var(--opacity, 0.2) * 1.5);
        }
        75% {
          transform: translate(${Math.random() > 0.5 ? '' : '-'}40px, -40px) scale(1.1);
        }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
    `;
    document.head.appendChild(style);
  }
}

/* ═════════════════════════
   SCROLL EFFECTS
   ═════════════════════════ */
function initScrollEffects() {
  const navBar = document.querySelector('.nav-bar');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Nav bar background
    if (navBar) {
      navBar.classList.toggle('is-scrolled', scrollY > 50);
    }
  }, { passive: true });

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.6s ease forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and stat items
  document.querySelectorAll('.card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    observer.observe(el);
  });
}

/* ═════════════════════════
   COUNT UP ANIMATIONS
   ═════════════════════════ */
function initCountUpAnimations() {
  const statValues = document.querySelectorAll('.stat-item__value');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateValue(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statValues.forEach(el => observer.observe(el));
}

function animateValue(el) {
  const endText = el.textContent;
  const numMatch = endText.match(/[\d,]+\.?\d*/);
  if (!numMatch) return;

  const endNum = parseFloat(numMatch[0].replace(/,/g, ''));
  const prefix = endText.substring(0, endText.indexOf(numMatch[0]));
  const suffix = endText.substring(endText.indexOf(numMatch[0]) + numMatch[0].length);
  const hasComma = numMatch[0].includes(',');
  const hasDecimal = numMatch[0].includes('.');
  const decimalPlaces = hasDecimal ? numMatch[0].split('.')[1].length : 0;

  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

    let currentNum = endNum * eased;
    let formatted;

    if (hasDecimal) {
      formatted = currentNum.toFixed(decimalPlaces);
    } else {
      formatted = Math.floor(currentNum).toString();
    }

    if (hasComma) {
      formatted = Number(formatted).toLocaleString();
    }

    el.textContent = prefix + formatted + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
