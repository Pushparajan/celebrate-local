import { expect } from '@esm-bundle/chai';
import decorate from '../../blocks/accordion/accordion.js';

describe('Accordion block', () => {
  it('produces native details/summary elements (no custom ARIA needed)', () => {
    document.body.innerHTML = `
      <div class="accordion">
        <div><div>Question</div><div>Answer</div></div>
      </div>`;
    const block = document.querySelector('.accordion');
    decorate(block);
    expect(block.querySelector('details')).to.exist;
    expect(block.querySelector('summary').textContent).to.equal('Question');
  });
});
