/* ═════════════════════════
   ADMIN DASHBOARD — 관리자 전용 로직
   ═════════════════════════ */

/* ─── 원본 네비게이션 백업용 변수 ─── */
let _originalNavHTML = '';

/**
 * 관리자 모드를 활성화합니다.
 * 일반 유저 화면을 숨기고 관리자 대시보드 + 전용 네비게이션을 표시합니다.
 */
function activateAdminMode() {
  const isMainPage = !window.location.pathname.includes('admin.html');

  if (isMainPage) {
    // 일반 유저 콘텐츠 숨기기
    const userSections = document.querySelectorAll('.hero, .content, .stats-bar');
    userSections.forEach(section => {
      section.style.display = 'none';
    });

    // 네비게이션 바 내용을 관리자 전용 메뉴로 교체
    const navInner = document.querySelector('.nav-bar__inner');
    if (navInner) {
      _originalNavHTML = navInner.innerHTML;
      navInner.innerHTML = `
        <ul class="nav-bar__links" id="admin-nav-links">
          <li><a href="#" class="nav-link active" data-admin-page="dashboard">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
            </svg>
            대시보드
          </a></li>
          <li><a href="#" class="nav-link" data-admin-page="users">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a2 2 0 11-4 0 2 2 0 014 0zM12 13a4 4 0 00-8 0v3h8v-3zM15 13a3 3 0 00-3-3v6h6v-3z"/>
            </svg>
            사용자 관리
          </a></li>
          <li><a href="#" class="nav-link" data-admin-page="stats">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
            통계
          </a></li>
          <li><a href="#" class="nav-link" data-admin-page="logs">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
            </svg>
            탐지 로그
          </a></li>
          <li><a href="#" class="nav-link" data-admin-page="settings">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
            설정
          </a></li>
        </ul>
      `;
    }
  }

  // 관리자 네비게이션 클릭 이벤트
  initAdminNavigation();

  // 관리자 대시보드 표시
  const adminDashboard = document.getElementById('admin-dashboard');
  if (adminDashboard) {
    adminDashboard.style.display = 'block';
  }

  // body와 html에 관리자 모드 클래스 추가 (스타일 및 오버스크롤 배경 변경용)
  document.documentElement.classList.add('is-admin');
  document.body.classList.add('is-admin');

  // 상단 바 로그인 상태를 관리자 전용으로 변경
  if (isMainPage) {
    const topBarRight = document.querySelector('.top-bar__right');
    if (topBarRight) {
      topBarRight.innerHTML = `
        <span class="admin-badge" style="font-size: 12px; padding: 6px 14px;">🔑 관리자</span>
        <button class="btn btn--ghost" id="logout-btn" style="color: #f1f5f9;">로그아웃</button>
      `;

      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          logoutAdmin();
        });
      }
    }
  } else {
    // admin.html인 경우 정적 로그아웃 버튼의 이벤트 리스너/동작 재확인
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = logoutAdmin;
    }
  }

  // sessionStorage에 관리자 상태 저장 (F5 대응)
  sessionStorage.setItem('lyra_admin', 'true');

  // 실시간 통계 정보 불러오기
  if (typeof fetchPublicStats === 'function') {
    fetchPublicStats();
  }

  showToast('관리자 모드로 접속하였습니다.', 'success');
}

/**
 * 관리자 로그아웃 처리
 */
function logoutAdmin() {
  sessionStorage.removeItem('lyra_admin');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('user_name');
  sessionStorage.removeItem('user_id');
  sessionStorage.removeItem('user_role');
  window.location.href = 'index.html';
}

/**
 * 관리자 모드를 비활성화하고 일반 화면으로 복귀합니다.
 */
function deactivateAdminMode() {
  const userSections = document.querySelectorAll('.hero, .content, .stats-bar');
  userSections.forEach(section => {
    section.style.display = '';
  });

  // 네비게이션 바 원래 내용으로 복원
  const navInner = document.querySelector('.nav-bar__inner');
  if (navInner && _originalNavHTML) {
    navInner.innerHTML = _originalNavHTML;
  }

  const adminDashboard = document.getElementById('admin-dashboard');
  if (adminDashboard) {
    adminDashboard.style.display = 'none';
  }

  document.documentElement.classList.remove('is-admin');
  document.body.classList.remove('is-admin');
  sessionStorage.removeItem('lyra_admin');
}

/**
 * 관리자 네비게이션 클릭 이벤트 초기화
 */
