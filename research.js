(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const root = document.documentElement;
  const css = name => getComputedStyle(root).getPropertyValue(name).trim();
  const make = (tag, attrs = {}, text = '') => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text) el.textContent = text;
    return el;
  };
  const pathFrom = points => points.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');

  const snObjects = [
    { score: 23, label: 'ordinary', amp: 105, width: 20, decay: 55, colorShift: 0, insight: '<strong>What to notice:</strong> the broader peak and slower decay resemble common transient classes, so the classifier assigns a lower Ibn score.' },
    { score: 84, label: 'Ibn-like', amp: 148, width: 12, decay: 28, colorShift: 5, insight: '<strong>What to notice:</strong> the fast rise and narrower post-peak evolution remain visible after interpolation, giving the classifier a comparable shape representation.' },
    { score: 56, label: 'ambiguous', amp: 125, width: 16, decay: 40, colorShift: -7, insight: '<strong>What to notice:</strong> sparse coverage around the peak leaves multiple plausible shapes, widening uncertainty and producing an intermediate score.' }
  ];
  let showUncertainty = true;

  function drawSupernova() {
    const svg = document.getElementById('sn-chart');
    if (!svg) return;
    svg.replaceChildren();
    const objectIndex = Number(document.getElementById('sn-object').value);
    const smoothness = Number(document.getElementById('sn-smooth').value);
    const obj = snObjects[objectIndex];
    const W = 900, H = 420, left = 72, right = 30, top = 28, bottom = 58;
    const width = W - left - right, height = H - top - bottom;
    const ink = css('--ink'), muted = css('--muted'), line = css('--line'), accent = css('--accent'), blue = css('--blue'), white = css('--white');

    const x = day => left + ((day + 35) / 125) * width;
    const flux = day => {
      const rise = Math.exp(-Math.pow((day - obj.colorShift) / obj.width, 2));
      const tail = day > obj.colorShift ? Math.exp(-(day - obj.colorShift) / obj.decay) : 1;
      return 18 + obj.amp * rise * tail + 9 * Math.exp(-Math.pow((day - 42) / 18, 2));
    };
    const y = value => top + height - (value / 180) * height;

    for (let gy = 0; gy <= 4; gy++) {
      const yy = top + (gy / 4) * height;
      svg.append(make('line', { x1: left, y1: yy, x2: W - right, y2: yy, stroke: line, 'stroke-width': 1 }));
      const label = `${Math.round(180 - gy * 45)}`;
      svg.append(make('text', { x: left - 12, y: yy + 4, fill: muted, 'text-anchor': 'end', 'font-size': 10, 'font-family': 'ui-monospace, monospace' }, label));
    }
    [-30, 0, 30, 60, 90].forEach(day => {
      const xx = x(day);
      svg.append(make('line', { x1: xx, y1: top, x2: xx, y2: H - bottom, stroke: line, 'stroke-width': 1 }));
      svg.append(make('text', { x: xx, y: H - bottom + 24, fill: muted, 'text-anchor': 'middle', 'font-size': 10, 'font-family': 'ui-monospace, monospace' }, `${day}`));
    });
    svg.append(make('text', { x: left + width / 2, y: H - 12, fill: muted, 'text-anchor': 'middle', 'font-size': 10, 'font-family': 'ui-monospace, monospace' }, 'DAYS RELATIVE TO PEAK'));
    const yLabel = make('text', { x: 16, y: top + height / 2, fill: muted, 'text-anchor': 'middle', 'font-size': 10, 'font-family': 'ui-monospace, monospace', transform: `rotate(-90 16 ${top + height / 2})` }, 'RELATIVE FLUX');
    svg.append(yLabel);

    const modelPts = [];
    const upper = [], lower = [];
    for (let day = -35; day <= 90; day += 1.5) {
      const model = flux(day) + Math.sin(day / (7 + smoothness)) * (10 - smoothness) * .8;
      const gap = (13 - smoothness) + 20 * Math.exp(-Math.pow((day - 8) / 25, 2));
      modelPts.push([x(day), y(model)]);
      upper.push([x(day), y(model + gap)]);
      lower.push([x(day), y(Math.max(0, model - gap))]);
    }
    if (showUncertainty) {
      const band = upper.concat([...lower].reverse());
      svg.append(make('path', { d: pathFrom(band) + ' Z', fill: blue, opacity: .13, stroke: 'none' }));
    }
    svg.append(make('path', { d: pathFrom(modelPts), fill: 'none', stroke: blue, 'stroke-width': 2.6 }));

    const observationDays = objectIndex === 2 ? [-31,-19,-8,7,21,49,73,88] : [-31,-25,-17,-11,-5,2,7,12,18,26,35,47,60,76,89];
    observationDays.forEach((day, i) => {
      const deterministicNoise = Math.sin((i + 1) * 12.91 + objectIndex) * 12;
      const value = Math.max(3, flux(day) + deterministicNoise);
      const cx = x(day), cy = y(value);
      svg.append(make('line', { x1: cx, y1: y(value - 8), x2: cx, y2: y(value + 8), stroke: ink, 'stroke-width': 1, opacity: .55 }));
      const circle = make('circle', { cx, cy, r: 4, fill: white, stroke: accent, 'stroke-width': 2, tabindex: 0, 'data-day': day, 'data-flux': Math.round(value) });
      circle.addEventListener('pointerenter', event => showSnTooltip(event, day, value));
      circle.addEventListener('pointerleave', hideSnTooltip);
      circle.addEventListener('focus', event => showSnTooltip(event, day, value));
      circle.addEventListener('blur', hideSnTooltip);
      svg.append(circle);
    });

    svg.append(make('line', { x1: x(0), y1: top, x2: x(0), y2: H - bottom, stroke: accent, 'stroke-width': 1, 'stroke-dasharray': '4 5', opacity: .65 }));
    svg.append(make('text', { x: x(0) + 7, y: top + 14, fill: accent, 'font-size': 10, 'font-family': 'ui-monospace, monospace' }, 'ESTIMATED PEAK'));

    document.getElementById('sn-score').textContent = `${obj.score}% candidate`;
    document.getElementById('sn-insight').innerHTML = obj.insight;
  }

  function showSnTooltip(event, day, value) {
    const tooltip = document.getElementById('sn-tooltip');
    const wrapper = tooltip.parentElement.getBoundingClientRect();
    const target = event.target.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.left = `${target.left - wrapper.left + 12}px`;
    tooltip.style.top = `${target.top - wrapper.top - 28}px`;
    tooltip.textContent = `day ${day} · flux ${Math.round(value)}`;
  }
  function hideSnTooltip() { const tooltip = document.getElementById('sn-tooltip'); if (tooltip) tooltip.style.display = 'none'; }

  document.getElementById('sn-object')?.addEventListener('change', drawSupernova);
  document.getElementById('sn-smooth')?.addEventListener('input', drawSupernova);
  document.getElementById('sn-toggle')?.addEventListener('click', event => {
    showUncertainty = !showUncertainty;
    event.currentTarget.textContent = showUncertainty ? 'Hide uncertainty' : 'Show uncertainty';
    event.currentTarget.setAttribute('aria-pressed', String(showUncertainty));
    drawSupernova();
  });

  function qvrSignalValue(type, t) {
    const base = 70 + 18 * Math.sin(t * .19) + 9 * Math.sin(t * .53 + 1.2) + 5 * Math.sin(t * 1.1);
    if (type === 'drift') return base + Math.max(0, t - 40) * 1.15;
    if (type === 'burst') return base + 70 * Math.exp(-Math.pow((t - 58) / 5.4, 2));
    return base;
  }

  function drawQvr() {
    const type = document.getElementById('qvr-signal')?.value || 'normal';
    const depth = Number(document.getElementById('qvr-depth')?.value || 5);
    drawQvrSignal(type);
    drawQvrCircuit(depth);
    updateQvrScore(type, depth, false);
  }

  function drawQvrSignal(type) {
    const svg = document.getElementById('qvr-signal-chart');
    if (!svg) return;
    svg.replaceChildren();
    const W = 520, H = 260, left = 42, right = 16, top = 20, bottom = 34;
    const line = css('--line'), muted = css('--muted'), accent = css('--accent'), blue = css('--blue');
    for (let i = 0; i <= 4; i++) {
      const y = top + i * (H - top - bottom) / 4;
      svg.append(make('line', { x1:left, y1:y, x2:W-right, y2:y, stroke:line, 'stroke-width':1 }));
    }
    const pts = [];
    for (let t = 0; t <= 100; t++) {
      const value = qvrSignalValue(type, t);
      pts.push([left + (t/100)*(W-left-right), top + (1 - value/180)*(H-top-bottom)]);
    }
    svg.append(make('path', { d:pathFrom(pts), fill:'none', stroke:type === 'normal' ? blue : accent, 'stroke-width':2.3 }));
    if (type !== 'normal') {
      const x = left + ((type === 'drift' ? 40 : 58)/100)*(W-left-right);
      svg.append(make('line', { x1:x, y1:top, x2:x, y2:H-bottom, stroke:accent, 'stroke-width':1, 'stroke-dasharray':'3 4' }));
      svg.append(make('text', { x:x+5, y:top+11, fill:accent, 'font-size':9, 'font-family':'ui-monospace, monospace' }, type === 'drift' ? 'DRIFT BEGINS' : 'BURST'));
    }
    svg.append(make('text', { x:left, y:H-10, fill:muted, 'font-size':9, 'font-family':'ui-monospace, monospace' }, 'TIME →'));
  }

  function drawQvrCircuit(depth) {
    const svg = document.getElementById('qvr-circuit');
    if (!svg) return;
    svg.replaceChildren();
    const W = 520, H = 260, left = 28, right = 24, top = 34;
    const line = css('--line'), muted = css('--muted'), accent = css('--accent'), blue = css('--blue'), white = css('--white');
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const y = top + r * 54;
      svg.append(make('line', { x1:left, y1:y, x2:W-right, y2:y, stroke:muted, opacity:.6 }));
      svg.append(make('text', { x:6, y:y+4, fill:muted, 'font-size':9, 'font-family':'ui-monospace, monospace' }, `q${r}`));
    }
    const columns = Math.min(depth, 8);
    for (let c = 0; c < columns; c++) {
      const x = 65 + c * ((W - 110) / Math.max(1, columns - 1));
      const r = c % rows;
      const y = top + r * 54;
      const rect = make('rect', { x:x-12, y:y-12, width:24, height:24, rx:2, fill:white, stroke:c % 2 ? blue : accent, 'stroke-width':1.4 });
      svg.append(rect);
      svg.append(make('text', { x, y:y+3, fill:c % 2 ? blue : accent, 'text-anchor':'middle', 'font-size':9, 'font-family':'ui-monospace, monospace' }, c % 2 ? 'RZ' : 'RY'));
      if (c < columns - 1) {
        const r2 = (r + 1) % rows;
        const y2 = top + r2 * 54;
        svg.append(make('line', { x1:x+20, y1:y, x2:x+20, y2:y2, stroke:muted, 'stroke-width':1 }));
        svg.append(make('circle', { cx:x+20, cy:y, r:4, fill:blue }));
        svg.append(make('circle', { cx:x+20, cy:y2, r:7, fill:white, stroke:blue, 'stroke-width':1.4 }));
        svg.append(make('line', { x1:x+14, y1:y2, x2:x+26, y2:y2, stroke:blue }));
        svg.append(make('line', { x1:x+20, y1:y2-6, x2:x+20, y2:y2+6, stroke:blue }));
      }
    }
    svg.append(make('text', { x:W/2, y:H-10, fill:muted, 'text-anchor':'middle', 'font-size':9, 'font-family':'ui-monospace, monospace' }, `DEPTH ${depth} · ENCODE / EVOLVE / REWIND`));
  }

  function updateQvrScore(type, depth, animate) {
    const base = type === 'normal' ? .22 : type === 'drift' ? .68 : .84;
    const score = Math.max(.08, Math.min(.95, base - depth * (type === 'normal' ? .008 : .012)));
    const target = Math.round(score * 100);
    const ring = document.getElementById('qvr-ring');
    const scoreEl = document.getElementById('qvr-score');
    const verdict = document.getElementById('qvr-verdict');
    const copy = document.getElementById('qvr-copy');
    if (ring) ring.style.setProperty('--score', target);
    if (scoreEl) scoreEl.textContent = score.toFixed(2);
    if (type === 'normal') {
      verdict.textContent = 'Consistent with learned dynamics';
      copy.textContent = 'The circuit approximately returns the encoded state toward its reference, producing a low anomaly score.';
    } else if (type === 'drift') {
      verdict.textContent = 'Persistent deviation detected';
      copy.textContent = 'The slow shift accumulates over time and does not rewind cleanly, producing a higher reconstruction error.';
    } else {
      verdict.textContent = 'Transient anomaly detected';
      copy.textContent = 'The sharp burst creates a state the learned reverse process cannot return to the reference manifold.';
    }
    if (animate && ring) {
      ring.animate([{ transform:'scale(.96)' }, { transform:'scale(1.04)' }, { transform:'scale(1)' }], { duration:520, easing:'ease-out' });
    }
  }

  document.getElementById('qvr-signal')?.addEventListener('change', drawQvr);
  document.getElementById('qvr-depth')?.addEventListener('input', drawQvr);
  document.getElementById('qvr-run')?.addEventListener('click', () => {
    const type = document.getElementById('qvr-signal').value;
    const depth = Number(document.getElementById('qvr-depth').value);
    drawQvrCircuit(depth);
    updateQvrScore(type, depth, true);
  });

  const systemContent = {
    quantum: {
      blocks: [
        ['Client', 'Hidden task', 'The computation is delegated without revealing the full input.'],
        ['Protocol', 'Blind encoding', 'Structure masks information while preserving what the computation needs.'],
        ['Server', 'Quantum operation', 'The server acts on encoded states without learning the private task.']
      ],
      note: '<strong>Invariant:</strong> correctness of the computation should survive while the client’s information remains hidden.'
    },
    circuits: {
      blocks: [
        ['Circuit', 'Random dynamics', 'Parameterized gates generate complex output distributions.'],
        ['Benchmark', 'Classical baseline', 'Sampling behavior is compared against tractable simulators and expected structure.'],
        ['Evidence', 'Observable pattern', 'Peakedness, fidelity, or distributional statistics make performance testable.']
      ],
      note: '<strong>Invariant:</strong> a claimed quantum behavior must be tied to a measurable distributional signature.'
    },
    crypto: {
      blocks: [
        ['Inventory', 'Know the cryptography', 'Locate algorithms, keys, certificates, dependencies, and owners.'],
        ['Agility layer', 'Abstract and orchestrate', 'Policies and interfaces allow algorithms to be tested, replaced, and rolled back.'],
        ['Migration', 'Change safely', 'Systems move toward post-quantum standards without a brittle one-time rewrite.']
      ],
      note: '<strong>Invariant:</strong> the system’s security goals and business continuity must survive algorithm replacement.'
    }
  };

  function renderSystem(key) {
    const canvas = document.getElementById('systems-canvas');
    if (!canvas) return;
    const data = systemContent[key];
    canvas.innerHTML = `
      <div class="system-diagram">
        <div class="system-diagram-grid">
          ${data.blocks.map((b, i) => `
            <div class="system-block ${i === 1 ? 'accent' : i === 2 ? 'blue' : ''}">
              <span>0${i+1} · ${b[0]}</span>
              <strong>${b[1]}</strong>
              <p>${b[2]}</p>
            </div>${i < 2 ? '<div class="system-connector" aria-hidden="true">→</div>' : ''}
          `).join('')}
        </div>
        <p class="system-note">${data.note}</p>
      </div>`;
  }

  document.querySelectorAll('.system-tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.system-tab').forEach(b => b.classList.remove('is-active'));
      button.classList.add('is-active');
      renderSystem(button.dataset.system);
    });
  });

  const sections = [...document.querySelectorAll('[data-section]')];
  const tocLinks = [...document.querySelectorAll('.toc-link')];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    tocLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .2, .5] });
  sections.forEach(section => observer.observe(section));

  window.addEventListener('themechange', () => { drawSupernova(); drawQvr(); });
  drawSupernova();
  drawQvr();
  renderSystem('quantum');
})();
