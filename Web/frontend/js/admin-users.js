/* ═════════════════════════
   ADMIN USERS — 사용자 관리 대시보드 스크립트
   ═════════════════════════ */

let adminUserData = [];

/**
 * 사용자 목록을 백엔드로부터 가져와서 대시보드 테이블에 렌더링합니다.
 */
async function fetchAndRenderUsers() {
  const tbody = document.getElementById('all-users-tbody');
  if (!tbody) return;

  const token = sessionStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      tbody.innerHTML = ''; // 기존 데이터 비우기
      
      const suspTbody = document.getElementById('admin-user-tbody');
      if (suspTbody) suspTbody.innerHTML = '';

      adminUserData = [];

      data.users.forEach(user => {
        let scoreClass = 'probability--low';
        let statusBadge = 'status-badge--safe';
        let statusText = '정상';
        
        if (user.is_banned === 1) {
          scoreClass = 'probability--high';
          statusBadge = 'status-badge--danger';
          statusText = '제재됨';
        } else if (user.ai_status === '위험' || user.ai_status === '확신') {
          scoreClass = 'probability--high';
          statusBadge = 'status-badge--danger';
          statusText = user.ai_status;
        } else if (user.ai_status === '의심') {
          scoreClass = 'probability--medium';
          statusBadge = 'status-badge--warning';
          statusText = '주의';
        }

        const dateOnly = user.created_at ? user.created_at.split(' ')[0] : '-';
        const lastLoginOnly = user.last_login ? user.last_login.split(' ')[0] : '-';

        // 보안 점수 계산 (100 - 핵 의심 확률)
        let hackProb = user.ai_probability !== '-' ? parseFloat(user.ai_probability) : 0.0;
        let securityScoreVal = 100.0 - hackProb;
        let securityScoreDisplay = securityScoreVal.toFixed(1) + '%';

        // 1. 전체 사용자 목록 tr 생성
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `
          <td class="admin-table__id">#${user.id}</td>
          <td>${user.name || user.username}</td>
          <td>${dateOnly}</td>
          <td>${lastLoginOnly}</td>
          <td><span class="probability ${scoreClass}">${securityScoreDisplay}</span></td>
          <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);

        const rowData = {
          element: tr,
          id: `#${user.id}`,
          idDisplay: `#${user.id}`,
          username: user.username,
          nickname: (user.name || user.username).toLowerCase(),
          nicknameDisplay: user.name || user.username,
          date: dateOnly,
          lastLogin: lastLoginOnly,
          score: securityScoreVal,
          scoreDisplay: securityScoreDisplay,
          status: statusText,
          isBanned: user.is_banned,
          aiPredictedLabel: user.ai_predicted_label,
          aiProbability: user.ai_probability,
          aiStatus: user.ai_status
        };
        adminUserData.push(rowData);

        // 상세 모달 연결
        tr.addEventListener('click', () => {
          openAdminUserModal(rowData);
        });

        // 2. 실시간 의심 유저 모니터링 목록에 추가
        const isSuspicious = user.is_banned === 1 || ['의심', '위험', '확신'].includes(user.ai_status);
        if (isSuspicious && user.role !== 'admin') {
          const trSusp = document.createElement('tr');
          trSusp.style.cursor = 'pointer';
          trSusp.innerHTML = `
            <td class="admin-table__id">#${user.id}</td>
            <td>${user.name || user.username}</td>
            <td><span class="probability ${scoreClass}">${user.ai_probability !== '-' ? user.ai_probability : '0.0%'}</span></td>
            <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
            <td>${lastLoginOnly}</td>
            <td>
              ${user.is_banned === 1 
                ? `<button class="btn btn--outline btn--sm" onclick="handleDashboardUnban(event, ${user.id}, '${user.username}')">해제</button>`
                : `<button class="btn btn--primary btn--sm" onclick="handleDashboardBan(event, ${user.id}, '${user.username}')" style="background: var(--accent-red); border-color: var(--accent-red);">제재</button>`
              }
            </td>
          `;
          
          trSusp.addEventListener('click', () => {
            openAdminUserModal(rowData);
          });
          
          if (suspTbody) suspTbody.appendChild(trSusp);
        }
      });
      
      // 총 유저 수 표시 업데이트
      const titleArea = document.getElementById('admin-total-users-count');
      if (titleArea) {
        titleArea.textContent = `총 ${data.total}명`;
      }
    }
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
  }
}
/**
 * 사용자 관리 페이지: 검색, 정렬, 상세 모달 초기화
 */
