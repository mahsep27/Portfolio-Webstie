// Static site generator for the portfolio. No dependencies.
//
//   node build.mjs           build into dist/
//   node build.mjs --serve   build, serve on http://localhost:4321, rebuild on change
//
// Content lives in content/ (see CLAUDE.md). This file only holds the templates.

import { readdir, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync, watch, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = 4321;

const load = async (path) =>
  (await import(pathToFileURL(path).href + '?t=' + Date.now())).default;

// ---------- text helpers ----------

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Content strings are plain text with three inline marks:
//   `code`   **bold**   [label](url)   — url may be "work:<slug>" for a project page
const inline = (s, root = './') =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const href = url.startsWith('work:') ? `${root}work/${url.slice(5)}/` : url;
      return `<a href="${href}">${label}</a>`;
    });

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- icons ----------
// A name resolves to public/icons/<name>.svg if that file exists, otherwise to one
// of the line glyphs below, otherwise to a short monogram.

const ICON_FILES = new Set(
  readdirSync(join(ROOT, 'public', 'icons')).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4))
);

// 24x24, drawn with stroke only.
const GLYPHS = {
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  queue: 'M3 7h18M3 12h18M3 17h18M7 5v4M12 10v4M17 15v4',
  flow: 'M5 4h5v5H5zM14 15h5v5h-5zM10 6.5h4.5a2 2 0 012 2V15',
  chip: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
  table: 'M4 5h16v14H4zM4 10h16M4 14.5h16M10 5v14',
  file: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
  phone: 'M6 3h3l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.8 2.5 2.8 15.5 0 18M12 3c-2.8 2.5-2.8 15.5 0 18',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  check: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12.5l2.8 2.8L16 9.5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  db: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3v12c0 1.7-3.1 3-7 3s-7-1.3-7-3zM5 6c0 1.7 3.1 3 7 3s7-1.3 7-3M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  wave: 'M4 10v4M8 6v12M12 9v6M16 4v16M20 10v4',
  filter: 'M4 5h16l-6 7v6l-4 2v-8z',
};

const monogram = (name) => esc(name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase());

// Icon tile for HTML contexts.
function tile(name, root, label = '') {
  const inner = ICON_FILES.has(name)
    ? `<img src="${root}icons/${name}.svg" alt="" width="22" height="22" loading="lazy">`
    : GLYPHS[name]
      ? `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${GLYPHS[name]}"/></svg>`
      : `<b>${monogram(name)}</b>`;
  return `<span class="tile"${label ? ` title="${esc(label)}"` : ''}>${inner}</span>`;
}

// ---------- diagrams ----------
// d = { nodes: [{ id, c, r, i, t, s, hot }], edges: [[from, to, { both, dashed }]] }
// c / r are grid column / row. i = icon, t = label, s = small second line.

const DG = { CW: 152, CH: 128, NW: 126, NH: 96, PAD: 10 };

