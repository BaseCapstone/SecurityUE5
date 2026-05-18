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
    // ── 로그인 여부 체크 ──
    const token = sessionStorage.getItem('token');
    const isAdmin = sessionStorage.getItem('lyra_admin') === 'true';

    if (!token && !isAdmin) {
      // 비로그인 상태 → 로그인 모달 자동 오픈
      showToast('게임을 실행하려면 먼저 로그인해주세요.', 'warning');
      const loginBtn = document.getElementById('login-btn');
      if (loginBtn) loginBtn.click();
      return;
    }

    if (isAdmin) {
      showToast('관리자 계정으로는 게임을 실행할 수 없습니다.', 'warning');
      return;
    }

    // ── 로그인 유저 정보 표시 ──
    const username = sessionStorage.getItem('username') || '알 수 없음';
    const userName = sessionStorage.getItem('user_name') || '';
    const userId = sessionStorage.getItem('user_id') || '';

    const userInfoEl = document.getElementById('launch-user-info');
    if (userInfoEl) {
      userInfoEl.innerHTML = `
        <div class="launch-user__avatar">${username.charAt(0).toUpperCase()}</div>
        <div class="launch-user__details">
          <span class="launch-user__name">${userName || username}</span>
          <span class="launch-user__id">@${username} (ID: ${userId})</span>
        </div>
      `;
      userInfoEl.style.display = 'flex';
    }

    // ── 유저 프로필 API 호출 후 게임 실행 ──
    if (overlay) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    fetchUserProfileAndLaunch(token);
  }

  async function fetchUserProfileAndLaunch(token) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 프로필 정보 업데이트
        const userInfoEl = document.getElementById('launch-user-info');
        if (userInfoEl) {
          const u = data.user;
          userInfoEl.innerHTML = `
            <div class="launch-user__avatar">${u.username.charAt(0).toUpperCase()}</div>
            <div class="launch-user__details">
              <span class="launch-user__name">${u.name}</span>
              <span class="launch-user__id">@${u.username} (ID: ${u.id})</span>
              <span class="launch-user__stat">게임 로그: ${data.game_stats.total_logs}건</span>
            </div>
          `;
        }
      }
    } catch (error) {
      console.warn('프로필 조회 실패 (게임 실행은 진행):', error);
    }

    // 프로필 조회 결과와 관계없이 게임 실행 진행
    animateProgress();
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
          const username = sessionStorage.getItem('username') || '';
          showToast(`${username}님, 게임 클라이언트가 실행되었습니다!`, 'success');
          
          // 커스텀 프로토콜을 iframe으로 실행하여 브라우저 팝업 차단을 우회
          const token = sessionStorage.getItem('token') || '';
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `lyragame://launch?token=${token}`;
          document.body.appendChild(iframe);
          
          // 1초 뒤 iframe 제거
          setTimeout(() => document.body.removeChild(iframe), 1000);
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
