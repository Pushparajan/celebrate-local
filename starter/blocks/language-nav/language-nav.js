/**
 * Language Nav — AEM Core equivalent: Language Navigation component.
 * Authoring: one row per locale — cell 1 = label (e.g. "EN"), cell 2 = link.
 */
export default function decorate(block) {
  const select = document.createElement('select');
  select.className = 'language-nav-select';
  select.setAttribute('aria-label', 'Select language');

  [...block.children].forEach((row) => {
    const [labelCell, linkCell] = [...row.children];
    const link = linkCell?.querySelector('a');
    const opt = document.createElement('option');
    opt.textContent = labelCell.textContent.trim();
    opt.value = link?.href || '#';
    if (link?.href === window.location.href) opt.selected = true;
    select.append(opt);
  });

  select.addEventListener('change', (e) => { window.location.href = e.target.value; });

  block.textContent = '';
  block.append(select);
}
