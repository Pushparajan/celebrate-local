/**
 * Share — AEM Core equivalent: Social Media Sharing component.
 * Authoring: optional row listing networks (comma-separated: linkedin,x,facebook,email,copy). Defaults to all.
 */
const NETWORKS = {
  linkedin: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  x: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  email: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
};

export default function decorate(block) {
  const requested = block.textContent.trim().split(',').map((s) => s.trim()).filter(Boolean);
  const networks = requested.length ? requested : Object.keys(NETWORKS).concat('copy');
  const url = window.location.href;
  const title = document.title;

  block.textContent = '';
  const list = document.createElement('ul');
  list.className = 'share-list';

  networks.forEach((name) => {
    const li = document.createElement('li');
    if (name === 'copy') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'share-link';
      btn.textContent = 'Copy link';
      btn.addEventListener('click', () => navigator.clipboard?.writeText(url));
      li.append(btn);
    } else if (NETWORKS[name]) {
      const a = document.createElement('a');
      a.className = 'share-link';
      a.href = NETWORKS[name](url, title);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = name;
      li.append(a);
    }
    list.append(li);
  });

  block.append(list);
}
