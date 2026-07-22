(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('jdc-theme'); } catch (_) { savedTheme = null; }
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = savedTheme || (systemDark ? 'dark' : 'light');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('jdc-theme', next); } catch (_) { /* storage may be unavailable */ }
      window.dispatchEvent(new CustomEvent('themechange'));
    });
  }

  const header = document.querySelector('[data-header]');
  const setHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const phrase = document.querySelector('[data-rotating-phrase]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phrases = [
    'quantum computing.',
    'crypto agility.',
    'quantum spin lakes.',
    'scientific machine learning.',
    'institution building.'
  ];
  if (phrase && !reduceMotion) {
    let index = 0;
    window.setInterval(() => {
      phrase.classList.add('is-changing');
      window.setTimeout(() => {
        index = (index + 1) % phrases.length;
        phrase.textContent = phrases[index];
        phrase.classList.remove('is-changing');
      }, 220);
    }, 2600);
  }

  document.querySelectorAll('[data-gallery-image]').forEach(image => {
    const slot = image.closest('[data-photo-slot]');
    const markLoaded = () => slot?.classList.add('has-photo');
    const markMissing = () => slot?.classList.remove('has-photo');
    if (image.complete) {
      if (image.naturalWidth > 0) markLoaded(); else markMissing();
    }
    image.addEventListener('load', markLoaded);
    image.addEventListener('error', markMissing);
  });
})();
