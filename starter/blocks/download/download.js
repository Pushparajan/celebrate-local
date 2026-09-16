/**
 * Download — AEM Core equivalent: Download component.
 * Authoring: a single link to a file. Renders file type, size (if resolvable) and a download affordance.
 */
function formatBytes(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function decorate(block) {
  const link = block.querySelector('a');
  if (!link) return;
  const url = new URL(link.href, window.location.href);
  const ext = url.pathname.split('.').pop().toUpperCase();
  const title = link.textContent.trim() || url.pathname.split('/').pop();

  link.textContent = '';
  link.className = 'download-link';
  link.setAttribute('download', '');

  const icon = document.createElement('span');
  icon.className = 'download-icon';
  icon.textContent = ext;

  const meta = document.createElement('span');
  meta.className = 'download-meta';
  const titleEl = document.createElement('span');
  titleEl.className = 'download-title';
  titleEl.textContent = title;
  meta.append(titleEl);

  // Optional: HEAD request to resolve file size, non-blocking, best-effort.
  fetch(url, { method: 'HEAD' }).then((res) => {
    const size = res.headers.get('content-length');
    if (size) {
      const sizeEl = document.createElement('span');
      sizeEl.className = 'download-size';
      sizeEl.textContent = `${ext} · ${formatBytes(Number(size))}`;
      meta.append(sizeEl);
    }
  }).catch(() => {});

  link.append(icon, meta);
  block.textContent = '';
  block.append(link);
}
