// 1. Turns each stacked list of pipeline versions into tabs.
// 2. Fades cards in as they scroll into view.
// The page reads fine without any of this.

document.documentElement.classList.add('js');

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

const revealables = document.querySelectorAll('.card, .story, .stats > div');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  revealables.forEach((el, i) => {
    el.dataset.reveal = '';
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    io.observe(el);
  });
}
