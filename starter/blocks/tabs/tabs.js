/**
 * Tabs — AEM Core equivalent: Tabs component.
 * Authoring: each row = one tab; first cell = label, second cell = panel content.
 * Implements the ARIA Tabs pattern with roving tabindex.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-panels';

  rows.forEach((row, i) => {
    const [labelCell, panelCell] = [...row.children];
    const id = `tab-${i}-${Math.random().toString(36).slice(2, 7)}`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'tab';
    btn.id = `${id}-tab`;
    btn.setAttribute('aria-controls', `${id}-panel`);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.tabIndex = i === 0 ? 0 : -1;
    btn.textContent = labelCell.textContent.trim();
    tablist.append(btn);

    const panel = document.createElement('div');
    panel.role = 'tabpanel';
    panel.id = `${id}-panel`;
    panel.setAttribute('aria-labelledby', `${id}-tab`);
    panel.hidden = i !== 0;
    panel.append(...panelCell.childNodes);
    panels.append(panel);

    btn.addEventListener('click', () => {
      [...tablist.children].forEach((b) => { b.setAttribute('aria-selected', 'false'); b.tabIndex = -1; });
      [...panels.children].forEach((p) => { p.hidden = true; });
      btn.setAttribute('aria-selected', 'true');
      btn.tabIndex = 0;
      panel.hidden = false;
    });
  });

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.children];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    let next;
    if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
    if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
    if (next) { next.focus(); next.click(); e.preventDefault(); }
  });

  block.textContent = '';
  block.append(tablist, panels);
}
