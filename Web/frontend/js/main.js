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
  initFaqAccordion();
  fetchPublicStats();
});

/**
 * 백엔드 통계 API를 호출하여 홈 화면 하단 및 관리자 통계 카드 데이터를 동기화합니다.
 */
async function fetchPublicStats() {
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

      // 관리자 대시보드 통계 카드
      const adminDetectionEl = document.getElementById('admin-stat-detection');
      const adminOnlineEl = document.getElementById('admin-stat-online');
      const adminSuspiciousEl = document.getElementById('admin-stat-suspicious');
      const adminBannedEl = document.getElementById('admin-stat-banned');

      if (adminDetectionEl) adminDetectionEl.textContent = data.detection_accuracy;
      if (adminOnlineEl) adminOnlineEl.textContent = data.online_users;
      if (adminSuspiciousEl) adminSuspiciousEl.textContent = data.suspicious_users;
      if (adminBannedEl) adminBannedEl.textContent = data.banned_users;

      // Count Up 애니메이션 다시 시작
      initCountUpAnimations();
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
          <td style="font-family: var(--font-mono); color: var(--text-secondary); font-weight: 500;">${player.total_logs}회</td>
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

