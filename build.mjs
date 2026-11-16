// Static site generator for the portfolio. No dependencies.
//
//   node build.mjs           build into dist/
//   node build.mjs --serve   build, serve on http://localhost:4321, rebuild on change
//
// Content lives in content/ (see CLAUDE.md). This file only holds the templates.

import { readdir, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
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
      const flow = v.flow
        .map((n) => {
          const node = typeof n === 'string' ? { t: n } : n;
          return `<li class="${node.hot ? 'is-hot' : ''}">${inline(node.t, root)}${
            node.note ? `<small>${inline(node.note, root)}</small>` : ''
          }</li>`;
        })
        .join('');
      const next = evo.versions[i + 1];
      return `
      <div class="evo-panel" role="tabpanel" id="${id}-panel-${i}" aria-labelledby="${id}-tab-${i}">
        <h3 class="evo-title"><span>${esc(v.v)}</span> ${esc(v.name)}</h3>
        <ol class="flow">${flow}</ol>
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
  <div class="evo" data-evo>
    <div class="evo-tabs" role="tablist" aria-label="Pipeline versions">${tabs}</div>
    ${panels}
    <p class="evo-key"><span class="evo-key-swatch"></span> Orange marks the part of each design that became the next problem.</p>
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

function page({ site, root, title, description, body }) {
  const nav = [
    ['Work', `${root}#work`],
    ['Experience', `${root}#experience`],
    ['Skills', `${root}#skills`],
    ['Contact', `${root}#contact`],
  ];
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
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="wordmark" href="${root}">${esc(site.name)}</a>
    <nav aria-label="Main">${nav.map(([l, h]) => `<a href="${h}">${l}</a>`).join('')}</nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <p>${esc(site.name)} · ${esc(site.role)} · ${esc(site.location)}</p>
    <p><a href="mailto:${site.email}">${site.email}</a> · <a href="${site.linkedin}" rel="me noopener">LinkedIn</a> · <a href="${root}${site.cv}">CV (PDF)</a></p>
  </div>
</footer>
<script src="${root}main.js" defer></script>
</body>
</html>
`;
}

// ---------- home ----------

function workRow(p, root) {
  return `
  <li class="work-row">
    <div class="work-figure">${
      p.figure ? `<strong>${esc(p.figure.value)}</strong><span>${esc(p.figure.label)}</span>` : ''
    }</div>
    <div class="work-main">
      <h3><a href="${root}work/${p.slug}/">${esc(p.title)}</a></h3>
      <p>${inline(p.summary, root)}</p>
      ${stackList(p.stack.slice(0, 6))}
    </div>
    <div class="work-meta">
      ${status(p.status)}
      <span class="work-period"><span>${esc(p.context)}</span><span>${esc(p.period)}</span></span>
    </div>
  </li>`;
}

function home(site, projects) {
  const root = './';
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const flagship = bySlug[site.hero.evolutionFrom];
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  const experience = site.experience
    .map(
      (job) => `
    <li class="job">
      <div class="job-when">${esc(job.dates)}</div>
      <div class="job-what">
        <h3>${esc(job.title)} <span>· ${esc(job.org)}</span></h3>
        <p class="job-place">${esc(job.place)}</p>
        <p>${inline(job.summary, root)}</p>
        ${
          job.projects?.length
            ? `<p class="job-links">${job.projects
                .map((s) => {
                  if (!bySlug[s]) throw new Error(`site.mjs: experience links to unknown project "${s}"`);
                  return `<a href="${root}work/${s}/">${esc(bySlug[s].shortTitle || bySlug[s].title)}</a>`;
                })
                .join('')}</p>`
            : ''
        }
      </div>
    </li>`
    )
    .join('');

  const skills = site.skills
    .map((g) => `<div><dt>${esc(g.group)}</dt><dd>${inline(g.items, root)}</dd></div>`)
    .join('');

  const body = `
