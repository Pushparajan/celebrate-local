import { expect } from '@esm-bundle/chai';
import decorate from '../../blocks/button/button.js';

describe('Button block', () => {
  it('classifies strong-wrapped links as primary buttons', () => {
    document.body.innerHTML = `
      <div class="button">
        <div><p><strong><a href="/cta">Go</a></strong></p></div>
      </div>`;
    const block = document.querySelector('.button');
    decorate(block);
    const link = block.querySelector('a');
    expect(link.classList.contains('button-primary')).to.equal(true);
  });
});
