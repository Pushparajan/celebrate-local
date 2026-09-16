/**
 * Table of Contents — AEM Core equivalent: Table of Contents component.
 * Scans the document's headings (h2/h3 by default) and builds an anchored list.
 */
export default function decorate(block) {
  const main = document.querySelector('main');
  const levels = block.textContent.trim() || 'h2, h3';
  block.textContent = '';

  const headings = [...main.querySelectorAll(levels)].filter((h) => !h.closest('.toc'));
  if (!headings.length) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Table of contents');
  const ol = document.createElement('ol');
  ol.className = 'toc-list';

  headings.forEach((h, i) => {
    if (!h.id) h.id = `toc-${i}-${h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const li = document.createElement('li');
    li.className = `toc-level-${h.tagName.toLowerCase()}`;
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    li.append(a);
    ol.append(li);
  });

  nav.append(ol);
  block.append(nav);
}
