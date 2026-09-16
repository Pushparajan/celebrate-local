/**
 * Image Compare — AEM Core equivalent: Image Comparison Slider.
 * Authoring: row1 = before picture, row2 = after picture.
 */
export default function decorate(block) {
  const [beforeRow, afterRow] = [...block.children];
  const before = beforeRow?.querySelector('picture');
  const after = afterRow?.querySelector('picture');
  if (!before || !after) return;

  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'image-compare-wrapper';

  const afterWrap = document.createElement('div');
  afterWrap.className = 'image-compare-after';
  afterWrap.append(after);

  const beforeWrap = document.createElement('div');
  beforeWrap.className = 'image-compare-before';
  beforeWrap.append(before);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0; slider.max = 100; slider.value = 50;
  slider.className = 'image-compare-slider';
  slider.setAttribute('aria-label', 'Comparison slider');

  const setSplit = (val) => { beforeWrap.style.clipPath = `inset(0 ${100 - val}% 0 0)`; };
  setSplit(50);
  slider.addEventListener('input', (e) => setSplit(e.target.value));

  wrapper.append(afterWrap, beforeWrap, slider);
  block.append(wrapper);
}
