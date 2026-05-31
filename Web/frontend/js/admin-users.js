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
        } else if (user.ai_status === '위험' || user.ai_status === '확신' || user.ai_status === '핵') {
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
        const isSuspicious = user.is_banned === 1 || ['의심', '위험', '확신', '핵'].includes(user.ai_status);
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

  // 초기 유저 렌더링
  await fetchAndRenderUsers();

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
      await fetchAndRenderUsers(); // 테이블 갱신
      if (typeof fetchAdminPredictions === 'function') fetchAdminPredictions(); // 로그 및 그래프 갱신
      if (typeof fetchPublicStats === 'function') fetchPublicStats(); // 대시보드 요약카드 갱신
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
      await fetchAndRenderUsers(); // 테이블 갱신
      if (typeof fetchAdminPredictions === 'function') fetchAdminPredictions(); // 로그 및 그래프 갱신
      if (typeof fetchPublicStats === 'function') fetchPublicStats(); // 대시보드 요약카드 갱신
    } else {
      showToast('제재 해제 실패', 'error');
    }
  } catch (error) {
    console.error('Failed to unban user:', error);
  }
};

async function openAdminUserModal(data) {
  // Reset modal tab to logs on open
  if (typeof tabsSwitch === 'function') {
    tabsSwitch('logs');
  }

  const userId = data.id.replace('#', '');
  const token = sessionStorage.getItem('token');

  const modal = document.getElementById('admin-user-modal');
  document.getElementById('admin-user-title').textContent = data.nicknameDisplay;
  const aiInfo = data.aiPredictedLabel && data.aiPredictedLabel !== '-' ? ` | AI 감지: ${data.aiPredictedLabel} (${data.aiProbability})` : '';
  document.getElementById('admin-user-id').textContent = `${data.idDisplay}${aiInfo} | 상태: ${data.status}`;

  // 실시간 4대 핵 탐지 수치 갱신 (Speed, ESP, GodMode, Aim)
  const speedEl = document.getElementById('modal-speed-pct');
  const godEl = document.getElementById('modal-god-pct');
  const espEl = document.getElementById('modal-esp-pct');
  const aimEl = document.getElementById('modal-aim-pct');
  
  if (speedEl) speedEl.textContent = '0.0%';
  if (godEl) godEl.textContent = '0.0%';
  if (espEl) espEl.textContent = '0.0%';
  if (aimEl) aimEl.textContent = '0.0%';

  // 우측 제재 상태 카드 데이터 바인딩
  const banStatusCard = document.getElementById('admin-user-ban-status-card');
  if (banStatusCard) {
    if (data.isBanned === 1) {
      banStatusCard.innerHTML = `
        <span style="font-size: 40px; filter: drop-shadow(0 0 10px rgba(229,45,39,0.3));">🚫</span>
        <span style="font-size: 16px; font-weight: 700; color: var(--accent-red);">강력 제재 중</span>
        <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.4; word-break: keep-all;">불법 프로그램 의심 대상자로 지정되어 게임 플레이 및 접속이 즉각 차단되었습니다.</p>
      `;
    } else {
      banStatusCard.innerHTML = `
        <span style="font-size: 40px; filter: drop-shadow(0 0 10px rgba(74,222,128,0.3));">✅</span>
        <span style="font-size: 16px; font-weight: 700; color: #4ade80;">정상 상태</span>
        <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.4; word-break: keep-all;">보안 우회나 핵 감지 이력이 검출되지 않은 정상 활동 플레이어입니다.</p>
      `;
    }
  }

  try {
    const response = await fetch(`/api/admin/users/${userId}/hack-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const analyzeData = await response.json();
      const pctList = analyzeData.hack_percentages_list; // [Speed, ESP, GodMode, Aim]
      if (pctList && pctList.length === 4) {
        if (speedEl) speedEl.textContent = `${pctList[0]}%`;
        if (espEl) espEl.textContent = `${pctList[1]}%`; // ESP
        if (godEl) godEl.textContent = `${pctList[2]}%`; // GodMode
        if (aimEl) aimEl.textContent = `${pctList[3]}%`; // Aim
      }
    }
  } catch (err) {
    console.error('Failed to fetch user hack percentages:', err);
  }

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
          await fetchAndRenderUsers(); // 리스트 갱신
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
          await fetchAndRenderUsers(); // 리스트 갱신
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

  const logList = document.getElementById('admin-user-log-list');
  logList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg">데이터를 불러오는 중...</span></li>';
  
  const sanctionHistoryList = document.getElementById('admin-user-sanction-history');
  if (sanctionHistoryList) {
    sanctionHistoryList.innerHTML = '<li style="font-size: 12px; color: #64748b; padding: 4px;">데이터를 불러오는 중...</li>';
  }
  
  modal.classList.add('is-active');

  // Fetch sanction history
  if (sanctionHistoryList) {
    fetch(`/api/admin/users/${userId}/sanctions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(result => {
      if (!result) {
        sanctionHistoryList.innerHTML = '<li style="font-size: 12px; color: var(--accent-red); padding: 4px;">불러오기 실패</li>';
        return;
      }
      sanctionHistoryList.innerHTML = '';
      if (result.sanctions.length === 0) {
        sanctionHistoryList.innerHTML = '<li style="font-size: 12px; color: #64748b; padding: 4px;">제재 이력이 없습니다.</li>';
      } else {
        result.sanctions.forEach(s => {
          const actionText = s.action === 'ban' ? '제재' : '해제';
          const badgeClass = s.action === 'ban' ? 'color: var(--accent-red);' : 'color: var(--accent-cyan);';
          
          // Parse date properly supporting SQLite format
          const dateObj = new Date(s.created_at.replace(' ', 'T') + 'Z');
          const dateText = dateObj.toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit'
          }) + ' ' + dateObj.toLocaleTimeString('ko-KR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });

          const li = document.createElement('li');
          li.style.cssText = 'font-size: 12px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; flex-direction: column; gap: 2px;';
          li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; ${badgeClass}">[${actionText}]</span>
              <span style="color: #64748b; font-size: 11px;">${dateText}</span>
            </div>
            <div style="color: #cbd5e1; font-size: 11px; word-break: break-all;">${s.reason || ''}</div>
          `;
          sanctionHistoryList.appendChild(li);
        });
      }
    })
    .catch(err => {
      console.error(err);
      sanctionHistoryList.innerHTML = '<li style="font-size: 12px; color: var(--accent-red); padding: 4px;">서버 연결 실패</li>';
    });
  }

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
        // 한국 표준시(KST) 및 날짜 시간 출력
        const dateObj = new Date(log.created_at.replace(' ', 'T') + 'Z');
        const time = dateObj.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) + ' ' + dateObj.toLocaleTimeString('ko-KR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
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
              <span class="admin-log__time" style="font-size: 11px; white-space: nowrap; color: #94a3b8;">${time}</span>
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
          day: '2-digit'
        }) + ' ' + dateObj.toLocaleTimeString('ko-KR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        let type = 'info';
        if (p.predictions === '위험' || p.predictions === '확신' || p.predictions === '핵') {
          type = 'danger';
        } else if (p.predictions === '의심') {
          type = 'warning';
        } else if (p.predictions === '정상') {
          type = 'success';
        }
        
        const li = document.createElement('li');
        li.className = `admin-log__item admin-log__item--${type}`;
        li.innerHTML = `
          <span class="admin-log__time" style="font-size: 11px; white-space: nowrap; color: #94a3b8;">${time}</span>
          <span class="admin-log__msg">
            AI 분석: <strong>${p.predictions}</strong> (확률: ${(p.probability * 100).toFixed(1)}%, 탐지핵: ${p.predicted_label}, 로그번호: #${p.log_id})
          </span>
        `;
        predList.appendChild(li);
      });
    })
    .catch(err => {
      console.error(err);
      predList.innerHTML = '<li class="admin-log__item"><span class="admin-log__msg" style="color:var(--accent-red);">서버와 연결할 수 없습니다.</span></li>';
    });
  }
}

/**
 * 모달 내 탭 전환 제어 함수
 */
function tabsSwitch(target) {
  const tabs = document.querySelectorAll('[data-modal-tab]');
  tabs.forEach(t => {
    if (t.dataset.modalTab === target) {
      t.classList.add('active');
      t.style.color = 'var(--text-primary)';
      t.style.borderBottomColor = 'var(--accent-red)';
      t.style.fontWeight = '700';
    } else {
      t.classList.remove('active');
      t.style.color = 'var(--text-muted)';
      t.style.borderBottomColor = 'transparent';
      t.style.fontWeight = '600';
    }
  });

  const logsView = document.getElementById('modal-tab-view-logs');
  const sanctionsView = document.getElementById('modal-tab-view-sanctions');
  if (target === 'logs') {
    if (logsView) logsView.style.display = 'block';
    if (sanctionsView) sanctionsView.style.display = 'none';
  } else {
    if (logsView) logsView.style.display = 'none';
    if (sanctionsView) sanctionsView.style.display = 'block';
  }
}

// DOM 로드 완료 후 탭 클릭 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('[data-modal-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabsSwitch(tab.dataset.modalTab);
    });
  });
});
