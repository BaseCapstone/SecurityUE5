/* ═══════════════════════════════════════════════════
   LYRA SHIELD — App Logic
   Hero Slider, Nav, Modal, Game Launch
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initSoundSystem();
  initHeroSlider();
  initNavigation();
  initLoginModal();
  initGameLaunch();
  initParticles();
  initScrollEffects();
  initFaqAccordion();
  fetchPublicStats(true);
  
  // 5초마다 실시간 데이터 연동
  setInterval(() => fetchPublicStats(false), 5000);
});

/**
 * 다크/라이트 테마 토글 제어
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('light-theme');
    const isLight = document.documentElement.classList.contains('light-theme');
    localStorage.setItem('lyra_theme', isLight ? 'light' : 'dark');
    
    // 슬라이더 그라데이션 리셋 트리거
    const hero = document.getElementById('hero');
    if (hero) {
      const gradientEl = hero.querySelector('.hero__gradient');
      if (gradientEl) {
        gradientEl.style.background = 'var(--grad-hero-overlay)';
      }
    }
  });
}

/**
 * 백엔드 통계 API를 호출하여 홈 화면 하단 및 관리자 통계 카드 데이터를 동기화합니다.
 */
async function fetchPublicStats(isInitial = false, includeAdminDashboard = false) {
  try {
    const response = await fetch('/api/public/stats');
    if (response.ok) {
      const data = await response.json();
      
      // 홈 화면 하단 통계 바
      const detectionEl = document.getElementById('stat-detection');
      const usersEl = document.getElementById('stat-users');
      const blockedEl = document.getElementById('stat-blocked');
      const uptimeEl = document.getElementById('stat-uptime');
      
      if (detectionEl) detectionEl.textContent = data.detection_accuracy;
      if (usersEl) usersEl.textContent = data.total_protected_users.toLocaleString();
      if (blockedEl) blockedEl.textContent = data.blocked_count.toLocaleString();
      if (uptimeEl) uptimeEl.textContent = data.server_uptime;

      // 관리자 대시보드 통계 카드는 새로고침 버튼을 눌렀을 때만 갱신합니다.
      const adminDetectionEl = includeAdminDashboard ? document.getElementById('admin-stat-detection') : null;
      const adminOnlineEl = includeAdminDashboard ? document.getElementById('admin-stat-online') : null;
      const adminSuspiciousEl = includeAdminDashboard ? document.getElementById('admin-stat-suspicious') : null;
      const adminBannedEl = includeAdminDashboard ? document.getElementById('admin-stat-banned') : null;

      if (adminDetectionEl) adminDetectionEl.textContent = data.detection_accuracy;
      if (adminOnlineEl) adminOnlineEl.textContent = data.online_users;
      if (adminSuspiciousEl) adminSuspiciousEl.textContent = data.suspicious_users;
      if (adminBannedEl) adminBannedEl.textContent = data.banned_users;

      // 움직이는 티커 바 업데이트
      const todayBlockedEls = document.querySelectorAll('.ticker-today-blocked');
      const avgScoreEls = document.querySelectorAll('.ticker-avg-score');
      todayBlockedEls.forEach(el => el.textContent = `${data.today_blocked}건`);
      avgScoreEls.forEach(el => el.textContent = `${data.average_score}점`);

      // Count Up 애니메이션 다시 시작 (처음 로딩 시에만)
      if (isInitial) {
        initCountUpAnimations();
      }
    }
  } catch (error) {
    console.error('Failed to fetch public stats:', error);
  }
}

/**
 * 랭킹 탭 클릭 시 랭킹 데이터를 실시간으로 로드하여 렌더링합니다.
 */
async function loadRankingData() {
  const tbody = document.getElementById('ranking-tbody');
  if (!tbody) return;

  try {
    const response = await fetch('/api/public/ranking');
    if (response.ok) {
      const data = await response.json();
      tbody.innerHTML = '';

      if (data.ranking.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 48px; color: var(--text-muted);">
              등록된 클린 플레이어가 없습니다.
            </td>
          </tr>
        `;
        return;
      }

      data.ranking.forEach((player, idx) => {
        const rank = idx + 1;
        let rankBadgeClass = '';
        if (rank <= 3) {
          rankBadgeClass = `rank-badge--${rank}`;
        }

        let scoreClass = 'score-gauge__fill--high';
        let statusBadge = 'status-badge--safe';
        let statusText = player.status;
        
        if (player.score < 30) {
          scoreClass = 'score-gauge__fill--low';
          statusBadge = 'status-badge--danger';
        } else if (player.score < 70) {
          scoreClass = 'score-gauge__fill--medium';
          statusBadge = 'status-badge--warning';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="rank-badge ${rankBadgeClass}">${rank}</span></td>
          <td style="font-weight: 700; color: var(--text-primary);">${player.username}</td>
          <td>
            <div class="score-gauge-wrap">
              <span style="font-family: var(--font-mono); font-weight: 700; width: 44px; color: var(--text-primary);">${player.score}점</span>
              <div class="score-gauge">
                <div class="score-gauge__fill ${scoreClass}" style="width: ${player.score}%"></div>
              </div>
            </div>
          </td>
          <td style="color: var(--text-secondary); font-weight: 500;">${player.total_logs}회</td>
          <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 48px; color: var(--accent-red);">
            랭킹 데이터를 로드하지 못했습니다.
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Failed to load ranking data:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 48px; color: var(--accent-red);">
          서버 연결 실패
        </td>
      </tr>
    `;
  }
}

/**
 * FAQ 아코디언 컴포넌트 초기화
 */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('is-active');
      
      // 질문 클릭 시 다른 아코디언은 닫기
      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('is-active');
      });
      
      if (!isActive) {
        item.classList.add('is-active');
      }
    });
  });
}

