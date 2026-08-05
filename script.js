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

  const rewindingSection = document.querySelector('#rewinding');
  if (rewindingSection && !document.querySelector('[data-fez-explainer-embed]')) {
    const oldFigure = rewindingSection.querySelector('[data-figure="qvr"]');
    const explainer = document.createElement('div');
    explainer.className = 'interactive-figure';
    explainer.setAttribute('data-fez-explainer-embed', '');
    explainer.innerHTML = `
      <div class="figure-header">
        <div>
          <p class="figure-label">Interactive method explainer</p>
          <h3>From an AGN light curve to the 156-qubit IBM Fez reservoir</h3>
        </div>
        <a class="text-link" href="fez-agn-explainer.html" target="_blank" rel="noopener">Open full screen ↗</a>
      </div>
      <iframe
        src="fez-agn-explainer.html"
        title="Interactive IBM Fez AGN quantum reservoir explainer"
        loading="lazy"
        style="display:block;width:100%;height:clamp(720px,78vw,980px);border:0;background:#081018;"
      ></iframe>
    `;

    if (oldFigure) oldFigure.before(explainer);
    else rewindingSection.append(explainer);
  }

  if (document.body.classList.contains('fez-page')) {
    window.addEventListener('load', () => {
      if (document.querySelector('script[data-fez-encode-animation]')) return;
      const script = document.createElement('script');
      script.src = 'fez-encode-animation.js?v=1';
      script.dataset.fezEncodeAnimation = '';
      document.body.appendChild(script);
    }, { once: true });
  }
})();