async function initUserManagement() {
  const searchInput = document.getElementById('user-search-input');
  const tbody = document.getElementById('all-users-tbody');
  const headers = document.querySelectorAll('#all-users-table .sortable');
  
  if (!searchInput || !tbody) return;

  // 검색 기능 (부분 일치) - 이벤트 리스너를 한 번만 등록
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    adminUserData.forEach(data => {
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
      adminUserData.sort((a, b) => {
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
      adminUserData.forEach(data => {
        tbody.appendChild(data.element);
      });
    });
  });

  // 행 클릭 시 사용자 상세 모달 열기
  const modal = document.getElementById('admin-user-modal');
  const modalClose = document.getElementById('admin-modal-close');
  if(modal && modalClose) {
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
// 대시보드 실시간 제재/해제 전역 핸들러
window.handleDashboardBan = async (event, userId, username) => {
  event.stopPropagation(); // 모달 팝업 방지
  const token = sessionStorage.getItem('token');
  if (!token) return;
  if (!confirm(`${username} 사용자를 강력 제재하시겠습니까?`)) return;
  try {
    const response = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      showToast(`${username} 사용자가 제재되었습니다.`, 'success');
      showToast('변경 내용은 새로고침 버튼을 누르면 대시보드에 반영됩니다.', 'info');
    } else {
      showToast('제재 처리 실패', 'error');
    }
  } catch (error) {
    console.error('Failed to ban user:', error);
  }
};

window.handleDashboardUnban = async (event, userId, username) => {
  event.stopPropagation(); // 모달 팝업 방지
  const token = sessionStorage.getItem('token');
  if (!token) return;
  if (!confirm(`${username} 사용자의 제재를 해제하시겠습니까?`)) return;
  try {
    const response = await fetch(`/api/admin/users/${userId}/unban`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      showToast(`${username} 사용자의 제재가 해제되었습니다.`, 'success');
      showToast('변경 내용은 새로고침 버튼을 누르면 대시보드에 반영됩니다.', 'info');
    } else {
      showToast('제재 해제 실패', 'error');
    }
  } catch (error) {
    console.error('Failed to unban user:', error);
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resetBehaviorLogPanel() {
  const panel = document.getElementById('admin-behavior-log-panel');
  const body = document.getElementById('admin-behavior-log-body');
  if (panel) panel.hidden = true;
  if (body) body.innerHTML = '';
}

function renderBehaviorLogPanel(log) {
  const panel = document.getElementById('admin-behavior-log-panel');
  const body = document.getElementById('admin-behavior-log-body');
  if (!panel || !body) return;

  const rawEventData = log && Object.prototype.hasOwnProperty.call(log, 'event_data')
    ? log.event_data
    : null;
  const eventDataText = JSON.stringify(rawEventData, null, 2);

  body.innerHTML = `
    <div class="admin-behavior-log__meta">
      <span>로그번호: #${escapeHtml(log.log_id)}</span>
      <span>유저 ID: #${escapeHtml(log.user_id ?? '-')}</span>
      <span>수집시각: ${escapeHtml(log.created_at || '-')}</span>
    </div>
    <pre class="admin-behavior-log__json">${escapeHtml(eventDataText)}</pre>
  `;
  panel.hidden = false;
}

async function openBehaviorLogDetail(logId) {
  const panel = document.getElementById('admin-behavior-log-panel');
  const body = document.getElementById('admin-behavior-log-body');
  if (!panel || !body) return;

  panel.hidden = false;
  body.innerHTML = '<span class="admin-log__msg">행동 로그를 불러오는 중...</span>';

  try {
    const response = await fetch(`/api/logs/${encodeURIComponent(logId)}`);
    if (!response.ok) {
      body.innerHTML = `<span class="admin-log__msg" style="color:var(--accent-red);">#${escapeHtml(logId)}에 대응하는 원본 행동 로그를 찾을 수 없습니다.</span>`;
      return;
    }

    const result = await response.json();
    if (!result || !result.log) {
      body.innerHTML = '<span class="admin-log__msg" style="color:var(--accent-red);">행동 로그 응답 형식이 올바르지 않습니다.</span>';
      return;
    }

    renderBehaviorLogPanel(result.log);
  } catch (error) {
    console.error('Failed to fetch behavior log:', error);
    body.innerHTML = '<span class="admin-log__msg" style="color:var(--accent-red);">서버와 연결할 수 없습니다.</span>';
  }
}

async function openAdminUserModal(data) {
  const userId = data.id.replace('#', '');
  const token = sessionStorage.getItem('token');

  const modal = document.getElementById('admin-user-modal');
  document.getElementById('admin-user-title').textContent = data.nicknameDisplay;
  const aiInfo = data.aiPredictedLabel && data.aiPredictedLabel !== '-' ? ` | AI 감지: ${data.aiPredictedLabel} (${data.aiProbability})` : '';
  document.getElementById('admin-user-id').textContent = `${data.idDisplay}${aiInfo} | 상태: ${data.status}`;

  const banBtn = document.getElementById('admin-btn-ban');
  if (banBtn) {
    if (data.isBanned === 1) {
      banBtn.textContent = '제재 해제';
      banBtn.style.background = 'var(--accent-cyan)';
      banBtn.style.borderColor = 'var(--accent-cyan)';
      banBtn.onclick = async (e) => {
        e.stopPropagation();
        const response = await fetch(`/api/admin/users/${userId}/unban`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          showToast('제재가 해제되었습니다.', 'success');
          modal.classList.remove('is-active');
          showToast('변경 내용은 새로고침 버튼을 누르면 대시보드에 반영됩니다.', 'info');
        } else {
          showToast('제재 해제 실패', 'error');
        }
      };
    } else {
      banBtn.textContent = '강력 제재';
      banBtn.style.background = 'var(--accent-red)';
      banBtn.style.borderColor = 'var(--accent-red)';
      banBtn.onclick = async (e) => {
        e.stopPropagation();
        const response = await fetch(`/api/admin/users/${userId}/ban`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          showToast('사용자가 제재되었습니다.', 'success');
          modal.classList.remove('is-active');
          showToast('변경 내용은 새로고침 버튼을 누르면 대시보드에 반영됩니다.', 'info');
        } else {
          showToast('제재 처리 실패', 'error');
        }
      };
    }
  }

  const watchBtn = document.getElementById('admin-btn-watch');
  if (watchBtn) {
    watchBtn.onclick = (e) => {
      e.stopPropagation();
      showToast(`${data.nicknameDisplay} 사용자가 감시 대상으로 지정되었습니다.`, 'info');
    };
  }

  modal.classList.add('is-active');
  resetBehaviorLogPanel();

  // Fetch AI predictions logs
  const predList = document.getElementById('admin-user-prediction-list');
  if (predList) {
    predList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg">데이터를 불러오는 중...</span></li>';
    
    fetch(`/api/admin/users/${userId}/predictions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(result => {
      if (!result) {
        predList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg" style="color:var(--accent-red);">데이터를 불러오지 못했습니다.</span></li>';
        return;
      }
      
      predList.innerHTML = '';
      if (result.predictions.length === 0) {
        predList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg">수집된 예측 로그가 없습니다.</span></li>';
        return;
      }
      
      result.predictions.forEach(p => {
        // Parse date properly
        const dateObj = new Date(p.created_at.replace(' ', 'T') + 'Z');
        const time = dateObj.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'Asia/Seoul'
        }) + ' ' + dateObj.toLocaleTimeString('ko-KR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Seoul'
        });
        
        let type = 'info';
        if (p.predictions === '위험' || p.predictions === '확신') {
          type = 'danger';
        } else if (p.predictions === '의심') {
          type = 'warning';
        } else if (p.predictions === '정상') {
          type = 'success';
        }
        
        const logId = String(p.log_id);
        const probability = Number(p.probability);
        const probabilityText = Number.isFinite(probability)
          ? (probability * 100).toFixed(1)
          : '0.0';
        const li = document.createElement('li');
        li.className = `admin-log__item admin-log__item--${type}`;
        li.innerHTML = `
          <span class="admin-log__time" style="font-size: 11px; white-space: nowrap; color: #94a3b8;">${time}</span>
          <span class="admin-log__msg">
            AI 분석: <strong>${escapeHtml(p.predictions)}</strong> (확률: ${probabilityText}%, 탐지핵: ${escapeHtml(p.predicted_label)}, 로그번호:
            <button class="admin-log-id-btn" type="button" data-log-id="${escapeHtml(logId)}">#${escapeHtml(logId)}</button>)
          </span>
        `;
        predList.appendChild(li);

        const logButton = li.querySelector('.admin-log-id-btn');
        if (logButton) {
          logButton.addEventListener('click', (event) => {
            event.stopPropagation();
            openBehaviorLogDetail(logId);
          });
        }
      });
    })
    .catch(err => {
      console.error(err);
      predList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg" style="color:var(--accent-red);">서버와 연결할 수 없습니다.</span></li>';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const closeBehaviorLogBtn = document.getElementById('admin-behavior-log-close');
  if (closeBehaviorLogBtn) {
    closeBehaviorLogBtn.addEventListener('click', resetBehaviorLogPanel);
  }
});
