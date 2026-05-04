/* ═════════════════════════
   ADMIN USERS — 사용자 관리 대시보드 스크립트
   ═════════════════════════ */

/**
 * 사용자 관리 페이지: 검색, 정렬, 상세 모달 초기화
 */
function initUserManagement() {
  const searchInput = document.getElementById('user-search-input');
  const tbody = document.getElementById('all-users-tbody');
  const headers = document.querySelectorAll('#all-users-table .sortable');
  
  if (!searchInput || !tbody) return;

  // 테이블 행 데이터를 배열로 저장
  const rows = Array.from(tbody.querySelectorAll('tr'));
  let userData = rows.map(row => {
    const cells = row.querySelectorAll('td');
    if(cells.length < 6) return null;
    
    // 점수 숫자 추출
    const scoreText = cells[4].textContent.trim();
    const scoreNum = parseInt(scoreText.replace(/[^0-9]/g, '')) || 0;
    
    return {
      element: row,
      id: cells[0].textContent.trim().toLowerCase(),
      idDisplay: cells[0].textContent.trim(),
      nickname: cells[1].textContent.trim().toLowerCase(),
      nicknameDisplay: cells[1].textContent.trim(),
      date: cells[2].textContent.trim(),
      lastLogin: cells[3].textContent.trim(),
      score: scoreNum,
      scoreDisplay: scoreText,
      status: cells[5].textContent.trim()
    };
  }).filter(Boolean);

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
      data.element.addEventListener('click', () => {
        openAdminUserModal(data);
      });
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
function openAdminUserModal(data) {
  const modal = document.getElementById('admin-user-modal');
  document.getElementById('admin-user-title').textContent = data.nicknameDisplay;
  document.getElementById('admin-user-id').textContent = data.idDisplay;
  document.getElementById('admin-user-score').textContent = data.scoreDisplay;
  
  // 상태에 따른 로그 프레임워크 표시
  const logList = document.getElementById('admin-user-log-list');
  logList.innerHTML = '';
  
  // 더미 로그 생성 (점수나 상태에 따라 유동적으로 표시)
  let logs = [];
  if(data.score < 50) {
    logs.push({ time: '18:24', msg: '에임봇 패턴 의심 (정확도 비정상)', type: 'danger' });
    logs.push({ time: '17:10', msg: '비정상 이동 속도 감지', type: 'warning' });
  } else if (data.score < 80) {
    logs.push({ time: '15:20', msg: '짧은 시간 다수 킬 발생 (모니터링)', type: 'warning' });
  } else {
    logs.push({ time: '12:00', msg: '정상적인 플레이 패턴 확인', type: 'info' });
  }

  logs.forEach(log => {
    const li = document.createElement('li');
    li.className = `admin-log__item admin-log__item--${log.type}`;
    li.innerHTML = `
      <span class="admin-log__time">${log.time}</span>
      <span class="admin-log__msg">${log.msg}</span>
    `;
    logList.appendChild(li);
  });

  modal.classList.add('is-active');
}
