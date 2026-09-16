/**
 * Content Fragment List — AEM Core equivalent: Content Fragment List component.
 * Renders a list of structured items from a GraphQL list query endpoint or a query-index sheet.
 * Authoring config rows: Endpoint, ItemPath (dot path to the array in the JSON response), Limit.
 */
function readConfig(block) {
  const cfg = {};
  [...block.children].forEach((row) => {
    const [k, v] = [...row.children];
    if (k && v) cfg[k.textContent.trim().toLowerCase()] = v.textContent.trim();
  });
  return cfg;
}

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';
  if (!cfg.endpoint) return;

  const res = await fetch(cfg.endpoint);
  const json = await res.json();
  const items = (cfg.itempath ? resolvePath(json, cfg.itempath) : json.data) || [];
  const limit = Number(cfg.limit) || items.length;

  const ul = document.createElement('ul');
  ul.className = 'cf-list';
  items.slice(0, limit).forEach((item) => {
    const li = document.createElement('li');
    li.className = 'cf-list-item';
    const title = document.createElement('p');
    title.className = 'cf-list-title';
    title.textContent = item.title || item.name || '';
    li.append(title);
    if (item.description) {
      const desc = document.createElement('p');
      desc.textContent = item.description;
      li.append(desc);
    }
    ul.append(li);
  });
  block.append(ul);
}
