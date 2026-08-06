(() => {
  const root = document.documentElement;
  const curve = document.getElementById('curve');
  const fez = document.getElementById('fez');
  const step3Button = document.querySelector('.step[data-step="3"]');
  if (!curve || !fez || !step3Button) return;

  const NS = 'http://www.w3.org/2000/svg';
  const timers = new Set();
  let runId = 0;

  const css = name => getComputedStyle(root).getPropertyValue(name).trim();
  const later = (fn, delay, id) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      if (id === runId && step3Button.classList.contains('active')) fn();
    }, delay);
    timers.add(timer);
  };

  function cancelEncodingAnimation() {
    runId += 1;
    timers.forEach(window.clearTimeout);
    timers.clear();
    curve.querySelectorAll('.encode-segment').forEach(el => el.remove());
    fez.querySelectorAll('.encode-pulse').forEach(el => el.classList.remove('encode-pulse'));
    curve.querySelectorAll('.encode-pulse').forEach(el => el.classList.remove('encode-pulse'));
  }

  function addSegmentPath(band, startCell, id) {
    const points = Array.from(
      curve.querySelectorAll(`.aggregate-point[data-band="${band}"]`)
    ).filter(point => {
      const cell = Number(point.dataset.cell);
      return cell >= startCell && cell < startCell + 16;
    }).sort((a, b) => Number(a.dataset.cell) - Number(b.dataset.cell));

    if (points.length < 2) return null;

    const d = points.map((point, index) => {
      const x = point.getAttribute('cx');
      const y = point.getAttribute('cy');
      return `${index ? 'L' : 'M'}${x},${y}`;
    }).join(' ');

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', css(band === 'g' ? '--filter-g' : '--filter-r'));
    path.setAttribute('stroke-width', '3.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('class', 'encode-segment');
    path.setAttribute('opacity', '1');
    curve.appendChild(path);

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.transition = 'none';

    requestAnimationFrame(() => {
      if (id !== runId) return;
      path.style.transition = 'stroke-dashoffset 920ms cubic-bezier(.2,.72,.2,1)';
      path.style.strokeDashoffset = '0';
    });
    return path;
  }

  function startEncodingAnimation() {
    cancelEncodingAnimation();
    const id = runId;

    window.setTimeout(() => {
      if (id !== runId || !step3Button.classList.contains('active')) return;

      const mainNodes = Array.from(fez.querySelectorAll('.main-node'));
      const bridgeNodes = Array.from(fez.querySelectorAll('.bridge-node'));
      const allEdges = Array.from(fez.querySelectorAll('.fez-edge'));
      const horizontalEdges = allEdges.slice(0, 8 * 15);
      const aggregatePoints = Array.from(curve.querySelectorAll('.aggregate-point'));
      const aggregateLines = Array.from(curve.querySelectorAll('.aggregate-line'));

      mainNodes.forEach(node => node.setAttribute('opacity', '0.13'));
      bridgeNodes.forEach(node => node.setAttribute('opacity', '0.16'));
      allEdges.forEach(edge => edge.setAttribute('opacity', '0.12'));
      aggregatePoints.forEach(point => point.setAttribute('opacity', '0.11'));
      aggregateLines.forEach(line => line.setAttribute('opacity', '0.10'));

      const pairRows = [[0, 1], [2, 3], [4, 5], [6, 7]];
      const blockLength = 1120;
      const columnDelay = 58;

      pairRows.forEach((rows, blockIndex) => {
        const startCell = blockIndex * 16;
        const blockStart = 180 + blockIndex * blockLength;

        later(() => {
          addSegmentPath('g', startCell, id);
          addSegmentPath('r', startCell, id);
        }, blockStart, id);

        for (let column = 0; column < 16; column++) {
          const delay = blockStart + 65 + column * columnDelay;
          later(() => {
            for (const row of rows) {
              const node = mainNodes[row * 16 + column];
              if (node) {
                node.setAttribute('opacity', '1');
                node.classList.add('encode-pulse');
                window.setTimeout(() => node.classList.remove('encode-pulse'), 360);
              }

              if (column > 0) {
                const edge = horizontalEdges[row * 15 + (column - 1)];
                if (edge) edge.setAttribute('opacity', '0.92');
              }
            }

            for (const band of ['g', 'r']) {
              const point = curve.querySelector(
                `.aggregate-point[data-band="${band}"][data-cell="${startCell + column}"]`
              );
              if (point) {
                point.setAttribute('opacity', '1');
                point.setAttribute('r', '5.1');
                point.classList.add('encode-pulse');
                window.setTimeout(() => point.classList.remove('encode-pulse'), 360);
              }
            }
          }, delay, id);
        }
      });

      later(() => {
        mainNodes.forEach(node => node.setAttribute('opacity', '1'));
        horizontalEdges.forEach(edge => edge.setAttribute('opacity', '0.92'));
        aggregatePoints.forEach(point => point.setAttribute('opacity', '1'));
        aggregateLines.forEach(line => line.setAttribute('opacity', '0.18'));
      }, 180 + pairRows.length * blockLength - 80, id);
    }, 30);
  }

  const style = document.createElement('style');
  style.textContent = `
    .encode-pulse { filter: drop-shadow(0 0 8px currentColor); }
    .encode-segment { pointer-events: none; filter: drop-shadow(0 0 2px currentColor); }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(() => {
    if (step3Button.classList.contains('active')) startEncodingAnimation();
    else cancelEncodingAnimation();
  });
  observer.observe(step3Button, { attributes: true, attributeFilter: ['class'] });

  step3Button.addEventListener('click', () => window.setTimeout(startEncodingAnimation, 0));
  if (step3Button.classList.contains('active')) startEncodingAnimation();
})();
