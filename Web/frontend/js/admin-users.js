/* ═════════════════════════
   ADMIN USERS — 사용자 관리 대시보드 스크립트
   ═════════════════════════ */

/**
 * 사용자 관리 페이지: 검색, 정렬, 상세 모달 초기화
 */
async function initUserManagement() {
  const searchInput = document.getElementById('user-search-input');
  const tbody = document.getElementById('all-users-tbody');
  const headers = document.querySelectorAll('#all-users-table .sortable');
  
  if (!searchInput || !tbody) return;

  const token = sessionStorage.getItem('token');
  if (!token) return;

  let userData = [];

  try {
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      tbody.innerHTML = ''; // 기존 더미 데이터 지우기

      data.users.forEach(user => {
        // 임시 보안 점수 계산 (로그 수 기반으로 단순 계산)
        let scoreNum = 100 - (user.game_logs_count * 2);
        if (scoreNum < 0) scoreNum = 0;
        
        let scoreClass = 'probability--low';
        let statusBadge = 'status-badge--safe';
        let statusText = '정상';
        
        if (user.is_banned) {
          scoreClass = 'probability--high';
          statusBadge = 'status-badge--danger';
          statusText = '제재됨';
        } else if (scoreNum < 30) {
          scoreClass = 'probability--high';
          statusBadge = 'status-badge--danger';
          statusText = '위험';
        } else if (scoreNum < 70) {
          scoreClass = 'probability--medium';
          statusBadge = 'status-badge--warning';
          statusText = '주의';
        }

        const dateOnly = user.created_at ? user.created_at.split(' ')[0] : '-';
        const lastLoginOnly = user.last_login ? user.last_login.split(' ')[0] : '-';

        // 제재 버튼 렌더링 (관리자 계정은 버튼 비활성)
        let banBtnHtml = '';
        if (user.role === 'admin') {
          banBtnHtml = '<span style="color:#64748b; font-size:12px;">관리자</span>';
        } else if (user.is_banned) {
          banBtnHtml = `<button class="btn btn--outline btn--sm ban-toggle-btn" data-user-id="${user.id}">해제</button>`;
        } else {
          banBtnHtml = `<button class="btn btn--primary btn--sm ban-toggle-btn" data-user-id="${user.id}" style="background:var(--accent-red);border-color:var(--accent-red);">제재</button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="admin-table__id">#${user.id}</td>
          <td>${user.name || user.username}</td>
          <td>${dateOnly}</td>
          <td>${lastLoginOnly}</td>
          <td><span class="probability ${scoreClass}">${scoreNum}점</span></td>
          <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
          <td>${banBtnHtml}</td>
        `;
        tbody.appendChild(tr);

        userData.push({
          element: tr,
          id: `#${user.id}`,
          idDisplay: `#${user.id}`,
          rawId: user.id,
          nickname: (user.name || user.username).toLowerCase(),
          nicknameDisplay: user.name || user.username,
          date: dateOnly,
          lastLogin: lastLoginOnly,
          score: scoreNum,
          scoreDisplay: `${scoreNum}점`,
          status: statusText,
          is_banned: user.is_banned,
          role: user.role
        });
      });
      
      // 총 유저 수 표시 업데이트
      const titleArea = document.querySelector('.admin-panel__header h3').nextElementSibling;
      if (titleArea && titleArea.tagName === 'SPAN') {
        titleArea.textContent = `총 ${data.total}명`;
      }
    }
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
  }

  // 검색 기능 (부분 일치)
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    userData.forEach(data => {
      const isMatch = data.id.includes(query) || data.nickname.includes(query);
      data.element.style.display = isMatch ? '' : 'none';
    });
  });

  let currentSortColumn = '';
  let currentSortOrder = 'asc';

  // 정렬 기능
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const sortKey = header.dataset.sort;
      
      // 정렬 상태 업데이트
      if (currentSortColumn === sortKey) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = sortKey;
        currentSortOrder = 'asc';
      }

      // 정렬 아이콘 UI 업데이트
      headers.forEach(h => h.classList.remove('asc', 'desc'));
      header.classList.add(currentSortOrder);

      // 데이터 정렬
      userData.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        
        // 숫자 vs 문자열 처리
        if(typeof valA === 'number' && typeof valB === 'number') {
           return currentSortOrder === 'asc' ? valA - valB : valB - valA;
        }

        if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
        if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
        return 0;
      });

      // DOM 요소 재배치
      userData.forEach(data => {
        tbody.appendChild(data.element);
      });
    });
  });

  // 행 클릭 시 사용자 상세 모달 열기
  const modal = document.getElementById('admin-user-modal');
  const modalClose = document.getElementById('admin-modal-close');
  if(modal && modalClose) {
    userData.forEach(data => {
      data.element.addEventListener('click', (e) => {
        // 제재 버튼 클릭 시 모달 열리지 않도록
        if (e.target.closest('.ban-toggle-btn')) {
          return;
        }
        openAdminUserModal(data);
      });

      // 제재 버튼 클릭 이벤트 바인딩
      const banBtn = data.element.querySelector('.ban-toggle-btn');
      if (banBtn) {
        banBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          adminBanUser(data.rawId, banBtn);
        });
      }
    });

    modalClose.addEventListener('click', () => {
      modal.classList.remove('is-active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-active');
      }
    });
  }
}

