(() => {
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  const toast = document.querySelector('[data-toast]');

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

  const copyButton = document.querySelector('[data-copy-bib]');
  const bibtex = document.querySelector('[data-bibtex]');
  let toastTimer;

  const showCopiedState = () => {
    if (copyButton) copyButton.textContent = 'Copied';
    toast?.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast?.classList.remove('is-visible');
      if (copyButton) copyButton.textContent = 'Copy BibTeX';
    }, 1700);
  };

  copyButton?.addEventListener('click', async () => {
    const value = bibtex?.textContent?.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }

    showCopiedState();
  });
})();
