/* ═════════════════════════
   LOGIN MODAL
   ═════════════════════════ */
function initLoginModal() {
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('modal-close');
  
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  function openModal(view = 'login') {
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      switchAuthView(view);
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      // Reset forms
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();
      if (forgotForm) forgotForm.reset();
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
  if (registerBtn) registerBtn.addEventListener('click', () => openModal('register'));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idInput = document.getElementById('login-id');
      const pwInput = document.getElementById('login-pw');
      const id = idInput.value.trim();
      const pw = pwInput.value.trim();

      if (!id || !pw) {
        shakeElement(loginForm);
        return;
      }

      const submitBtn = document.getElementById('login-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '로그인 중...';
      submitBtn.disabled = true;

      try {
        // 관리자 하드코딩
        if (id === 'admin' && pw === 'admin') {
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            closeModal();
            activateAdminMode();
          }, 500);
          return;
        }

        // 실제 API 호출
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: id, password: pw })
        });

        const data = await response.json();

        if (response.ok) {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('username', data.user.username);
          showToast('로그인 성공! 환영합니다.', 'success');
          updateLoginState(data.user.username);
          closeModal();
        } else {
          showToast(data.detail || '로그인 실패. 아이디 또는 비밀번호를 확인하세요.', 'error');
          shakeElement(loginForm);
        }
      } catch (error) {
        console.error('Login error:', error);
        showToast('서버 연결에 실패했습니다.', 'error');
        shakeElement(loginForm);
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Register Form Submit
  if (registerForm) {
    const pwInput = document.getElementById('reg-pw');
    const pwConfirmInput = document.getElementById('reg-pw-confirm');
    const pwError = document.getElementById('reg-pw-error');

    function checkPasswordMatch() {
      if (pwConfirmInput.value && pwInput.value !== pwConfirmInput.value) {
        pwError.style.display = 'block';
        pwConfirmInput.classList.add('form-input--error');
        pwConfirmInput.classList.remove('form-input--success');
        return false;
      } else if (pwConfirmInput.value && pwInput.value === pwConfirmInput.value) {
        pwError.style.display = 'none';
        pwConfirmInput.classList.remove('form-input--error');
        pwConfirmInput.classList.add('form-input--success');
        return true;
      }
      pwError.style.display = 'none';
      pwConfirmInput.classList.remove('form-input--error');
      pwConfirmInput.classList.remove('form-input--success');
      return false;
    }

    pwInput.addEventListener('input', checkPasswordMatch);
    pwConfirmInput.addEventListener('input', checkPasswordMatch);

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('reg-name').value.trim();
      const id = document.getElementById('reg-id').value.trim();
      const pw = pwInput.value;
      
      if (!name || !id || !pw || !checkPasswordMatch()) {
        shakeElement(registerForm);
        if (!checkPasswordMatch()) pwConfirmInput.focus();
        return;
      }

      if (id.length < 4 || id.length > 20) {
        showToast('아이디는 4~20자여야 합니다.', 'error');
        return;
      }
      if (pw.length < 8) {
        showToast('비밀번호는 8자 이상이어야 합니다.', 'error');
        return;
      }

      const submitBtn = document.getElementById('register-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '가입 중...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, username: id, password: pw })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showToast('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
          registerForm.reset();
          pwConfirmInput.classList.remove('form-input--success');
          switchAuthView('login');
          document.getElementById('login-id').value = id;
        } else {
          showToast(data.detail || '회원가입에 실패했습니다.', 'error');
        }
      } catch (error) {
        console.error('Register error:', error);
        showToast('서버 통신 오류', 'error');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Forgot Form Submit (Mock)
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('forgot-id').value.trim();
      const name = document.getElementById('forgot-name').value.trim();

      if (!id || !name) {
        shakeElement(forgotForm);
        return;
      }

      const submitBtn = document.getElementById('forgot-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '확인 중...';
      submitBtn.disabled = true;

      // Mock
      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        showToast('임시 비밀번호가 발급되었습니다.', 'success');
        switchAuthView('login');
      }, 1000);
    });
  }
}

// 뷰 전환 함수 (글로벌 접근 가능)
window.switchAuthView = function(view) {
  const views = document.querySelectorAll('.modal__view');
  views.forEach(v => v.classList.remove('is-active'));
  
  const targetView = document.getElementById(`view-${view}`);
  if (targetView) {
    targetView.classList.add('is-active');
    
    // 포커스 설정
    setTimeout(() => {
      const firstInput = targetView.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 50);

    // 제목/부제목 변경
    const title = document.getElementById('auth-modal-title');
    const subtitle = document.getElementById('auth-modal-subtitle');
    if (title && subtitle) {
      if (view === 'login') {
        title.textContent = 'LYRA SHIELD 로그인';
        subtitle.textContent = '보안 플랫폼에 접속합니다';
      } else if (view === 'register') {
        title.textContent = '회원가입';
        subtitle.textContent = '새로운 계정을 생성합니다';
      } else if (view === 'forgot') {
        title.textContent = '비밀번호 찾기';
        subtitle.textContent = '계정 정보를 확인합니다';
      }
    }
  }
};

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
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      location.reload();
    });
  }
}

// 페이지 로드 시 로그인 상태 체크
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = sessionStorage.getItem('username');
  if (savedUser && !sessionStorage.getItem('lyra_admin')) {
    updateLoginState(savedUser);
  }
});
