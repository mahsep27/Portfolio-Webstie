// Progressive enhancements. The page reads fine without any of this:
//   1. version stepper tabs      2. project filter      3. copy-email button
//   4. mobile menu closing       5. current section highlighted in the nav

document.documentElement.classList.add('js');

// ---- 1. version stepper ----
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

// ---- 2. project filter ----
document.querySelectorAll('[data-filter]').forEach((filter) => {
  const section = filter.closest('section');
  const chips = [...filter.querySelectorAll('[data-tag]')];
  const cards = [...section.querySelectorAll('.card')];
  const groups = [...section.querySelectorAll('[data-group]')];
  const count = filter.querySelector('.filter-count');

  const apply = (tag) => {
    let shown = 0;
    cards.forEach((card) => {
      const match = !tag || card.dataset.tags.split(' ').includes(tag);
      card.hidden = !match;
      if (match) shown++;
    });
    groups.forEach((group) => (group.hidden = !group.querySelector('.card:not([hidden])')));
    section.classList.toggle('is-filtered', Boolean(tag));
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.tag === tag)));
    count.textContent = tag ? `Showing ${shown} of ${cards.length} projects` : '';
  };

  chips.forEach((chip) => chip.addEventListener('click', () => apply(chip.dataset.tag)));
  filter.hidden = false;
});

// ---- 3. copy email ----
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

// ---- 4. mobile menu: close after choosing a link, or on Escape ----
document.querySelectorAll('.menu').forEach((menu) => {
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => (menu.open = false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
});

// ---- 5. highlight the section being read ----
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
