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

  const hero = document.getElementById('hero');
  const slideBackgrounds = [
    'linear-gradient(135deg, #09090e 0%, #111124 50%, #1a0b2e 100%)', // Slide 1 (Dark)
    'linear-gradient(135deg, #05050f 0%, #0d1b2a 50%, #1b263b 100%)', // Slide 2 (Dark)
    'linear-gradient(135deg, #0a0b16 0%, #121829 50%, #1c152a 100%)'  // Slide 3 (Dark Fallback)
  ];
  const bgImages = [
    'images/hero_bg_1.png',
    'images/hero_bg_2.png',
    'images/hero_bg_3.png'
  ];

  function goToSlide(index) {
    slides.forEach(s => s.classList.remove('active'));
    indicators.forEach(i => i.classList.remove('active'));

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');

    // 테마 적용 (모든 슬라이드를 다크 모드로 통일)
    if (hero) {
      hero.classList.add('hero--dark');

      // 배경 이미지 연동 (사용자 등록 이미지 우선, 실패 시 기본 그라데이션)
      const img = new Image();
      img.src = bgImages[currentSlide];
      img.onload = () => {
        // 2번 슬라이드(index 1)는 머리 부분이 보이도록 'center top'으로 배치, 나머지는 'center'
        const bgPosition = currentSlide === 1 ? 'center top' : 'center';
        hero.style.background = `url('${bgImages[currentSlide]}') no-repeat ${bgPosition}/cover`;
        
        // 이미지 로드 성공 시 그라데이션 레이어를 투명 반투명 오버레이로 변경하여 배경 이미지가 노출되도록 함
        const gradientEl = hero.querySelector('.hero__gradient');
        if (gradientEl) {
          gradientEl.style.background = 'var(--grad-hero-overlay)';
        }
      };
      img.onerror = () => {
        hero.style.background = slideBackgrounds[currentSlide];
        
        // 이미지 로드 실패 시, hero에 적용된 그라데이션 배경이 보이도록 오버레이 투명화
        const gradientEl = hero.querySelector('.hero__gradient');
        if (gradientEl) {
          gradientEl.style.background = 'transparent';
        }
      };
    }
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

  // ═══════════════════════════════════════════
  // 슬라이더 버튼 액션 링크 연결
  // ═══════════════════════════════════════════
  
  // Slide 1 버튼 액션 (상세보기, 시스템 소개)
  const s1Btn1 = document.getElementById('hero-btn-details-1');
  const s1Btn2 = document.getElementById('hero-btn-guide-1');
  if (s1Btn1) s1Btn1.addEventListener('click', (e) => { e.stopPropagation(); switchUserSection('system-intro'); });
  if (s1Btn2) s1Btn2.addEventListener('click', (e) => { e.stopPropagation(); switchUserSection('system-intro'); });

  // Slide 2 버튼 액션 (관리자 가이드)
  const s2Btn2 = document.getElementById('hero-btn-guide-2');
  if (s2Btn2) s2Btn2.addEventListener('click', (e) => { e.stopPropagation(); switchUserSection('admin-guide'); });

  // Slide 3 버튼 액션 (업데이트 노트, 플레이)
  const s3Btn1 = document.getElementById('hero-btn-patch-3');
  const s3Btn2 = document.getElementById('hero-btn-play-3');
  if (s3Btn1) s3Btn1.addEventListener('click', (e) => { e.stopPropagation(); switchUserSection('patch'); });
  if (s3Btn2) {
    s3Btn2.addEventListener('click', (e) => {
      e.stopPropagation();
      const startBtn = document.getElementById('game-start-btn');
      if (startBtn) startBtn.click();
    });
  }

  // 초기 슬라이드 0 배경 렌더링 강제 실행
  goToSlide(0);

  startAutoPlay();
}
