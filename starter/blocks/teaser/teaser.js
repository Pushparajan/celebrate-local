/**
 * Teaser — AEM Core equivalent: Teaser component (image + title + description + one or more CTAs).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const picture = block.querySelector('picture');
  const pictureWrapper = picture?.closest(':scope > div');

  const content = document.createElement('div');
  content.className = 'teaser-content';

  rows.forEach((row) => {
    if (row === pictureWrapper) return;
    content.append(...row.childNodes);
  });

  const media = document.createElement('div');
  media.className = 'teaser-media';
  if (picture) {
    picture.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
    media.append(picture);
  }

  content.querySelectorAll('a').forEach((a) => a.classList.add('button', 'button-primary'));

  block.textContent = '';
  block.append(media, content);
}
