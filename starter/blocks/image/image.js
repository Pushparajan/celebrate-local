/**
 * Image — AEM Core equivalent: Image component (captioned/aligned image beyond inline authoring).
 * Authoring: row1 = picture, row2 = caption (optional), row3 = alignment left|center|right (optional).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const picture = block.querySelector('picture');
  const captionRow = rows.find((r) => r !== picture?.closest('div') && r.textContent.trim() && !r.querySelector('picture'));

  if (picture) {
    picture.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'lazy'));
  }

  if (captionRow) {
    const figure = document.createElement('figure');
    const figcaption = document.createElement('figcaption');
    figcaption.append(...captionRow.childNodes);
    if (picture) figure.append(picture);
    figure.append(figcaption);
    block.textContent = '';
    block.append(figure);
  }

  const alignMatch = block.textContent.match(/\b(left|center|right)\b/i);
  if (alignMatch) block.classList.add(`image-align-${alignMatch[1].toLowerCase()}`);
}
