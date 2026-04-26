/* ═════════════════════════
   TOAST NOTIFICATIONS
   ═════════════════════════ */
function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconMap = {
    success: '✅',
    error: '❌',
    info: '💡',
    warning: '⚠️'
  };

  toast.innerHTML = `
    <span class="toast__icon">${iconMap[type] || '💡'}</span>
    <span class="toast__message">${message}</span>
  `;

  // Styles
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 24px',
    background: 'rgba(255, 255, 255, 0.97)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderLeft: '4px solid #e52d27',
    borderRadius: '10px',
    color: '#1e293b',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: '5000',
    animation: 'toastIn 0.4s ease',
    fontFamily: "'Noto Sans KR', sans-serif"
  });

  // Add animation keyframes
  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
      @keyframes toastIn {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes toastOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}
