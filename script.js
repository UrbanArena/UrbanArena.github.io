(() => {
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    nav?.classList.toggle('is-open', !isOpen);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle?.setAttribute('aria-expanded', 'false');
      nav?.classList.remove('is-open');
    });
  });

  const playStage = document.querySelector('[data-play-stage]');
  const playStart = document.querySelector('[data-play-start]');
  const controlModes = [...document.querySelectorAll('[data-control-mode]')];
  const agentForm = document.querySelector('[data-agent-form]');
  const agentStatus = document.querySelector('[data-agent-status]');
  const desktopNotice = document.querySelector('[data-desktop-notice]');
  const desktopNoticeClose = document.querySelector('[data-desktop-notice-close]');
  let gameStarted = false;
  let gameFrame = null;
  let unityReady = false;
  let pendingAgentConfig = null;

  const isMobileDevice = () => {
    if (navigator.userAgentData?.mobile) return true;
    if (/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(navigator.userAgent)) return true;
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  };

  const requestDesktop = () => {
    if (!isMobileDevice()) return false;
    if (desktopNotice?.showModal) desktopNotice.showModal();
    else window.alert('UrbanArena requires a desktop computer. Please open this page on a desktop browser to play.');
    return true;
  };

  const setAgentStatus = (message) => {
    if (agentStatus) agentStatus.textContent = message;
  };

  const sendAgentMessage = (type, config) => {
    if (!gameFrame?.contentWindow || !unityReady) return false;
    gameFrame.contentWindow.postMessage({ type, ...(config || {}) }, window.location.origin);
    return true;
  };

  const selectControlMode = (mode) => {
    const useAgent = mode === 'agent';
    controlModes.forEach((button) => {
      const active = button.dataset.controlMode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (agentForm) agentForm.hidden = !useAgent;

    if (!useAgent) {
      if (gameFrame?.contentWindow) {
        gameFrame.contentWindow.postMessage({ type: 'urbanarena:agent-stop' }, window.location.origin);
      }
      pendingAgentConfig = null;
      playStage?.classList.remove('is-agent-controlled');
      agentForm?.reset();
      setAgentStatus('The API key is sent only to the API URL you provide.');
    }
  };

  const startEmbeddedGame = () => {
    if (!playStage || gameStarted) return;
    if (!crossOriginIsolated) {
      sessionStorage.setItem('urbanarenaStartAfterReload', '1');
      window.location.reload();
      return;
    }

    gameStarted = true;
    sessionStorage.removeItem('urbanarenaStartAfterReload');
    playStage.classList.add('is-loading');
    playStart?.setAttribute('aria-busy', 'true');

    gameFrame = document.createElement('iframe');
    gameFrame.className = 'play-frame';
    gameFrame.title = 'UrbanArena interactive Unity sandbox';
    gameFrame.src = 'play/';
    gameFrame.allow = 'fullscreen; gamepad';
    gameFrame.setAttribute('allowfullscreen', '');
    gameFrame.addEventListener('load', () => {
      playStage.classList.remove('is-loading');
      playStage.classList.add('is-playing');
    });

    playStage.replaceChildren(gameFrame);
    gameFrame.focus();
  };

  playStart?.addEventListener('click', () => {
    if (!requestDesktop()) startEmbeddedGame();
  });
  desktopNoticeClose?.addEventListener('click', () => desktopNotice?.close());

  controlModes.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.controlMode;
      if (mode === 'agent' && requestDesktop()) return;
      if (mode === 'agent' && !crossOriginIsolated) {
        sessionStorage.setItem('urbanarenaControlAfterReload', 'agent');
        startEmbeddedGame();
        return;
      }
      selectControlMode(mode);
      if (mode === 'agent') agentForm?.querySelector('input')?.focus();
    });
  });

  agentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!agentForm.reportValidity()) return;

    const formData = new FormData(agentForm);
    const endpoint = String(formData.get('endpoint') || '').trim();
    const apiKey = String(formData.get('apiKey') || '');
    const model = String(formData.get('model') || '').trim();
    let endpointUrl;
    try {
      endpointUrl = new URL(endpoint);
    } catch {
      agentForm.elements.endpoint.setCustomValidity('Enter a complete API URL.');
      agentForm.reportValidity();
      return;
    }
    if (!['http:', 'https:'].includes(endpointUrl.protocol)) {
      agentForm.elements.endpoint.setCustomValidity('Use an HTTP or HTTPS API URL.');
      agentForm.reportValidity();
      return;
    }
    agentForm.elements.endpoint.setCustomValidity('');

    pendingAgentConfig = { endpoint: endpointUrl.href, apiKey, model };
    setAgentStatus(gameStarted ? 'Waiting for UrbanArena to finish loading…' : 'Starting UrbanArena…');
    startEmbeddedGame();
    if (sendAgentMessage('urbanarena:agent-start', pendingAgentConfig)) {
      pendingAgentConfig = null;
      agentForm.elements.apiKey.value = '';
      setAgentStatus('Agent is taking control and beginning its exploration.');
    }
  });

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== gameFrame?.contentWindow) return;
    if (event.data?.type === 'urbanarena:unity-ready') {
      unityReady = true;
      if (pendingAgentConfig && sendAgentMessage('urbanarena:agent-start', pendingAgentConfig)) {
        pendingAgentConfig = null;
        if (agentForm) agentForm.elements.apiKey.value = '';
        setAgentStatus('Agent is taking control and beginning its exploration.');
      }
      return;
    }
    if (event.data?.type === 'urbanarena:agent-state') {
      if (event.data.state === 'running') {
        playStage?.classList.add('is-agent-controlled');
        setAgentStatus('Agent has control and is exploring UrbanArena.');
      } else if (event.data.state === 'stopped') {
        playStage?.classList.remove('is-agent-controlled');
      } else if (event.data.state === 'error') {
        setAgentStatus(event.data.message || 'The model endpoint could not be reached.');
      }
    }
  });

  if (sessionStorage.getItem('urbanarenaControlAfterReload') === 'agent') {
    selectControlMode('agent');
    if (crossOriginIsolated) sessionStorage.removeItem('urbanarenaControlAfterReload');
  }
  if (sessionStorage.getItem('urbanarenaStartAfterReload') === '1') {
    document.querySelector('#play-online')?.scrollIntoView({ block: 'center' });
    startEmbeddedGame();
  }

  const demoVideos = [...document.querySelectorAll('.demo-card video')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loadVideo = (video) => {
    if (video.dataset.loaded === 'true') return;
    const source = video.querySelector('source[data-src]');
    if (!source) return;
    source.src = source.dataset.src;
    video.dataset.loaded = 'true';
    video.load();
  };

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          loadVideo(video);
          if (!reduceMotion) {
            video.play().catch(() => {
              video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
            });
          }
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '160px 0px', threshold: 0.1 });

    demoVideos.forEach((video) => videoObserver.observe(video));
  } else {
    demoVideos.forEach((video) => {
      loadVideo(video);
      if (!reduceMotion) video.play().catch(() => {});
    });
  }

  const figureButtons = [...document.querySelectorAll('[data-figure-src]')];
  const selectedImage = document.querySelector('[data-selected-image]');
  const selectedTitle = document.querySelector('[data-selected-title]');
  const selectedCaption = document.querySelector('[data-selected-caption]');

  figureButtons.forEach((button) => {
    const preload = new Image();
    preload.src = button.dataset.figureSrc;

    button.addEventListener('click', () => {
      if (!selectedImage) return;

      figureButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      selectedImage.classList.add('is-changing');
      const applySelection = () => {
        selectedImage.src = button.dataset.figureSrc;
        selectedImage.alt = `Figure 2 panel: ${button.dataset.figureTitle}`;
        if (selectedTitle) selectedTitle.textContent = button.dataset.figureTitle;
        if (selectedCaption) selectedCaption.textContent = button.dataset.figureCaption;
        requestAnimationFrame(() => selectedImage.classList.remove('is-changing'));
      };

      window.setTimeout(applySelection, 90);
    });
  });

})();
