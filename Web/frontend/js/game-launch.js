function initGameLaunch() {
  const gameStartBtns = document.querySelectorAll('#game-start-btn, #mobile-game-start');
  const overlay = document.getElementById('game-launch-overlay');
  const cancelBtn = document.getElementById('launch-cancel');
  const progressBar = document.getElementById('launch-progress');
  let launchTimer = null;

  async function startLaunch() {
    const token = sessionStorage.getItem('token');
    const isAdmin = sessionStorage.getItem('lyra_admin') === 'true';

    if (!token && !isAdmin) {
      showToast('게임 실행 전 로그인이 필요합니다.', 'warning');
      const loginBtn = document.getElementById('login-btn');
      if (loginBtn) loginBtn.click();
      return;
    }

    if (isAdmin) {
      showToast('관리자 계정은 게임 클라이언트를 실행할 수 없습니다.', 'warning');
      return;
    }

    updateLaunchUserFromSession();

    if (overlay) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    try {
      const launchSession = await fetchGameLaunchSession(token);
      launchGameClient(launchSession);
      fetchUserProfile(token);
      animateProgress();
    } catch (error) {
      console.error('Game token request failed:', error);
      cancelLaunch();
      if (error.message && (error.message.includes('핵 사용 의심') || error.message.includes('제재'))) {
        openBanModal();
      } else {
        showToast(error.message || '게임 세션 준비에 실패했습니다.', 'error');
      }
    }
  }


  function updateLaunchUserFromSession() {
    const username = sessionStorage.getItem('username') || 'Player';
    const userName = sessionStorage.getItem('user_name') || '';
    const userId = sessionStorage.getItem('user_id') || '';
    const userInfoEl = document.getElementById('launch-user-info');

    if (!userInfoEl) return;

    userInfoEl.innerHTML = `
      <div class="launch-user__avatar">${username.charAt(0).toUpperCase()}</div>
      <div class="launch-user__details">
        <span class="launch-user__name">${userName || username}</span>
        <span class="launch-user__id">@${username} (ID: ${userId})</span>
      </div>
    `;
    userInfoEl.style.display = 'flex';
  }

  async function fetchUserProfile(token) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const userInfoEl = document.getElementById('launch-user-info');
      if (!userInfoEl || !data.user) return;

      const user = data.user;
      const totalLogs = data.game_stats ? data.game_stats.total_logs : 0;
      userInfoEl.innerHTML = `
        <div class="launch-user__avatar">${user.username.charAt(0).toUpperCase()}</div>
        <div class="launch-user__details">
          <span class="launch-user__name">${user.name}</span>
          <span class="launch-user__id">@${user.username} (ID: ${user.id})</span>
          <span class="launch-user__stat">Game logs: ${totalLogs}</span>
        </div>
      `;
    } catch (error) {
      console.warn('Profile fetch failed, continuing game launch:', error);
    }
  }

  async function fetchGameLaunchSession(token) {
    const response = await fetch('/api/auth/game-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || '게임 토큰 발급에 실패했습니다.');
    }

    return {
      token: data.game_token,
      userId: data.user ? data.user.id : sessionStorage.getItem('user_id')
    };
  }

  function launchGameClient({ token, userId }) {
    const logEndpoint = `${window.location.origin}/api/logs`;
    const launchUrl = `lyragame://launch?token=${encodeURIComponent(token || '')}&user_id=${encodeURIComponent(userId || '')}&api_url=${encodeURIComponent(logEndpoint)}`;
    window.location.href = launchUrl;
  }

  function cancelLaunch() {
    if (overlay) {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (launchTimer) clearInterval(launchTimer);
    launchTimer = null;

    if (progressBar) progressBar.style.width = '0%';
  }

  function animateProgress() {
    let progress = 0;
    if (launchTimer) clearInterval(launchTimer);
    if (progressBar) progressBar.style.width = '0%';

    launchTimer = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(launchTimer);
        launchTimer = null;
        if (progressBar) progressBar.style.width = '100%';

        setTimeout(() => {
          cancelLaunch();
          const username = sessionStorage.getItem('username') || 'Player';
          showToast(`${username}님의 게임 클라이언트 실행 요청이 전송되었습니다.`, 'success');
        }, 500);
      }

      if (progressBar) progressBar.style.width = progress + '%';
    }, 200);
  }

  function openBanModal() {
    const banModal = document.getElementById('ban-modal');
    if (banModal) {
      banModal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      
      const closeBtn = document.getElementById('ban-modal-close');
      const confirmBtn = document.getElementById('ban-modal-confirm-btn');
      
      const closeHandler = () => {
        banModal.classList.remove('is-open');
        document.body.style.overflow = '';
      };
      
      if (closeBtn) closeBtn.onclick = closeHandler;
      if (confirmBtn) confirmBtn.onclick = closeHandler;
    } else {
      showToast('핵 사용 의심 대상자로 지정되어 게임을 플레이할 수 없습니다.', 'error');
    }
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

