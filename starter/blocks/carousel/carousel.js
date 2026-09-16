/**
 * Carousel — AEM Core equivalent: Carousel component.
 * Authoring: each row = one slide (image + caption cells). Autoplay off by default (a11y: doc 09).
 */
export default function decorate(block) {
  const slides = [...block.children];
  const track = document.createElement('div');
  track.className = 'carousel-track';

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Slides');

  slides.forEach((row, i) => {
    row.className = 'carousel-slide';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-roledescription', 'slide');
    row.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    row.querySelectorAll('img').forEach((img) => img.setAttribute('loading', i === 0 ? 'eager' : 'lazy'));
    track.append(row);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => {
      row.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    });
    nav.append(dot);
  });

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-arrow carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-arrow carousel-next';
  next.setAttribute('aria-label', 'Next slide');

  const scrollBy = (dir) => track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
  prev.addEventListener('click', () => scrollBy(-1));
  next.addEventListener('click', () => scrollBy(1));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const idx = slides.indexOf(entry.target);
      if (entry.isIntersecting && idx > -1) {
        [...nav.children].forEach((d, i) => d.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
      }
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach((s) => observer.observe(s));

  block.textContent = '';
  block.append(track, prev, next, nav);
}
