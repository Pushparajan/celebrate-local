/**
 * Search — AEM Core equivalent: Quick Search / Sites Search component.
 * Client-side filters the Query Index (helix-query.yaml -> /query-index.json).
 * For larger sites, swap the fetch below for a real search service; the UI contract stays the same.
 */
let indexPromise;
function loadIndex() {
  indexPromise ||= fetch('/query-index.json').then((r) => r.json()).then((j) => j.data || []);
  return indexPromise;
}

export default function decorate(block) {
  block.textContent = '';
  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.innerHTML = `
    <input type="search" class="search-input" placeholder="Search..." aria-label="Search">
  `;
  const results = document.createElement('ul');
  results.className = 'search-results';
  results.setAttribute('role', 'listbox');

  const input = form.querySelector('input');
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const q = input.value.trim().toLowerCase();
      results.textContent = '';
      if (q.length < 2) return;
      const items = await loadIndex();
      items
        .filter((i) => (i.title || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q))
        .slice(0, 10)
        .forEach((item) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = item.path;
          a.textContent = item.title || item.path;
          li.append(a);
          results.append(li);
        });
    }, 200);
  });

  form.addEventListener('submit', (e) => e.preventDefault());
  block.append(form, results);
}
