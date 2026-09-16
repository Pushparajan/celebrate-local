import { expect } from '@esm-bundle/chai';
import decorate from '../../blocks/tabs/tabs.js';

describe('Tabs block', () => {
  it('builds an ARIA tablist with one panel visible', () => {
    document.body.innerHTML = `
      <div class="tabs">
        <div><div>One</div><div>Panel one</div></div>
        <div><div>Two</div><div>Panel two</div></div>
      </div>`;
    const block = document.querySelector('.tabs');
    decorate(block);
    const tabs = block.querySelectorAll('[role="tab"]');
    const panels = block.querySelectorAll('[role="tabpanel"]');
    expect(tabs.length).to.equal(2);
    expect(panels[0].hidden).to.equal(false);
    expect(panels[1].hidden).to.equal(true);
  });
});