<section class="hero wrap">
  <p class="eyebrow">${esc(site.role)} · ${esc(site.location)}</p>
  <h1>${inline(site.hero.headline, root)}</h1>
  <p class="lede">${inline(site.hero.intro, root)}</p>
  <p class="actions">
    <a class="btn btn--primary" href="mailto:${site.email}">Email me</a>
    <a class="btn" href="${root}${site.cv}">Download CV (PDF)</a>
    <a class="btn" href="${site.linkedin}" rel="me noopener">LinkedIn</a>
  </p>
</section>

<section class="wrap proof" aria-labelledby="proof-h">
  <div class="proof-head">
    <h2 id="proof-h">${esc(flagship.evolution.title)}</h2>
    <p>${inline(flagship.evolution.intro, root)} <a href="${root}work/${flagship.slug}/">Read the full case study</a></p>
  </div>
  ${evolution(flagship.evolution, 'home-evo', root)}
</section>

<section class="wrap section" id="work" aria-labelledby="work-h">
  <div class="section-head">
    <h2 id="work-h">Work</h2>
    <p>${inline(site.workIntro, root)}</p>
  </div>
  <ul class="work-list">${featured.map((p) => workRow(p, root)).join('')}</ul>

  <h3 class="sub-h">Earlier analytics and smaller builds</h3>
  <ul class="work-list work-list--compact">${rest.map((p) => workRow(p, root)).join('')}</ul>
</section>

<section class="wrap section" id="experience" aria-labelledby="exp-h">
  <div class="section-head"><h2 id="exp-h">Experience</h2></div>
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

<section class="wrap section" id="skills" aria-labelledby="skills-h">
  <div class="section-head">
    <h2 id="skills-h">Skills</h2>
    <p>${inline(site.skillsIntro, root)}</p>
  </div>
  <dl class="skills">${skills}</dl>
</section>

<section class="wrap section contact" id="contact" aria-labelledby="contact-h">
  <h2 id="contact-h">${esc(site.contact.heading)}</h2>
  <p>${inline(site.contact.body, root)}</p>
  <p class="actions">
    <a class="btn btn--primary" href="mailto:${site.email}">${site.email}</a>
    <a class="btn" href="${site.linkedin}" rel="me noopener">LinkedIn</a>
    <a class="btn" href="${root}${site.cv}">Download CV (PDF)</a>
  </p>
</section>`;

  return page({
    site,
    root,
    title: `${site.name} · ${site.role}`,
    description: site.description,
    body,
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

  const body = `
<article class="wrap cs">
  <header class="cs-head">
    <p class="crumb"><a href="${root}#work"><span aria-hidden="true">←</span> All work</a></p>
    <h1>${esc(p.title)}</h1>
    <p class="lede">${inline(p.summary, root)}</p>
    <dl class="cs-meta">
      <div><dt>Status</dt><dd>${status(p.status)}</dd></div>
      <div><dt>Where</dt><dd>${esc(p.context)}</dd></div>
      <div><dt>When</dt><dd>${esc(p.period)}</dd></div>
      <div><dt>My role</dt><dd>${esc(p.role)}</dd></div>
      <div class="cs-meta-wide"><dt>Stack</dt><dd>${stackList(p.stack)}</dd></div>
    </dl>
  </header>
  ${sections}
  <nav class="cs-nav" aria-label="More work">
    ${prev ? `<a href="${root}work/${prev.slug}/"><span>Previous</span>${esc(prev.shortTitle || prev.title)}</a>` : '<span></span>'}
    ${next ? `<a class="is-next" href="${root}work/${next.slug}/"><span>Next</span>${esc(next.shortTitle || next.title)}</a>` : '<span></span>'}
  </nav>
</article>`;

  return page({
    site,
    root,
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
    for (const key of ['slug', 'title', 'summary', 'status', 'context', 'period', 'role', 'stack', 'sections', 'order'])
      if (p[key] === undefined) throw new Error(`${f}: missing "${key}"`);
    projects.push(p);
  }
  projects.sort((a, b) => a.order - b.order);

  await rm(DIST, { recursive: true, force: true });
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
      body: `<section class="wrap hero"><p class="eyebrow">404</p><h1>That page doesn't exist.</h1><p class="actions"><a class="btn btn--primary" href="/">Go to the home page</a></p></section>`,
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
