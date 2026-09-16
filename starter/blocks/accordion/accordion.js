/**
 * Accordion — built on native <details>/<summary> for zero-JS a11y (no ARIA shimming needed).
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [summaryCell, bodyCell] = [...row.children];
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.append(...summaryCell.childNodes);
    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.append(...bodyCell.childNodes);
    details.append(summary, body);
    row.replaceWith(details);
  });
}
