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
        // 모든 로그인은 DB API를 통해 처리
        const response = await fetch('/api/auth/login', {
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
          sessionStorage.setItem('user_name', data.user.name);
          sessionStorage.setItem('user_id', data.user.id);
          sessionStorage.setItem('user_role', data.user.role || 'user');

          // 관리자 계정이면 관리자 모드 활성화
          if (data.user.role === 'admin') {
            closeModal();
            sessionStorage.setItem('lyra_admin', 'true');
            activateAdminMode();
            return;
          }

          showToast(`${data.user.name}님, 환영합니다!`, 'success');
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
        const response = await fetch('/api/auth/register', {
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
      sessionStorage.removeItem('user_name');
      sessionStorage.removeItem('user_id');
      sessionStorage.removeItem('user_role');
      location.reload();
    });
  }
}

function initLegalModal() {
  const modal = document.getElementById('legal-modal');
  const closeBtn = document.getElementById('legal-modal-close');
  const titleEl = document.getElementById('legal-modal-title');
  const bodyEl = document.getElementById('legal-modal-body');
  
  const linkTerms = document.getElementById('link-terms');
  const linkPrivacy = document.getElementById('link-privacy');
  const linkPolicy = document.getElementById('link-policy');

  const termsContent = {
    terms: {
      title: '서비스 이용약관',
      body: `제 1 조 (목적)
본 약관은 LYRA SHIELD가 제공하는 보안 플랫폼 및 관련 서비스의 이용 조건 및 절차를 규정함을 목적으로 합니다.

제 2 조 (서비스의 이용)
사용자는 본 플랫폼을 합법적인 목적으로만 사용해야 하며, 게임 내 불법 프로그램(핵)의 사용, 유포 및 역공학 행위는 엄격히 금지됩니다. 위반 시 계정 영구 제재 및 사법 조치가 취해질 수 있습니다.

제 3 조 (책임의 한계)
본 솔루션은 비정상 플레이 탐지 및 완화를 위해 최선을 다하나, 개별 시스템 환경에 따른 오작동에 대해서는 귀책 사유가 없는 한 책임을 지지 않습니다.`
    },
    privacy: {
      title: '개인정보처리방침',
      body: `본 플랫폼은 개인정보 보호법에 따라 유저의 개인정보 및 권익을 보호하고 관련 고충을 원활하게 처리할 수 있도록 다음과 같은 처리 방침을 두고 있습니다.

1. 개인정보 수집 항목: 계정 아이디, 닉네임, 로그인 IP, 게임 접속 및 제재 로그, 탐지된 시스템 정보
2. 개인정보 수집 목적: 불법 프로그램(핵) 실시간 탐지 및 차단, 서비스 악용 방지, 관리자 대시보드 모니터링
3. 보유 및 이용 기간: 수집 목적 달성 및 서비스 종료 시까지 (단, 불법 프로그램 사용 기록은 사법 조치 증빙을 위해 5년간 보관될 수 있습니다.)`
    },
    policy: {
      title: '게임 운영정책',
      body: `본 운영정책은 공정하고 쾌적한 게임 환경을 유지하기 위해 LYRA SHIELD가 적용하는 제재 및 운영 기준을 정의합니다.

1. 핵/불법 프로그램 사용: 실시간 AI 모니터링 시스템을 통해 스피드핵, 에임핵, ESP, 무적핵 등 감지 즉시 영구 정지 처리가 적용됩니다.
2. 모니터링 및 제재 절차: 탐지 로그 누적으로 클린 점수가 30점 미만으로 하락할 시 자동으로 주의/제재 대상 유저로 등록되며, 관리자 검토를 통해 영구 밴 조치가 실행됩니다.
3. 이의 제기: 제재 조치에 이의가 있을 경우, 로그 분석 검토를 통해 15일 이내에 소명을 요청할 수 있습니다.`
    }
  };

  function openLegalModal(type) {
    if (modal && titleEl && bodyEl && termsContent[type]) {
      titleEl.textContent = termsContent[type].title;
      bodyEl.textContent = termsContent[type].body;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLegalModal() {
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  if (linkTerms) linkTerms.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('terms'); });
  if (linkPrivacy) linkPrivacy.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('privacy'); });
  if (linkPolicy) linkPolicy.addEventListener('click', (e) => { e.preventDefault(); openLegalModal('policy'); });
  if (closeBtn) closeBtn.addEventListener('click', closeLegalModal);

  // Close modal when clicking overlay
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLegalModal();
    });
  }
}

// 페이지 로드 시 로그인 상태 체크 및 약관 모달 초기화
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = sessionStorage.getItem('username');
  const savedRole = sessionStorage.getItem('user_role');
  if (savedUser && !sessionStorage.getItem('lyra_admin') && savedRole !== 'admin') {
    updateLoginState(savedUser);
  }
  
  // 이용약관 모달 초기화
  initLegalModal();
});