function diagram(d, root, id) {
  const { CW, CH, NW, NH, PAD } = DG;
  const cols = Math.max(...d.nodes.map((n) => n.c)) + 1;
  const rows = Math.max(...d.nodes.map((n) => n.r || 0)) + 1;
  const W = PAD * 2 + (cols - 1) * CW + NW;
  const H = PAD * 2 + (rows - 1) * CH + NH;
  const at = (n) => ({ x: PAD + n.c * CW, y: PAD + (n.r || 0) * CH });
  const byId = Object.fromEntries(d.nodes.map((n) => [n.id, n]));

  const edges = d.edges
    .map(([from, to, opt = {}]) => {
      const a = byId[from];
      const b = byId[to];
      if (!a || !b) throw new Error(`diagram ${id}: edge ${from} → ${to} names an unknown node`);
      const A = at(a);
      const B = at(b);
      const G = 5; // gap so the arrowhead does not touch the box
      let path;
      if (a.c === b.c) {
        const down = (b.r || 0) > (a.r || 0);
        const x = A.x + NW / 2;
        path = `M${x} ${down ? A.y + NH + (opt.both ? G : 0) : A.y - (opt.both ? G : 0)}V${down ? B.y - G : B.y + NH + G}`;
      } else {
        const right = b.c > a.c;
        const x1 = right ? A.x + NW + (opt.both ? G : 0) : A.x - (opt.both ? G : 0);
        const x2 = right ? B.x - G : B.x + NW + G;
        const y1 = A.y + NH / 2;
        const y2 = B.y + NH / 2;
        const mx = (x1 + x2) / 2;
        const s = y2 > y1 ? 1 : -1;
        const q = 7; // corner radius of the elbow
        const dx = right ? q : -q;
        path = y1 === y2
          ? `M${x1} ${y1}H${x2}`
          : `M${x1} ${y1}H${mx - dx}Q${mx} ${y1} ${mx} ${y1 + q * s}V${y2 - q * s}Q${mx} ${y2} ${mx + dx} ${y2}H${x2}`;
      }
      const cls = `dg-wire${opt.dashed ? ' is-dashed' : ''}${opt.hot ? ' is-hot' : ''}`;
      return `<path class="${cls}" d="${path}" marker-end="url(#${id}-arrow)"${opt.both ? ` marker-start="url(#${id}-arrow-back)"` : ''}/>${
        opt.dashed ? '' : `<path class="dg-flow${opt.hot ? ' is-hot' : ''}" d="${path}"/>`
      }`;
    })
    .join('');

  const nodes = d.nodes
    .map((n) => {
      const { x, y } = at(n);
      const tx = (NW - 38) / 2;
      const icon = ICON_FILES.has(n.i)
        ? `<image href="${root}icons/${n.i}.svg" x="${tx + 6}" y="18" width="26" height="26"/>`
        : GLYPHS[n.i]
          ? `<path class="dg-glyph" transform="translate(${tx + 7},19)" d="${GLYPHS[n.i]}"/>`
          : `<text class="dg-mono" x="${NW / 2}" y="36" text-anchor="middle">${monogram(n.i || n.t)}</text>`;
      return `<g class="dg-node${n.hot ? ' is-hot' : ''}" transform="translate(${x},${y})">
        <rect class="dg-box" width="${NW}" height="${NH}" rx="9"/>
        <rect class="dg-tile" x="${tx}" y="12" width="38" height="38" rx="8"/>
        ${icon}
        <text class="dg-label" x="${NW / 2}" y="68" text-anchor="middle">${esc(n.t)}</text>
        ${n.s ? `<text class="dg-sub" x="${NW / 2}" y="83" text-anchor="middle">${esc(n.s)}</text>` : ''}
      </g>`;
    })
    .join('');

  const label = d.nodes.map((n) => n.t).join(', ');
  return `<svg class="dg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Diagram: ${esc(label)}">
    <defs>
      <marker id="${id}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="dg-head" d="M0 0L8 4L0 8z"/></marker>
      <marker id="${id}-arrow-back" viewBox="0 0 8 8" refX="1" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="dg-head" d="M8 0L0 4L8 8z"/></marker>
    </defs>
    ${edges}${nodes}
  </svg>`;
}

// A project's linear `chain` as a one-row diagram.
const chainDiagram = (chain) => ({
  nodes: chain.map((n, c) => ({ ...n, id: String(c), c, r: 0 })),
  edges: chain.slice(1).map((_, c) => [String(c), String(c + 1)]),
});

// Compact text version of a diagram, shown on narrow screens instead of the SVG.
const chips = (nodes, root) =>
  `<ol class="chips">${nodes
    .map((n) => `<li class="${n.hot ? 'is-hot' : ''}">${tile(n.i, root)}<span>${esc(n.t)}${n.s ? `<small>${esc(n.s)}</small>` : ''}</span></li>`)
    .join('')}</ol>`;

const board = (d, root, id) =>
  `<div class="board-canvas"><div class="board-svg">${diagram(d, root, id)}</div>${chips(d.nodes, root)}</div>`;

// ---------- shared pieces ----------

const status = (st) =>
  `<span class="status status--${st.kind}">${esc(st.label)}</span>`;

