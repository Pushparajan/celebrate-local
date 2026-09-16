import { expect } from '@esm-bundle/chai';
import decorate from '../../blocks/hero/hero.js';

describe('Hero block', () => {
  it('adds hero-media and hero-text classes', () => {
    document.body.innerHTML = `
      <div class="hero">
        <div><picture><img src="a.jpg" alt="test"></picture></div>
        <div><h1>Title</h1></div>
      </div>`;
    const block = document.querySelector('.hero');
    decorate(block);
    expect(block.querySelector('.hero-media')).to.exist;
    expect(block.querySelector('.hero-text')).to.exist;
  });

  it('sets fetchpriority high on the hero image (LCP contract)', () => {
    document.body.innerHTML = `
      <div class="hero">
        <div><picture><img src="a.jpg" alt="test"></picture></div>
        <div><h1>Title</h1></div>
      </div>`;
    const block = document.querySelector('.hero');
    decorate(block);
    const img = block.querySelector('img');
    expect(img.getAttribute('fetchpriority')).to.equal('high');
  });
});
