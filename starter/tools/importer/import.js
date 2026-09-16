/* global WebImporter */
export default {
  transformDOM: ({ document }) => {
    const main = document.querySelector('main') || document.body;

    // Strip legacy chrome not needed in EDS (header/footer are rebuilt from blocks)
    WebImporter.DOMUtils.remove(main, [
      '.legacy-nav', '.legacy-footer', '.cookie-banner', 'script', 'noscript',
    ]);

    // Example: map legacy `.promo-card` markup into an EDS Cards block table.
    const promoCards = main.querySelectorAll('.promo-card');
    if (promoCards.length) {
      const rows = [['Cards']];
      promoCards.forEach((card) => {
        rows.push([
          card.querySelector('img'),
          card.querySelector('.promo-title, h3'),
        ]);
      });
      const table = WebImporter.DOMUtils.createTable(rows, document);
      promoCards[0].closest('.promo-grid')?.replaceWith(table);
    }

    return main;
  },

  generateDocumentPath: ({ url }) => {
    const { pathname } = new URL(url);
    return pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index';
  },
};
