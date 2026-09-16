// Shared helper so the Fragment block re-uses the exact same decoration pipeline as a full
// page, instead of re-implementing block discovery — keeps Experience-Fragment-equivalent
// content indistinguishable from natively authored content once rendered.
import { decorateButtons, decorateIcons, decorateSections, decorateBlocks, loadBlocks } from './aem.js';

export default async function decorateAndLoad(temp, targetBlock) {
  decorateButtons(temp);
  decorateIcons(temp);
  decorateSections(temp);
  decorateBlocks(temp);
  targetBlock.append(...temp.childNodes);
  await loadBlocks(targetBlock);
}
