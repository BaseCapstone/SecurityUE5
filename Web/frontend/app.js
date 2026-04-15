/* ═══════════════════════════════════════════════════
   LYRA SHIELD — App Logic
   Hero Slider, Nav, Modal, Game Launch
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  initNavigation();
  initLoginModal();
  initGameLaunch();
  initParticles();
  initScrollEffects();
  initCountUpAnimations();
});

/* ═════════════════════════
   HERO SLIDER
   ═════════════════════════ */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero__slide');
  const indicators = document.querySelectorAll('.hero__indicator');
  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');
  let currentSlide = 0;
  let autoPlayTimer = null;
  const INTERVAL = 5000;

  function goToSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    indicators.forEach(i => i.classList.remove('active'));

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(nextSlide, INTERVAL);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  // Event listeners
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoPlay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoPlay(); });

  indicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      const idx = parseInt(indicator.dataset.slide);
      goToSlide(idx);
      startAutoPlay();
    });
  });

  // Touch support
  const slider = document.getElementById('hero-slider');
  if (slider) {
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoPlay();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextSlide() : prevSlide();
      }
      startAutoPlay();
    }, { passive: true });
  }

  startAutoPlay();
}

/* ═════════════════════════
   NAVIGATION
   ═════════════════════════ */
function initNavigation() {
  const menuToggle = document.getElementById('menu-toggle');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');
  const navLinks = document.querySelectorAll('.nav-link');

  function openMobileNav() {
    if (overlay) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileNav() {
    if (overlay) {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  if (menuToggle) menuToggle.addEventListener('click', openMobileNav);
  if (closeBtn) closeBtn.addEventListener('click', closeMobileNav);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeMobileNav();
    });
  }

  // Active nav link
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Mobile nav links close menu
  const mobileLinks = document.querySelectorAll('.mobile-nav__links a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });

  // Keyboard escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });
}

/* ═════════════════════════
   LOGIN MODAL
   ═════════════════════════ */
function initLoginModal() {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const modal = document.getElementById('login-modal');
  const closeBtn = document.getElementById('modal-close');
  const form = document.getElementById('login-form');

  function openModal() {
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      const firstInput = modal.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 300);
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', openModal);
  if (registerBtn) registerBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('login-id').value;
      const pw = document.getElementById('login-pw').value;

      if (!id || !pw) {
        shakeElement(form);
        return;
      }

      // Simulate login
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.textContent = '로그인 중...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = '로그인';
        submitBtn.disabled = false;
        closeModal();
        showToast('로그인 성공! 환영합니다.', 'success');
        updateLoginState(id);
      }, 1500);
    });
  }
}

function shakeElement(el) {
  el.style.animation = 'shake 0.5s ease';
  el.addEventListener('animationend', () => {
    el.style.animation = '';
  }, { once: true });
}

function updateLoginState(username) {
  const topBarRight = document.querySelector('.top-bar__right');
  if (topBarRight) {
    topBarRight.innerHTML = `
      <span class="user-greeting" style="
        color: var(--text-secondary);
        font-size: 14px;
        margin-right: 8px;
      ">
        <span style="color: var(--accent-cyan);">${username}</span>님 환영합니다
      </span>
      <button class="btn btn--ghost" id="logout-btn">로그아웃</button>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      location.reload();
    });
  }
}

/* ═════════════════════════
   GAME LAUNCH
   ═════════════════════════ */
function initGameLaunch() {
  const gameStartBtns = document.querySelectorAll('#game-start-btn, #mobile-game-start');
  const overlay = document.getElementById('game-launch-overlay');
  const cancelBtn = document.getElementById('launch-cancel');
  const progressBar = document.getElementById('launch-progress');
  let launchTimer = null;

  function startLaunch() {
    if (overlay) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      animateProgress();
    }
  }

  function cancelLaunch() {
    if (overlay) {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (launchTimer) clearInterval(launchTimer);
      if (progressBar) progressBar.style.width = '0%';
    }
  }

  function animateProgress() {
    let progress = 0;
    if (progressBar) progressBar.style.width = '0%';

    launchTimer = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(launchTimer);
        if (progressBar) progressBar.style.width = '100%';

        setTimeout(() => {
          cancelLaunch();
          showToast('게임 클라이언트가 실행되었습니다! (프로토타입)', 'info');
        }, 500);
      }
      if (progressBar) progressBar.style.width = progress + '%';
    }, 200);
  }

  gameStartBtns.forEach(btn => {
    btn.addEventListener('click', startLaunch);
  });

  if (cancelBtn) cancelBtn.addEventListener('click', cancelLaunch);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
      cancelLaunch();
    }
  });
}

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

/* ═════════════════════════
   TOAST NOTIFICATIONS
   ═════════════════════════ */
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconMap = {
    success: '✅',
    error: '❌',
    info: '💡',
    warning: '⚠️'
  };

  toast.innerHTML = `
    <span class="toast__icon">${iconMap[type] || '💡'}</span>
    <span class="toast__message">${message}</span>
  `;

  // Styles
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    background: 'rgba(255, 255, 255, 0.97)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderLeft: '4px solid #e52d27',
    borderRadius: '10px',
    color: '#1e293b',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: '5000',
    animation: 'toastIn 0.4s ease',
    fontFamily: "'Noto Sans KR', sans-serif"
  });

  // Add animation keyframes
  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
      @keyframes toastIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toastOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}
