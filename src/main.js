// Turns each stacked list of pipeline versions into tabs.
// Without JavaScript every version is simply shown one after another.

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
