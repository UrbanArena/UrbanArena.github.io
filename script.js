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
  let gameStarted = false;

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

    const frame = document.createElement('iframe');
    frame.className = 'play-frame';
    frame.title = 'UrbanArena interactive Unity sandbox';
    frame.src = 'play/';
    frame.allow = 'fullscreen; gamepad';
    frame.setAttribute('allowfullscreen', '');
    frame.addEventListener('load', () => {
      playStage.classList.remove('is-loading');
      playStage.classList.add('is-playing');
    });

    playStage.replaceChildren(frame);
    frame.focus();
  };

  playStart?.addEventListener('click', startEmbeddedGame);

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
