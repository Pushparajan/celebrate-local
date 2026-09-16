// EDS three-phase loading bootstrap: Eager -> Lazy -> Delayed
import {
  buildBlock, loadHeader, loadFooter, decorateButtons, decorateIcons,
  decorateSections, decorateBlocks, decorateTemplateAndTheme,
  waitForLCP, loadBlocks, loadCSS, getMetadata,
} from './aem.js';

const LCP_BLOCKS = ['hero'];

function buildAutoBlocks(main) {
  try {
    // Example: turn a naked <picture> immediately followed by an <h1> into a Hero block
    const h1 = main.querySelector('h1');
    const picture = main.querySelector('picture');
    if (h1 && picture && h1.compareDocumentPosition(picture) === Node.DOCUMENT_POSITION_PRECEDING) {
      const section = document.createElement('div');
      section.append(buildBlock('hero', { elems: [picture, h1] }));
      main.prepend(section);
    }
  } catch (e) {
    console.error('Auto Blocking failed', e);
  }
}

function decorateMain(main) {
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  window.setTimeout(() => import('./delayed.js'), 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
}

loadPage();
