(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stepButtons = [...document.querySelectorAll('.step[data-step]')];
  const stepThreeButton = document.querySelector('.step[data-step="3"]');
  const curve = document.getElementById('curve');
  const fez = document.getElementById('fez');

  if (!stepThreeButton || !curve || !fez) return;

  let animations = [];
  let overlays = [];
  let rerunTimer = null;

  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    overlays.forEach(overlay => overlay.remove());
    overlays = [];
    clearTimeout(rerunTimer);
  }

  function clearInlineState() {
    cancelAnimations();
    document.querySelectorAll(
      '#fez .main-node, #fez .bridge-node, #fez .fez-edge, ' +
      '#curve .aggregate-point, #curve .aggregate-line, #curve .raw-point'
    ).forEach(element => {
      element.style.removeProperty('opacity');
      element.style.removeProperty('filter');
      element.style.removeProperty('transform');
      element.style.removeProperty('transform-origin');
    });
  }

  function pointsFor(band, startCell, endCell) {
    return [...curve.querySelectorAll(`.aggregate-point[data-band="${band}"]`)]
      .filter(point => {
        const cell = Number(point.dataset.cell);
        return cell >= startCell && cell <= endCell;
      })
      .sort((a, b) => Number(a.dataset.cell) - Number(b.dataset.cell));
  }

  function rawPointsFor(startCell, endCell) {
    return [...curve.querySelectorAll('.raw-point')].filter(point => {
      const cell = Number(point.dataset.cell);
      return cell >= startCell && cell <= endCell;
    });
  }

  function makeSegmentOverlay(band, blockIndex) {
    const startCell = blockIndex * 16;
    const endCell = startCell + 15;
    const points = pointsFor(band, startCell, endCell);
    if (points.length !== 16) return null;

    const d = points.map((point, index) => {
      const prefix = index === 0 ? 'M' : 'L';
      return `${prefix}${point.getAttribute('cx')},${point.getAttribute('cy')}`;
    }).join('');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', css(band === 'g' ? '--filter-g' : '--filter-r'));
    path.setAttribute('stroke-width', '4.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('opacity', '0');
    path.setAttribute('pointer-events', 'none');
    path.classList.add('encode-segment-overlay');
    curve.appendChild(path);
    overlays.push(path);
    return path;
  }

  function animateOpacity(element, from, to, delay, duration, extraFrames = {}) {
    const start = { opacity: from, ...extraFrames.start };
    const end = { opacity: to, ...extraFrames.end };
    const animation = element.animate([start, end], {
      duration,
      delay,
      easing: 'cubic-bezier(.18,.72,.18,1)',
      fill: 'forwards'
    });
    animations.push(animation);
    return animation;
  }

  function animateEncoding() {
    clearInlineState();

    const mainNodes = [...fez.querySelectorAll('.main-node')];
    const allEdges = [...fez.querySelectorAll('.fez-edge')];
    const horizontalEdges = allEdges.slice(0, 120);
    const bridgeEdges = allEdges.slice(120);
    const bridgeNodes = [...fez.querySelectorAll('.bridge-node')];
    const aggregatePoints = [...curve.querySelectorAll('.aggregate-point')];
    const aggregateLines = [...curve.querySelectorAll('.aggregate-line')];
    const rawPoints = [...curve.querySelectorAll('.raw-point')];

    if (mainNodes.length !== 128 || horizontalEdges.length !== 120 || aggregatePoints.length !== 128) {
      rerunTimer = window.setTimeout(animateEncoding, 80);
      return;
    }

    mainNodes.forEach(node => { node.style.opacity = '0.12'; });
    horizontalEdges.forEach(edge => { edge.style.opacity = '0.14'; });
    bridgeNodes.forEach(node => { node.style.opacity = '0.16'; });
    bridgeEdges.forEach(edge => { edge.style.opacity = '0.16'; });
    aggregatePoints.forEach(point => { point.style.opacity = '0.13'; });
    aggregateLines.forEach(line => { line.style.opacity = '0.10'; });
    rawPoints.forEach(point => { point.style.opacity = '0.05'; });

    const blockInterval = reduceMotion ? 180 : 1050;
    const nodeDuration = reduceMotion ? 1 : 720;
    const segmentDuration = reduceMotion ? 1 : 820;

    for (let block = 0; block < 4; block++) {
      const delay = block * blockInterval;
      const rowA = block * 2;
      const rowB = rowA + 1;
      const startCell = block * 16;
      const endCell = startCell + 15;

      const rowNodes = [
        ...mainNodes.slice(rowA * 16, rowA * 16 + 16),
        ...mainNodes.slice(rowB * 16, rowB * 16 + 16)
      ];
      const rowEdges = [
        ...horizontalEdges.slice(rowA * 15, rowA * 15 + 15),
        ...horizontalEdges.slice(rowB * 15, rowB * 15 + 15)
      ];

      rowNodes.forEach((node, index) => {
        const circle = node.querySelector('circle');
        const glow = circle?.getAttribute('fill') || css('--accent');
        animateOpacity(node, 0.12, 1, delay + (index % 16) * 18, nodeDuration, {
          start: { filter: 'drop-shadow(0 0 0px transparent)' },
          end: { filter: `drop-shadow(0 0 7px ${glow})` }
        });
      });

      rowEdges.forEach((edge, index) => {
        animateOpacity(edge, 0.14, 0.92, delay + index * 12, nodeDuration);
      });

      for (const band of ['g', 'r']) {
        const points = pointsFor(band, startCell, endCell);
        points.forEach((point, localIndex) => {
          const glow = css(band === 'g' ? '--filter-g' : '--filter-r');
          animateOpacity(point, 0.13, 1, delay + localIndex * 22, nodeDuration, {
            start: { filter: 'drop-shadow(0 0 0px transparent)' },
            end: { filter: `drop-shadow(0 0 6px ${glow})` }
          });
        });

        const overlay = makeSegmentOverlay(band, block);
        if (overlay) {
          const length = overlay.getTotalLength();
          overlay.style.strokeDasharray = `${length}`;
          overlay.style.strokeDashoffset = `${length}`;
          const animation = overlay.animate([
            { opacity: 0, strokeDashoffset: length },
            { opacity: 1, strokeDashoffset: 0 }
          ], {
            duration: segmentDuration,
            delay,
            easing: 'cubic-bezier(.18,.72,.18,1)',
            fill: 'forwards'
          });
          animations.push(animation);
        }
      }

      rawPointsFor(startCell, endCell).forEach((point, index) => {
        animateOpacity(point, 0.05, 0.20, delay + (index % 16) * 10, nodeDuration);
      });
    }
  }

  function syncToCurrentStep() {
    if (stepThreeButton.classList.contains('active')) {
      requestAnimationFrame(() => requestAnimationFrame(animateEncoding));
    } else {
      clearInlineState();
    }
  }

  const observer = new MutationObserver(syncToCurrentStep);
  stepButtons.forEach(button => observer.observe(button, { attributes: true, attributeFilter: ['class'] }));

  stepThreeButton.addEventListener('click', () => {
    window.setTimeout(syncToCurrentStep, 20);
  });

  window.addEventListener('themechange', () => {
    window.setTimeout(syncToCurrentStep, 80);
  });
})();