/**
 * 관리자 - 사용자 상세 모달 열기 (임시 데이터 렌더링)
 */
async function openAdminUserModal(data) {
  const modal = document.getElementById('admin-user-modal');
  document.getElementById('admin-user-title').textContent = data.nicknameDisplay;
  document.getElementById('admin-user-id').textContent = data.idDisplay;
  document.getElementById('admin-user-score').textContent = data.scoreDisplay;
  
  const logList = document.getElementById('admin-user-log-list');
  logList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg">데이터를 불러오는 중...</span></li>';
  
  modal.classList.add('is-active');

  const userId = data.id.replace('#', '');
  const token = sessionStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/admin/users/${userId}/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const result = await response.json();
      logList.innerHTML = '';
      
      if (result.logs.length === 0) {
        logList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg">수집된 게임 로그가 없습니다.</span></li>';
        return;
      }

      result.logs.forEach(log => {
        const time = new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        let events = Array.isArray(log.event_data) ? log.event_data : [log.event_data];
        
        events.forEach(evt => {
            let msg = '정상적인 플레이 패턴 확인';
            let type = 'info';
            
            // 핵 감지 로직 적용
            if (evt.SpeedHack === 1 || evt.Aim === 1 || evt.GodMode === 1 || evt.ESP === 1) {
                let hacks = [];
                if (evt.SpeedHack === 1) hacks.push('스피드핵');
                if (evt.Aim === 1) hacks.push('에임핵');
                if (evt.GodMode === 1) hacks.push('무적핵');
                if (evt.ESP === 1) hacks.push('ESP');
                msg = `비정상 프로그램 의심 (${hacks.join(', ')})`;
                type = 'danger';
            } else if (evt.Speed > 1000) {
                msg = `비정상적인 이동 속도 감지 (속도: ${evt.Speed.toFixed(1)})`;
                type = 'warning';
            } else {
                msg = `일반 플레이 로그 기록 (속도: ${evt.Speed ? evt.Speed.toFixed(1) : 0})`;
            }

            const li = document.createElement('li');
            li.className = `admin-log__item admin-log__item--${type}`;
            li.innerHTML = `
              <span class="admin-log__time">${time}</span>
              <span class="admin-log__msg">${msg}</span>
            `;
            logList.appendChild(li);
        });
      });
    } else {
      logList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg" style="color:var(--accent-red);">데이터를 불러오지 못했습니다.</span></li>';
    }
  } catch (error) {
    logList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg" style="color:var(--accent-red);">서버와 연결할 수 없습니다.</span></li>';
  }
}
