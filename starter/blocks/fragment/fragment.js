/**
 * Fragment — AEM Core equivalent: Experience Fragment component.
 * Authoring: a single link to another authored document; that document's <main> content
 * is fetched and inlined in place, then re-decorated through the normal block pipeline.
 */
export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? new URL(link.href).pathname : block.textContent.trim();
  if (!path) return;

  const res = await fetch(`${path}.plain.html`);
  if (!res.ok) return;
  const html = await res.text();

  block.textContent = '';
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Re-run the standard decoration pipeline on the fetched fragment content.
  const { default: decorateAndLoad } = await import('../../scripts/fragment-decorate.js');
  await decorateAndLoad(temp, block);
}
