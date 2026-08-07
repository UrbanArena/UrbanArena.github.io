(() => {
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  const stage = document.querySelector('[data-scene]');
  const clock = document.querySelector('[data-clock]');
  const weather = document.querySelector('[data-weather]');
  const toast = document.querySelector('[data-toast]');

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  navToggle?.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('is-open', !open);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle?.setAttribute('aria-expanded', 'false');
      nav?.classList.remove('is-open');
    });
  });

  const scenes = {
    day: { clock: '12:15', weather: 'Clear day' },
    dusk: { clock: '18:40', weather: 'Dusk' },
    rain: { clock: '15:20', weather: 'Rain' },
    night: { clock: '22:10', weather: 'Night' },
  };

  document.querySelectorAll('[data-set-scene]').forEach((button) => {
    button.addEventListener('click', () => {
      const scene = button.dataset.setScene;
      if (!stage || !scenes[scene]) return;
      stage.dataset.scene = scene;
      document.querySelectorAll('[data-set-scene]').forEach((item) => item.classList.toggle('is-active', item === button));
      if (clock) clock.textContent = scenes[scene].clock;
      if (weather) weather.textContent = scenes[scene].weather;
    });
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  revealItems.forEach((item) => item.style.setProperty('--delay', `${item.dataset.delay || 0}ms`));
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    revealItems.forEach((item) => observer.observe(item));
  }

  const copyButton = document.querySelector('[data-copy-bib]');
  const bibtex = document.querySelector('[data-bibtex]');
  let toastTimer;
  const showCopiedState = () => {
    const label = copyButton?.querySelector('span');
    if (label) label.textContent = 'Copied';
    toast?.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast?.classList.remove('is-visible');
      if (label) label.textContent = 'Copy BibTeX';
    }, 1800);
  };

  copyButton?.addEventListener('click', async () => {
    const value = bibtex?.textContent?.trim();
    if (!value) return;
    showCopiedState();
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
  });
})();
