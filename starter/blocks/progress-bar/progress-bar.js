/**
 * Progress Bar — AEM Core equivalent: Progress Bar component.
 * Authoring: cell 1 = value (0-100), cell 2 = label (optional).
 */
export default function decorate(block) {
  const [valueCell, labelCell] = [...block.children];
  const value = Math.max(0, Math.min(100, Number(valueCell?.textContent.trim()) || 0));

  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'progress-bar-wrapper';
  wrapper.setAttribute('role', 'progressbar');
  wrapper.setAttribute('aria-valuenow', String(value));
  wrapper.setAttribute('aria-valuemin', '0');
  wrapper.setAttribute('aria-valuemax', '100');

  const fill = document.createElement('div');
  fill.className = 'progress-bar-fill';
  fill.style.width = `${value}%`;
  wrapper.append(fill);

  block.append(wrapper);
  if (labelCell?.textContent.trim()) {
    const label = document.createElement('p');
    label.className = 'progress-bar-label';
    label.textContent = labelCell.textContent.trim();
    block.append(label);
  }
}
