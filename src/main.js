// Progressive enhancements. The page reads fine without any of this:
//   1. hero data stream          2. version stepper tabs     3. project filter
//   4. copy-email button         5. mobile menu closing      6. nav state
//   7. pointer glow on cards

document.documentElement.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- 1. hero data stream ----
// Rows enter from the left as a mess: scattered, different sizes, some of them bad (orange).
// At the first gate the bad rows are dropped. Between the gates the rest are pulled into
// lanes. Past the second gate they are uniform and evenly spaced. That is the job.
document.querySelectorAll('[data-stream]').forEach((canvas) => {
  const ctx = canvas.getContext('2d');
  const GATE_1 = 0.4;
  const GATE_2 = 0.66;
  const LANES = 7;
  const COLORS = { raw: '147,160,184', clean: '139,155,255', bad: '255,138,76' };
  let w = 0;
  let h = 0;
  let rows = [];
  let running = false;
  let last = 0;

  const spawn = (anywhere) => ({
    t: anywhere ? Math.random() : -0.05 * Math.random(),
    y0: 0.08 + Math.random() * 0.84,
    lane: Math.floor(Math.random() * LANES),
    speed: 0.045 + Math.random() * 0.03,
    wobble: 0.02 + Math.random() * 0.06,
    freq: 6 + Math.random() * 10,
    phase: Math.random() * 6.28,
    size: 2 + Math.random() * 4,
    bad: Math.random() < 0.22,
  });

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(150, Math.max(50, (w * h) / 5200)));
    rows = Array.from({ length: count }, () => spawn(true));
  };

  const ease = (x) => x * x * (3 - 2 * x);
  const laneY = (lane) => h * (0.2 + (0.6 * lane) / (LANES - 1));

  const draw = (dt) => {
    ctx.clearRect(0, 0, w, h);

    // gates and their labels
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    [[GATE_1, 'validate'], [GATE_2, 'model']].forEach(([g, label]) => {
      const x = w * g;
      ctx.strokeStyle = 'rgba(139,155,255,0.28)';
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(x, h * 0.1);
      ctx.lineTo(x, h * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(147,160,184,0.85)';
      if (w > 520) ctx.fillText(label, x, h * 0.1 - 10);
    });
    ctx.fillStyle = 'rgba(147,160,184,0.6)';
    if (w > 520) {
      ctx.fillText('raw', w * (GATE_1 / 2 + 0.08), h * 0.96);
      ctx.fillText('clean', w * ((GATE_1 + GATE_2) / 2), h * 0.96);
      ctx.fillText('served', w * ((GATE_2 + 1) / 2 - 0.02), h * 0.96);
    }

    // faint lane guides after the second gate
    ctx.strokeStyle = 'rgba(139,155,255,0.09)';
    for (let i = 0; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(w * GATE_2, laneY(i));
      ctx.lineTo(w, laneY(i));
      ctx.stroke();
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      r.t += r.speed * dt;
      if (r.t > 1.04 || (r.bad && r.t > GATE_1 + 0.05)) {
        rows[i] = spawn(false);
        continue;
      }
      const x = r.t * w;
      const messy = h * (r.y0 + Math.sin(r.t * r.freq + r.phase) * r.wobble);
      let y = messy;
      let mix = 0;
      if (r.t > GATE_1) {
        mix = ease(Math.min(1, (r.t - GATE_1) / (GATE_2 - GATE_1)));
        y = messy + (laneY(r.lane) - messy) * mix;
      }

      if (r.bad) {
        // dropped at the first gate: flare, then fade
        const fade = r.t < GATE_1 ? 1 : Math.max(0, 1 - (r.t - GATE_1) / 0.05);
        ctx.fillStyle = `rgba(${COLORS.bad},${0.9 * fade})`;
        ctx.save();
        ctx.translate(x, y + (1 - fade) * 26);
        ctx.rotate(r.phase + r.t * 4);
        ctx.fillRect(-r.size / 2, -r.size / 2, r.size, r.size);
        ctx.restore();
        continue;
      }

      const size = r.size + (3.2 - r.size) * mix;
      const tail = 10 + 26 * mix;
      const alpha = 0.35 + 0.6 * mix;
      const c = mix > 0.5 ? COLORS.clean : COLORS.raw;
      const grad = ctx.createLinearGradient(x - tail, y, x, y);
      grad.addColorStop(0, `rgba(${c},0)`);
      grad.addColorStop(1, `rgba(${c},${alpha * 0.55})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1, size * 0.5);
      ctx.beginPath();
      ctx.moveTo(x - tail, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = `rgba(${c},${alpha})`;
      if (mix < 0.5) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r.phase + r.t * 3 * (1 - mix * 2));
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size / 2 + 0.4, 0, 6.2832);
        ctx.fill();
      }
    }
  };

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(dt);
    requestAnimationFrame(frame);
  };
  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  };
  const stop = () => (running = false);

  resize();
  draw(0);
  new ResizeObserver(() => {
    resize();
    draw(0);
  }).observe(canvas);
  // Only animate while the hero is on screen and the tab is visible.
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
});

// ---- 2. version stepper ----
document.querySelectorAll('[data-evo]').forEach((root) => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  if (!tabs.length) return;

  const select = (i, focus) => {
    tabs.forEach((tab, j) => {
      tab.setAttribute('aria-selected', String(j === i));
      tab.tabIndex = j === i ? 0 : -1;
    });
    panels.forEach((panel, j) => (panel.hidden = j !== i));
    if (focus) tabs[i].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const to =
        e.key === 'ArrowRight' ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length
        : e.key === 'Home' ? 0
        : e.key === 'End' ? tabs.length - 1
        : null;
      if (to === null) return;
      e.preventDefault();
      select(to, true);
    });
  });

  root.querySelectorAll('[data-evo-next]').forEach((btn) =>
    btn.addEventListener('click', () => select(Number(btn.dataset.evoNext), true))
  );

  root.classList.add('is-tabbed');
  select(0);
});

// ---- 3. project filter ----
document.querySelectorAll('[data-filter]').forEach((filter) => {
  const section = filter.closest('section');
  const chips = [...filter.querySelectorAll('[data-tag]')];
  const items = [...section.querySelectorAll('.card, .feat')];
  const groups = [...section.querySelectorAll('[data-group]')];
  const count = filter.querySelector('.filter-count');

  const apply = (tag) => {
    let shown = 0;
    items.forEach((item) => {
      const match = !tag || item.dataset.tags.split(' ').includes(tag);
      item.hidden = !match;
      if (match) shown++;
    });
    groups.forEach((group) => (group.hidden = !group.querySelector('.card:not([hidden]), .feat:not([hidden])')));
    section.classList.toggle('is-filtered', Boolean(tag));
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.tag === tag)));
    count.textContent = tag ? `Showing ${shown} of ${items.length} projects` : '';
  };

  chips.forEach((chip) => chip.addEventListener('click', () => apply(chip.dataset.tag)));
  // "See N projects" links in the What I do section switch the filter on, then jump down.
  document.querySelectorAll('[data-filter-link]').forEach((link) =>
    link.addEventListener('click', () => apply(link.dataset.filterLink))
  );
  filter.hidden = false;
});

// ---- 4. copy email ----
document.querySelectorAll('[data-copy]').forEach((btn) => {
  const label = btn.textContent;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Press Ctrl+C to copy';
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.contact-email a'));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    setTimeout(() => (btn.textContent = label), 2200);
  });
});

// ---- 5. mobile menu: close after choosing a link, or on Escape ----
document.querySelectorAll('.menu').forEach((menu) => {
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => (menu.open = false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
});

// ---- 6. nav: hairline once scrolled, and the current section highlighted ----
const topBar = document.querySelector('.top');
const onScroll = () => topBar.classList.toggle('is-stuck', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = [...document.querySelectorAll('.nav a[href*="#"]')];
const targets = navLinks
  .map((a) => document.getElementById(a.getAttribute('href').split('#')[1]))
  .filter(Boolean);
if (targets.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.toggleAttribute('data-current', a.getAttribute('href').endsWith('#' + entry.target.id))
        );
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );
  targets.forEach((t) => io.observe(t));
}

// ---- 7. pointer glow: cards light up under the cursor ----
if (matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.glow').forEach((el) =>
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    })
  );
}
