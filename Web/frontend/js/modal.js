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

  // 배경(모달 외부) 클릭 및 드래그 시 모달이 닫히는 현상 방지
  /*
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
  */

  // X 버튼으로만 닫히도록 ESC 키 닫기 기능도 비활성화
  /*
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
  */

  // Form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('login-id').value.trim();
      const pw = document.getElementById('login-pw').value.trim();

      if (!id || !pw) {
        shakeElement(form);
        return;
      }

      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.textContent = '로그인 중...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = '로그인';
        submitBtn.disabled = false;
        closeModal();

        // 관리자 계정 확인 (admin / admin)
        if (id === 'admin' && pw === 'admin') {
          activateAdminMode();
        } else {
          showToast('로그인 성공! 환영합니다.', 'success');
          updateLoginState(id);
        }
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
