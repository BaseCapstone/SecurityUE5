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
