/**
 * Embed — AEM Core equivalent: Embed component (URL/oEmbed based).
 * Authoring: a single URL (YouTube, Vimeo, or generic iframe-able URL) in the block.
 */
function getEmbedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname.includes('youtube.com') || url.hostname === 'youtu.be') {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').pop();
      return `https://player.vimeo.com/video/${id}`;
    }
    return rawUrl;
  } catch {
    return null;
  }
}

export default function decorate(block) {
  const link = block.querySelector('a') || block;
  const rawUrl = link.href || link.textContent.trim();
  const embedUrl = getEmbedUrl(rawUrl);
  if (!embedUrl) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'embed-placeholder';
  placeholder.innerHTML = '<button type="button" class="embed-play" aria-label="Load embedded content"></button>';
  block.textContent = '';
  block.append(placeholder);

  // Defer loading the actual iframe until user interaction (perf: doc 10) or lazy-phase visibility.
  const load = () => {
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = 'Embedded content';
    placeholder.replaceWith(iframe);
  };

  placeholder.querySelector('button').addEventListener('click', load);
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { load(); obs.disconnect(); }
  }).observe(placeholder);
}
