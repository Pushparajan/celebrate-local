/**
 * Content Fragment — AEM Core equivalent: Content Fragment component.
 * EDS has no native CF model; this renders structured content fetched from a configured
 * source: either an AEM GraphQL persisted query endpoint, or a sheet exposed via query-index.
 * Authoring config rows: Endpoint, Model/Variation (optional), Fields (comma-separated to render).
 */
function readConfig(block) {
  const cfg = {};
  [...block.children].forEach((row) => {
    const [k, v] = [...row.children];
    if (k && v) cfg[k.textContent.trim().toLowerCase()] = v.textContent.trim();
  });
  return cfg;
}

export default async function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';
  if (!cfg.endpoint) return;

  try {
    const res = await fetch(cfg.endpoint);
    const json = await res.json();
    const data = json.data?.[cfg.model] || json.data || json;
    const fields = cfg.fields ? cfg.fields.split(',').map((f) => f.trim()) : Object.keys(data);

    const dl = document.createElement('dl');
    dl.className = 'content-fragment-fields';
    fields.forEach((field) => {
      if (data[field] === undefined) return;
      const dt = document.createElement('dt');
      dt.textContent = field;
      const dd = document.createElement('dd');
      dd.innerHTML = typeof data[field] === 'object' ? (data[field].html || '') : data[field];
      dl.append(dt, dd);
    });
    block.append(dl);
  } catch (e) {
    console.error('Content Fragment fetch failed', e);
  }
}
