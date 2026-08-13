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

  const demoVideos = [...document.querySelectorAll('.demo-card video')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    demoVideos.forEach((video) => video.pause());
  } else if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '120px 0px', threshold: 0.15 });

    demoVideos.forEach((video) => videoObserver.observe(video));
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