const stackList = (items) =>
  `<ul class="stack">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

function evolution(evo, id, root) {
  const tabs = evo.versions
    .map(
      (v, i) => `
      <button class="evo-tab" role="tab" id="${id}-tab-${i}" aria-controls="${id}-panel-${i}" aria-selected="${i === 0}">
        <span class="evo-tab-v">${esc(v.v)}</span>
        <span class="evo-tab-name">${esc(v.short)}</span>
      </button>`
    )
    .join('');

  const panels = evo.versions
    .map((v, i) => {
      const next = evo.versions[i + 1];
      return `
      <div class="evo-panel" role="tabpanel" id="${id}-panel-${i}" aria-labelledby="${id}-tab-${i}">
        <h3 class="evo-title"><span>${esc(v.v)}</span> ${esc(v.name)}</h3>
        ${board(v.diagram, root, `${id}-d${i}`)}
        <dl class="evo-notes">
          <div><dt>${esc(v.removedLabel || 'Constraint it removed')}</dt><dd>${inline(v.removed, root)}</dd></div>
          <div class="${v.exposedLabel ? '' : 'is-hot'}"><dt>${esc(v.exposedLabel || 'What it exposed next')}</dt><dd>${inline(v.exposed, root)}</dd></div>
        </dl>
        ${
          next
            ? `<button class="evo-next" type="button" data-evo-next="${i + 1}">Next: ${esc(next.v)}, ${esc(next.short)} <span aria-hidden="true">→</span></button>`
            : ''
        }
      </div>`;
    })
    .join('');

  return `
  <div class="evo board" data-evo>
    <div class="board-bar">
      <span class="board-id">${esc(evo.label)}</span>
      <span class="board-key"><i></i> orange = the part that became the next problem</span>
    </div>
    <div class="evo-tabs" role="tablist" aria-label="Pipeline versions">${tabs}</div>
    ${panels}
  </div>`;
}

function block(b, ctx) {
  const { root, project } = ctx;
  if (typeof b === 'string') return `<p>${inline(b, root)}</p>`;
  if (b.p) return `<p>${inline(b.p, root)}</p>`;
  if (b.h) return `<h3>${inline(b.h, root)}</h3>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${inline(x, root)}</li>`).join('')}</ul>`;
  if (b.pre) return `<div class="scroll"><pre class="diagram">${esc(b.pre)}</pre></div>`;
  if (b.table)
    return `<div class="scroll"><table>
      <thead><tr>${b.table.head.map((h) => `<th>${inline(h, root)}</th>`).join('')}</tr></thead>
      <tbody>${b.table.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c, root)}</td>`).join('')}</tr>`)
        .join('')}</tbody>
    </table></div>`;
  if (b.decisions)
    return `<dl class="decisions">${b.decisions
      .map((d) => `<div><dt>${inline(d.title, root)}</dt><dd>${inline(d.body, root)}</dd></div>`)
      .join('')}</dl>`;
  if (b.evolution) return evolution(project.evolution, 'evo', root);
  throw new Error(`Unknown block in ${project.slug}: ${JSON.stringify(b).slice(0, 80)}`);
}

const mailto = (site) => `mailto:${site.email}?subject=${encodeURIComponent('Hello from your portfolio')}`;

