/**
 * Breadcrumb — AEM Core equivalent: Breadcrumb component.
 * Auto-builds from the current path; optionally overridden by authored links in the block.
 */
function titleCase(segment) {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function decorate(block) {
  const authored = [...block.querySelectorAll('a')];
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';

  const addItem = (label, href, current) => {
    const li = document.createElement('li');
    if (current) {
      li.setAttribute('aria-current', 'page');
      li.textContent = label;
    } else {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
    }
    ol.append(li);
  };

  if (authored.length) {
    authored.forEach((a, i) => addItem(a.textContent.trim(), a.href, i === authored.length - 1));
  } else {
    addItem('Home', '/', false);
    const segments = window.location.pathname.split('/').filter(Boolean);
    let path = '';
    segments.forEach((seg, i) => {
      path += `/${seg}`;
      addItem(titleCase(seg), path, i === segments.length - 1);
    });
  }

  nav.append(ol);
  block.append(nav);
}
