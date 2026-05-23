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

  // Logo click navigation
  const logoLink = document.querySelector('.top-bar__logo');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchUserSection('main');
    });
  }

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

  // 뉴스 전체보기 / 홈으로 돌아가기 버튼 리스너
  const viewAllBtn = document.getElementById('view-all-news-btn');
  if (viewAllBtn) {
    viewAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchUserSection('news-all');
    });
  }

  const backToHomeNewsBtn = document.getElementById('back-to-home-news-btn');
  if (backToHomeNewsBtn) {
    backToHomeNewsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchUserSection('main');
    });
  }

  // Keyboard escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // popstate 이벤트 리스너 추가 (뒤로가기/앞으로가기 처리)
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1) || 'main';
    switchUserSection(hash, false);
  });

  // 초기 로드 시 해시가 있으면 해당 섹션으로 이동
  const initialHash = window.location.hash.substring(1);
  const allowedSections = ['main', 'patch', 'ranking', 'support', 'system-intro', 'admin-guide', 'news-all'];
  if (allowedSections.includes(initialHash)) {
    switchUserSection(initialHash, false);
  } else {
    switchUserSection('main', false);
  }
}

/**
 * 일반 유저 화면의 섹션 전환 (SPA)
 */
function switchUserSection(sectionId, updateHistory = true) {
  // 스크롤 위치 최상단으로 즉시 강제 초기화 (scroll-behavior: smooth 무시)
  window.scrollTo({ top: 0, behavior: 'auto' });

  // 드래그 및 텍스트 선택 상태 해제
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }

  // 포커스 상태 해제 (링크나 버튼이 계속 눌려있는 것 같은 현상 방지)
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }

  // FAQ 아코디언 상태 리셋 (다른 페이지 이동 시 모두 닫기)
  document.querySelectorAll('.faq-item').forEach(el => {
    el.classList.remove('is-active');
  });

  // 브라우저 주소창 해시 및 히스토리 업데이트
  if (updateHistory) {
    if (window.location.hash !== '#' + sectionId) {
      history.pushState({ sectionId }, '', '#' + sectionId);
    }
  }

  // 관리자 모드가 켜져있다면 해제하고 일반 복귀
  if (document.body.classList.contains('is-admin') && typeof deactivateAdminMode === 'function') {
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

  if (sectionId === 'main') {
    if (hero) hero.style.display = '';
    if (featuresGrid) featuresGrid.style.display = '';
    const mainSec = document.getElementById('main');
    if (mainSec) mainSec.style.display = '';
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

