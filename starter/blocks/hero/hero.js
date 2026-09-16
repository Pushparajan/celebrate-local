/**
 * Hero — LCP block, eager-loaded. Do not add lazy-loading or async work here.
 */
export default function decorate(block) {
  const [mediaWrapper, textWrapper] = [...block.children];

  if (mediaWrapper) {
    mediaWrapper.classList.add('hero-media');
    const img = mediaWrapper.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    }
  }

  if (textWrapper) {
    textWrapper.classList.add('hero-text');
  }
}
