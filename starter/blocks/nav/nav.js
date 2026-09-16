/**
 * Nav — AEM Core equivalent: Navigation component (in-page site nav / mega menu).
 * Distinct from the global header (loadHeader in aem.js), for secondary/section nav placed in content.
 * Authoring: nested lists of links.
 */
export default function decorate(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;
  ul.className = 'nav-list';

  ul.querySelectorAll(':scope > li').forEach((li) => {
    const childUl = li.querySelector('ul');
    if (childUl) {
      li.classList.add('nav-has-children');
      childUl.className = 'nav-sublist';
      const trigger = li.querySelector(':scope > a, :scope > span') || li.firstChild;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-trigger';
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = trigger.textContent;
      trigger.replaceWith(btn);
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        li.classList.toggle('nav-open', !expanded);
      });
    }
  });
}