function initAdminNavigation() {
  const adminNavLinks = document.querySelectorAll('[data-admin-page]');
  adminNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // 활성 링크 업데이트
      adminNavLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // 해당 페이지 표시
      const pageName = link.dataset.adminPage;
      switchAdminPage(pageName);
    });
  });
}

/**
 * 관리자 하위 페이지 전환
 */
function switchAdminPage(pageName) {
  // 모든 관리자 페이지 숨기기
  const allPages = document.querySelectorAll('[data-page]');
  allPages.forEach(page => {
    page.style.display = 'none';
  });

  // 선택한 페이지 표시
  const targetPage = document.querySelector(`[data-page="${pageName}"]`);
  if (targetPage) {
    targetPage.style.display = 'block';
    targetPage.style.animation = 'adminFadeIn 0.3s ease';
  }
}

/**
 * 유저 제재 처리 (백엔드 연동)
 */
async function adminBanUser(userId, btnElement) {
  const token = sessionStorage.getItem('token');
  if (!token) return;

  btnElement.textContent = '처리 중...';
  btnElement.disabled = true;

  try {
    const response = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      const row = btnElement.closest('tr');
      
      if (row) {
        const statusBadge = row.querySelector('.status-badge');
        if (data.is_banned) {
          if (statusBadge) {
            statusBadge.className = 'status-badge status-badge--danger';
            statusBadge.textContent = '제재됨';
          }
          btnElement.textContent = '해제';
          btnElement.className = 'btn btn--outline btn--sm ban-toggle-btn';
          btnElement.style = '';
        } else {
          if (statusBadge) {
            statusBadge.className = 'status-badge status-badge--safe';
            statusBadge.textContent = '정상';
          }
          btnElement.textContent = '제재';
          btnElement.className = 'btn btn--primary btn--sm ban-toggle-btn';
          btnElement.style = 'background:var(--accent-red);border-color:var(--accent-red);';
        }
      }
      
      btnElement.disabled = false;
      addAdminLog('success', data.message);
      showToast(data.message, 'success');
    } else {
      const errorData = await response.json();
      showToast(errorData.detail || '제재 처리에 실패했습니다.', 'error');
      btnElement.textContent = '오류';
    }
  } catch (error) {
    console.error('Ban toggle failed:', error);
    showToast('네트워크 오류가 발생했습니다.', 'error');
    btnElement.textContent = '오류';
  }
}

/**
 * 유저 감시 등록 (프로토타입)
 */
function adminWatchUser(userId) {
  const row = event.target.closest('tr');
  if (row) {
    const btn = row.querySelector('.btn--outline');
    if (btn) {
      btn.textContent = '감시 중';
      btn.disabled = true;
      btn.style.opacity = '0.5';
    }

    addAdminLog('info', `${userId} 유저를 감시 대상으로 등록했습니다.`);
  }

  showToast(`${userId} 유저를 감시 중입니다.`, 'info');
}

/**
 * 관리자 로그에 새 항목을 추가합니다.
 */
function addAdminLog(type, message) {
  const logList = document.getElementById('admin-log');
  if (!logList) return;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const li = document.createElement('li');
  li.className = `admin-log__item admin-log__item--${type}`;
  li.innerHTML = `
    <span class="admin-log__time">${timeStr}</span>
    <span class="admin-log__msg">${message}</span>
  `;

  logList.insertBefore(li, logList.firstChild);
  li.style.animation = 'fadeUp 0.3s ease';
}

/**
 * 새로고침 버튼 — 데이터 시뮬레이션
 */
function initAdminRefresh() {
  const refreshBtn = document.getElementById('admin-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = '⏳ 갱신 중...';
      refreshBtn.disabled = true;

      try {
        if (typeof fetchPublicStats === 'function') {
          await fetchPublicStats();
        }
        addAdminLog('info', '대시보드 데이터가 갱신되었습니다.');
        showToast('데이터가 갱신되었습니다.', 'info');
      } catch (error) {
        showToast('데이터 갱신에 실패했습니다.', 'error');
      } finally {
        refreshBtn.textContent = '🔄 새로고침';
        refreshBtn.disabled = false;
      }
    });
  }
}

/**
 * 페이지 로드 시 관리자 세션 복원 확인
 */
function checkAdminSession() {
  if (sessionStorage.getItem('lyra_admin') === 'true') {
    activateAdminMode();
  }
}



function initAdminLogo() {
  const logo = document.getElementById('admin-logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      const dashboardLink = document.querySelector('[data-admin-page="dashboard"]');
      if (dashboardLink) {
        dashboardLink.click();
      }
    });
  }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
  initAdminRefresh();
  initUserManagement();
  initAdminLogo();
  checkAdminSession();
});
