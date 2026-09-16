/**
 * Title — AEM Core equivalent: Title component.
 * Authoring: row 1 = eyebrow (optional), row 2 = heading text, row 3 = size variant (optional: h1-h6).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, headingRow, sizeRow] = rows.length === 3 ? rows : [null, ...rows];

  const wrapper = document.createElement('div');
  wrapper.className = 'title-wrapper';

  if (eyebrowRow) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'title-eyebrow';
    eyebrow.append(...eyebrowRow.firstElementChild.childNodes);
    wrapper.append(eyebrow);
  }

  const level = sizeRow?.textContent.trim().match(/^h[1-6]$/) ? sizeRow.textContent.trim() : 'h2';
  const existingHeading = headingRow?.querySelector('h1,h2,h3,h4,h5,h6');
  let heading;
  if (existingHeading) {
    heading = existingHeading;
  } else {
    heading = document.createElement(level);
    heading.textContent = headingRow?.textContent.trim() || '';
  }
  wrapper.append(heading);

  block.textContent = '';
  block.append(wrapper);
}