function page({ site, root, path = '', title, description, body, jsonLd }) {
  const nav = [
    ['Work', `${root}#work`],
    ['Problem solving', `${root}#stories`],
    ['Experience', `${root}#experience`],
    ['Skills', `${root}#skills`],
  ];
  const links = nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('');
  const cvLink = `<a href="${root}${site.cv}">CV</a>`;
  const updated = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const abs = site.url ? `${site.url.replace(/\/$/, '')}/` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
${abs ? `<link rel="canonical" href="${abs}${path}">
<meta property="og:url" content="${abs}${path}">
<meta property="og:image" content="${abs}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}styles.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="wordmark" href="${root}"><i></i>${esc(site.name)}</a>
    <nav class="nav" aria-label="Main">${links}${cvLink}<a class="nav-cta" href="${root}#contact">Contact</a></nav>
    <details class="menu">
      <summary><span class="menu-bars" aria-hidden="true"></span>Menu</summary>
      <nav aria-label="Main">${links}<a href="${root}${site.cv}">Download CV</a><a href="${root}#contact">Contact</a></nav>
    </details>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <p><strong>${esc(site.name)}</strong> · ${esc(site.role)} · ${esc(site.location)}</p>
    <p><a href="mailto:${site.email}">${site.email}</a> · <a href="${site.linkedin}" rel="me noopener">LinkedIn</a> · <a href="${root}${site.cv}">CV (PDF)</a></p>
    <p class="foot-note">Last updated ${esc(updated)}</p>
  </div>
</footer>
<script src="${root}main.js" defer></script>
</body>
</html>
`;
}

// ---------- home ----------

function workCard(p, root, big) {
  const icons = p.chain.slice(0, big ? 6 : 4);
  return `
  <li class="card${big ? ' card--big' : ''}" data-tags="${esc((p.tags || []).join(' '))}">
    <a class="card-link" href="${root}work/${p.slug}/" aria-label="${esc(p.title)}: ${esc(p.figure.value)} ${esc(p.figure.label)}. ${esc(p.status.label)}">
      <div class="card-thumb">
        <div class="card-chain">${icons.map((n) => tile(n.i, root, n.t)).join('<i></i>')}</div>
        <div class="card-figure"><strong>${esc(p.figure.value)}</strong><span>${esc(p.figure.label)}</span></div>
      </div>
      <div class="card-body">
        ${status(p.status)}
        <h3>${esc(p.shortTitle || p.title)}</h3>
        <p>${inline(p.summary, root).replace(/<\/?a[^>]*>/g, '')}</p>
        <div class="card-foot"><span>${esc(p.context)} · ${esc(p.period)}</span><span class="card-go">Read the case study <b aria-hidden="true">→</b></span></div>
      </div>
    </a>
  </li>`;
}

function home(site, projects) {
  const root = './';
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const need = (slug, where) => {
    if (!bySlug[slug]) throw new Error(`site.mjs: ${where} links to unknown project "${slug}"`);
    return bySlug[slug];
  };
  const flagship = need(site.hero.evolutionFrom, 'hero');
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  const tagKeys = new Set(site.work.tags.map((t) => t.key));
  for (const p of projects)
    for (const t of p.tags || [])
      if (!tagKeys.has(t)) throw new Error(`${p.slug}: tag "${t}" is not listed in site.mjs work.tags`);

  const glance = site.glance
    .map((g) => `<div><dt>${esc(g.label)}</dt><dd>${inline(g.value, root)}${g.note ? `<span>${inline(g.note, root)}</span>` : ''}</dd></div>`)
    .join('');

  const stats = site.stats
    .map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd><p>${inline(s.note, root)}</p></div>`)
    .join('');

  const filter = `
  <div class="filter" data-filter hidden>
    <span class="filter-label" id="filter-label">Show</span>
    <div class="filter-chips" role="group" aria-labelledby="filter-label">
      <button type="button" class="chip" data-tag="" aria-pressed="true">All <span>${projects.length}</span></button>
      ${site.work.tags
        .map((t) => {
          const n = projects.filter((p) => (p.tags || []).includes(t.key)).length;
          return `<button type="button" class="chip" data-tag="${esc(t.key)}" aria-pressed="false">${esc(t.label)} <span>${n}</span></button>`;
        })
        .join('')}
    </div>
    <p class="filter-count" aria-live="polite"></p>
  </div>`;

  const stories = site.stories.items
    .map((s) => {
      const p = need(s.project, 'a story');
      return `
    <li class="story">
      <div class="story-ev"><strong>${esc(s.evidence)}</strong><span>${esc(s.evidenceLabel)}</span></div>
      <h3>${esc(s.title)}</h3>
      <p>${inline(s.body, root)}</p>
      <p class="story-fix"><span>Fix</span>${inline(s.fix, root)}</p>
      <a href="${root}work/${p.slug}/">${esc(p.shortTitle || p.title)} <b aria-hidden="true">→</b></a>
    </li>`;
    })
    .join('');

  const experience = site.experience
    .map(
      (job) => `
    <li class="job${job.current ? ' is-current' : ''}">
      <div class="job-when">${esc(job.dates)}${job.current ? '<span>Current</span>' : ''}</div>
      <div class="job-what">
        <h3>${esc(job.title)} <span>· ${esc(job.org)}</span></h3>
        <p class="job-place">${esc(job.place)}</p>
        <p>${inline(job.summary, root)}</p>
        ${
          job.projects?.length
            ? `<p class="job-links"><span>Projects</span>${job.projects
                .map((s) => {
                  const p = need(s, 'experience');
                  return `<a href="${root}work/${s}/">${esc(p.shortTitle || p.title)}</a>`;
                })
                .join('')}</p>`
            : ''
        }
      </div>
    </li>`
    )
    .join('');

  const toolbox = site.skills
    .map(
      (g) => `
    <div class="tools">
      <h3>${esc(g.group)}</h3>
      <ul>${g.items
        .map((item) => {
          const [name, icon] = item.split('|');
          return `<li>${icon ? tile(icon, root) : ''}<span>${esc(name)}</span></li>`;
        })
        .join('')}</ul>
    </div>`
    )
    .join('');

  const body = `
<section class="hero wrap">
  <div class="hero-main">
    <p class="hero-name"><strong>${esc(site.name)}</strong><span>${esc(site.role)}</span></p>
    <h1>${inline(site.hero.headline, root)}</h1>
    <p class="lede">${inline(site.hero.intro, root)}</p>
    <p class="actions">
      <a class="btn btn--primary" href="${mailto(site)}">Email me</a>
      <a class="btn" href="${root}${site.cv}" download>Download CV <small>PDF</small></a>
      <a class="btn" href="${site.linkedin}" rel="me noopener">LinkedIn</a>
    </p>
  </div>
  <aside class="glance" aria-labelledby="glance-h">
    <h2 id="glance-h">At a glance</h2>
    <dl>${glance}</dl>
  </aside>
</section>

<section class="wrap" aria-label="Numbers from the work">
  <dl class="stats">${stats}</dl>
</section>

<section class="wrap section proof" aria-labelledby="proof-h">
  <div class="section-head">
    <p class="kicker">Flagship project</p>
    <h2 id="proof-h">${esc(flagship.evolution.title)}</h2>
    <p>${inline(flagship.evolution.intro, root)} <a href="${root}work/${flagship.slug}/">Read the full case study</a></p>
  </div>
  ${evolution(flagship.evolution, 'home-evo', root)}
</section>

<section class="wrap section" id="work" aria-labelledby="work-h">
  <div class="section-head">
    <p class="kicker">Selected work</p>
    <h2 id="work-h">${esc(site.work.heading)}</h2>
    <p>${inline(site.work.intro, root)}</p>
  </div>
  ${filter}
  <div data-group>
    <ul class="cards cards--big">${featured.map((p) => workCard(p, root, true)).join('')}</ul>
  </div>
  <div data-group>
    <h3 class="sub-h">Earlier analytics and smaller builds</h3>
    <ul class="cards">${rest.map((p) => workCard(p, root, false)).join('')}</ul>
  </div>
</section>

<section class="stories" id="stories" aria-labelledby="stories-h">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker">Problem solving</p>
      <h2 id="stories-h">${esc(site.stories.heading)}</h2>
      <p>${inline(site.stories.intro, root)}</p>
    </div>
    <ul class="story-grid">${stories}</ul>
  </div>
</section>

<section class="wrap section" id="experience" aria-labelledby="exp-h">
  <div class="section-head">
    <p class="kicker">Experience</p>
    <h2 id="exp-h">${esc(site.experienceHeading)}</h2>
    <p>${inline(site.experienceIntro, root)} <a href="${root}${site.cv}" download>Download the CV (PDF)</a></p>
  </div>
  <ol class="jobs">${experience}</ol>
  <div class="edu">
    <div>
      <h3>Education</h3>
      <p><strong>${esc(site.education.degree)}</strong><br>${esc(site.education.school)}<br><span class="dim">${esc(site.education.dates)}. ${esc(site.education.note)}</span></p>
    </div>
    <div>
      <h3>Certifications</h3>
      <p>${site.certifications.map(esc).join('<br>')}</p>
    </div>
    <div>
      <h3>Languages</h3>
      <p>${site.languages.map(esc).join('<br>')}</p>
    </div>
  </div>
</section>

<section class="wrap section" id="skills" aria-labelledby="tools-h">
  <div class="section-head">
    <p class="kicker">Skills</p>
    <h2 id="tools-h">${esc(site.skillsHeading)}</h2>
    <p>${inline(site.skillsIntro, root)}</p>
  </div>
  <div class="toolbox">${toolbox}</div>
</section>

<section class="wrap" id="contact" aria-labelledby="contact-h">
  <div class="contact">
    <div class="contact-text">
      <h2 id="contact-h">${esc(site.contact.heading)}</h2>
      <p>${inline(site.contact.body, root)}</p>
    </div>
    <div class="contact-card">
      <p class="contact-label">Email</p>
      <p class="contact-email"><a href="${mailto(site)}">${site.email}</a></p>
      <p class="actions">
        <a class="btn btn--light" href="${mailto(site)}">Write an email</a>
        <button class="btn js-only" type="button" data-copy="${site.email}">Copy address</button>
      </p>
      <ul class="contact-meta">
        <li><span>Based in</span>${esc(site.location)} (${esc(site.timezone)})</li>
        <li><span>LinkedIn</span><a href="${site.linkedin}" rel="me noopener">View profile</a></li>
        <li><span>CV</span><a href="${root}${site.cv}" download>Download PDF</a></li>
      </ul>
    </div>
  </div>
</section>`;

  return page({
    site,
    root,
    title: `${site.name} · ${site.role}`,
    description: site.description,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: site.name,
      jobTitle: site.role,
      email: `mailto:${site.email}`,
      url: site.url || undefined,
      sameAs: [site.linkedin],
      address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' },
    },
  });
}

// ---------- project page ----------

function projectPage(site, p, prev, next) {
  const root = '../../';
  const ctx = { root, project: p };
  const sections = p.sections
    .map(
      (s) => `
  <section class="cs-section" aria-labelledby="${slugify(s.title)}">
    <h2 id="${slugify(s.title)}">${esc(s.title)}</h2>
    <div class="prose">${s.blocks.map((b) => block(b, ctx)).join('\n')}</div>
  </section>`
    )
    .join('');

  const jump =
    p.sections.length >= 4
      ? `<nav class="jump" aria-label="On this page"><span>On this page</span>${p.sections
          .map((s) => `<a href="#${slugify(s.title)}">${esc(s.title)}</a>`)
          .join('')}</nav>`
      : '';

  const body = `
<article class="wrap cs">
  <header class="cs-head">
    <p class="crumb"><a href="${root}#work"><span aria-hidden="true">←</span> All work</a></p>
    <div class="cs-title">
      <div>
        <h1>${esc(p.title)}</h1>
        <p class="lede">${inline(p.summary, root)}</p>
      </div>
      <div class="cs-figure"><strong>${esc(p.figure.value)}</strong><span>${esc(p.figure.label)}</span></div>
    </div>
    <dl class="brief" aria-label="The short version">
      <div><dt>Problem</dt><dd>${inline(p.brief.problem, root)}</dd></div>
      <div><dt>What I did</dt><dd>${inline(p.brief.did, root)}</dd></div>
      <div class="brief-result"><dt>Result</dt><dd>${inline(p.brief.result, root)}</dd></div>
    </dl>
    <div class="board cs-board">
      <div class="board-bar"><span class="board-id">${esc(p.chainLabel || 'How the data moves')}</span>${status(p.status)}</div>
      ${board(chainDiagram(p.chain), root, 'chain')}
    </div>
    <dl class="cs-meta">
      <div><dt>Where</dt><dd>${esc(p.context)}</dd></div>
      <div><dt>When</dt><dd>${esc(p.period)}</dd></div>
      <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
      <div class="cs-meta-wide"><dt>Stack</dt><dd>${stackList(p.stack)}</dd></div>
    </dl>
    ${jump}
  </header>
  ${sections}
  <aside class="cs-cta" aria-labelledby="cs-cta-h">
    <div>
      <h2 id="cs-cta-h">Want to talk through this project?</h2>
      <p>I can go deeper on the design, the trade-offs, or what I would change.</p>
    </div>
    <p class="actions">
      <a class="btn btn--light" href="${mailto(site)}">Email me</a>
      <a class="btn" href="${root}${site.cv}" download>Download CV</a>
    </p>
  </aside>
  <nav class="cs-nav" aria-label="More work">
    ${prev ? `<a href="${root}work/${prev.slug}/"><span>← Previous project</span>${esc(prev.shortTitle || prev.title)}</a>` : `<a href="${root}#work"><span>← Back to</span>All work</a>`}
    ${next ? `<a class="is-next" href="${root}work/${next.slug}/"><span>Next project →</span>${esc(next.shortTitle || next.title)}</a>` : `<a class="is-next" href="${root}#work"><span>Back to →</span>All work</a>`}
  </nav>
</article>`;

  return page({
    site,
    root,
    path: `work/${p.slug}/`,
    title: `${p.title} · ${site.name}`,
    description: p.summary.replace(/[`*]/g, ''),
    body,
  });
}

