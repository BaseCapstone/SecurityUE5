/* ═══════════════════════════════════════════════════
   LYRA SHIELD — Synthesized Audio SFX System
   ═══════════════════════════════════════════════════ */

let isSoundEnabled = false;
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSynthSound(type) {
  if (!isSoundEnabled) return;
  initAudioContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  if (type === 'hover') {
    // Subtle cyber click/blip
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
    
    gain.gain.setValueAtTime(0.008, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'click') {
    // Tactical metallic UI click
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'launch') {
    // Epic cyber launcher chime (major arpeggio upward sweep)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const delay = index * 0.05;
      
      osc.type = 'sawtooth';
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + delay);
      filter.frequency.exponentialRampToValueAtTime(800, now + delay + 0.2);
      
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + delay + 0.2);
      
      gain.gain.setValueAtTime(0.008, now + delay);
      gain.gain.linearRampToValueAtTime(0.012, now + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.25);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  }
}

function initSoundSystem() {
  const soundToggle = document.getElementById('sound-toggle');
  if (!soundToggle) return;
  
  // Load initial settings
  const savedSound = localStorage.getItem('lyra_sound');
  if (savedSound === 'enabled') {
    isSoundEnabled = true;
    soundToggle.classList.add('sound-toggle--enabled');
  } else {
    isSoundEnabled = false;
    soundToggle.classList.remove('sound-toggle--enabled');
  }
  
  soundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('lyra_sound', isSoundEnabled ? 'enabled' : 'disabled');
    
    if (isSoundEnabled) {
      initAudioContext();
      soundToggle.classList.add('sound-toggle--enabled');
      playSynthSound('click');
    } else {
      soundToggle.classList.remove('sound-toggle--enabled');
    }
  });

  // Attach hover and click sounds to all interactive elements
  const attachAudioToSelectors = () => {
    const interactiveElements = document.querySelectorAll(
      '.nav-link, .top-bar__logo, .theme-toggle, .sound-toggle, .btn, .feature-card, .faq-trigger, .card, .section-header__more'
    );
    
    interactiveElements.forEach(el => {
      // Avoid duplicate event listener bindings
      if (el.dataset.audioBound) return;
      el.dataset.audioBound = 'true';
      
      el.addEventListener('mouseenter', () => {
        playSynthSound('hover');
      });
      
      el.addEventListener('click', () => {
        if (el.id === 'game-start-btn' || el.id === 'hero-btn-play-1' || el.id === 'hero-btn-play-2' || el.id === 'hero-btn-play-3') {
          playSynthSound('launch');
        } else {
          playSynthSound('click');
        }
      });
    });
  };

  attachAudioToSelectors();
  
  // Re-run attachment when section changes (for dynamically generated cards or sub-tabs)
  window.addEventListener('hashchange', () => {
    setTimeout(attachAudioToSelectors, 100);
  });
}
