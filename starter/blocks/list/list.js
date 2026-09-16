/**
 * List — AEM Core equivalent: List component (children / tags / search / static source).
 * Authoring config (rows): Source = children|static|query, Path = root path or query-index path, Limit, SortBy.
 */
function readConfig(block) {
  const cfg = {};
  [...block.children].forEach((row) => {
    const [keyCell, valCell] = [...row.children];
    if (keyCell && valCell) cfg[keyCell.textContent.trim().toLowerCase()] = valCell.textContent.trim();
  });
  return cfg;
}

async function fetchIndex(path) {
  const res = await fetch(path);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  const source = cfg.source || 'query';
  const path = cfg.path || '/query-index.json';
  const limit = Number(cfg.limit) || 10;

  block.textContent = '';
  const ul = document.createElement('ul');
  ul.className = 'list-items';

  let items = [];
  if (source === 'query') {
    items = await fetchIndex(path);
    if (cfg.filterpath) items = items.filter((i) => i.path?.startsWith(cfg.filterpath));
  }

  items.slice(0, limit).forEach((item) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.path;
    a.textContent = item.title || item.path;
    li.append(a);
    if (item.description) {
      const p = document.createElement('p');
      p.textContent = item.description;
      li.append(p);
    }
    ul.append(li);
  });

  block.append(ul);
}