// ---------- build ----------

async function build() {
  const site = await load(join(ROOT, 'content', 'site.mjs'));
  const dir = join(ROOT, 'content', 'projects');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs'));
  const projects = [];
  for (const f of files) {
    const p = await load(join(dir, f));
    for (const key of ['slug', 'title', 'summary', 'figure', 'brief', 'tags', 'chain', 'status', 'context', 'period', 'role', 'stack', 'sections', 'order'])
      if (p[key] === undefined) throw new Error(`${f}: missing "${key}"`);
    projects.push(p);
  }
  projects.sort((a, b) => a.order - b.order);

  await rm(DIST, { recursive: true, force: true, maxRetries: 8, retryDelay: 120 });
  await mkdir(DIST, { recursive: true });
  await cp(join(ROOT, 'public'), DIST, { recursive: true });
  await cp(join(ROOT, 'src', 'styles.css'), join(DIST, 'styles.css'));
  await cp(join(ROOT, 'src', 'main.js'), join(DIST, 'main.js'));

  await writeFile(join(DIST, 'index.html'), home(site, projects));
  for (let i = 0; i < projects.length; i++) {
    const out = join(DIST, 'work', projects[i].slug);
    await mkdir(out, { recursive: true });
    await writeFile(join(out, 'index.html'), projectPage(site, projects[i], projects[i - 1], projects[i + 1]));
  }
  await writeFile(
    join(DIST, '404.html'),
    page({
      site,
      root: '/',
      title: `Page not found · ${site.name}`,
      description: 'Page not found.',
      body: `<section class="wrap hero"><div class="hero-main"><p class="eyebrow">404</p><h1>That page doesn't exist.</h1><p class="actions"><a class="btn btn--primary" href="/">Go to the home page</a></p></div></section>`,
    })
  );
  console.log(`Built ${projects.length + 2} pages into dist/`);
}

// ---------- dev server ----------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function serve() {
  createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    let file = normalize(join(DIST, path));
    if (!file.startsWith(DIST)) return res.writeHead(403).end();
    if (!existsSync(file) && existsSync(file + '/index.html')) {
      return res.writeHead(302, { Location: path + '/' }).end();
    }
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': MIME['.html'] });
      res.end(await readFile(join(DIST, '404.html')).catch(() => 'Not found'));
    }
  }).listen(PORT, () => console.log(`Serving http://localhost:${PORT}`));

  let timer;
  for (const d of ['content', 'src', 'public']) {
    watch(join(ROOT, d), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => build().catch((e) => console.error('Build failed:', e.message)), 150);
    });
  }
}

await build();
if (process.argv.includes('--serve')) serve();
