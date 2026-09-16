/**
 * Separator — AEM Core equivalent: Separator component. Purely presentational <hr>.
 */
export default function decorate(block) {
  block.textContent = '';
  block.append(document.createElement('hr'));
}
