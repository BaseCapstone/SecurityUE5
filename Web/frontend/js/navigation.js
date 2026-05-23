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
      e.preventDefault();
      const targetSection = link.dataset.section;
      if (targetSection) {
        switchUserSection(targetSection);
      }
    });
  });

  // Mobile nav links close menu and switch section
  const mobileLinks = document.querySelectorAll('.mobile-nav__links a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileNav();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetSection = href.substring(1);
        switchUserSection(targetSection);
      }
    });
  });

  // Feature Cards Click Navigation
  const featureCards = document.querySelectorAll('.feature-card[data-section-target]');
  featureCards.forEach(card => {
    card.addEventListener('click', () => {
      const targetSection = card.dataset.sectionTarget;
      if (targetSection) {
        switchUserSection(targetSection);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  const gameLaunchCard = document.getElementById('feature-game-launch');
  if (gameLaunchCard) {
    gameLaunchCard.addEventListener('click', () => {
      const startBtn = document.getElementById('game-start-btn');
      if (startBtn) startBtn.click();
    });
  }

  // Keyboard escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });
}

/**
 * 일반 유저 화면의 섹션 전환 (SPA)
 */
function switchUserSection(sectionId) {
  // 관리자 모드가 켜져있다면 해제하고 일반 복귀
  if (document.body.classList.contains('is-admin')) {
    deactivateAdminMode();
  }

  const hero = document.getElementById('hero');
  const featuresGrid = document.getElementById('features-grid');
  const userSections = document.querySelectorAll('.content');

  // 모든 콘텐츠 섹션 숨기기
  userSections.forEach(sec => {
    if (sec.id !== 'admin-dashboard') {
      sec.style.display = 'none';
    }
  });

  if (sectionId === 'news') {
    if (hero) hero.style.display = '';
    if (featuresGrid) featuresGrid.style.display = '';
    const newsSec = document.getElementById('news');
    if (newsSec) newsSec.style.display = '';
  } else {
    if (hero) hero.style.display = 'none';
    if (featuresGrid) featuresGrid.style.display = 'none';
    const targetSec = document.getElementById(sectionId);
    if (targetSec) {
      targetSec.style.display = 'block';
      targetSec.style.animation = 'fadeUp 0.5s ease';
    }
    
    // 특정 섹션별 동적 데이터 로드
    if (sectionId === 'ranking') {
      loadRankingData();
    }
  }

  // 데스크탑 네비게이션 액티브 동기화
  const navLinks = document.querySelectorAll('#nav-links .nav-link');
  navLinks.forEach(link => {
    if (link.dataset.section === sectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

