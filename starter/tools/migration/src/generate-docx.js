import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType } from 'docx';
import { mkdir, writeFile } from 'node:fs/promises';
import { readJSON } from './utils/fs.js';

/**
 * Turns classified sections into a real .docx file using the same convention EDS itself
 * expects from authored Word documents: a table whose first row is a single cell containing
 * the block name (e.g. "Cards"), followed by one row per content cell. Uploading this file to
 * SharePoint/GDrive (or importing into da.live) and previewing it renders exactly the way a
 * human-authored page for these blocks would — see docs/04 and docs/06.
 *
 * Scraped images are NOT embedded as binary — the source URL + alt text is left in the cell
 * as a placeholder for the content team to swap in a real DAM/asset-managed image during
 * review. Embedding hotlinked, unlicensed, or low-res scraped images automatically would be
 * the wrong default for a production migration.
 */
function cell(text, { header = false } = {}) {
  return new TableCell({
    children: [new Paragraph({ text: String(text ?? ''), heading: header ? HeadingLevel.HEADING_3 : undefined })],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function blockTable(rows) {
  const [nameRow, ...contentRows] = rows;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [cell(nameRow[0], { header: true })] }),
      ...contentRows.map((row) => new TableRow({ children: row.map((c) => cell(c)) })),
    ],
  });
}

function sectionToDocxNodes(section) {
  if (section.blockId === null) {
    // Passthrough content: rendered as a plain paragraph, exactly like native EDS text —
    // no block table needed.
    return [new Paragraph({ text: section.snippet || '' })];
  }
  const nodes = [blockTable(section.rows), new Paragraph({ text: '' })]; // spacer paragraph between blocks
  if (section.note) nodes.push(new Paragraph({ text: `[migration note] ${section.note}`, italics: true }));
  return nodes;
}

export async function generatePageDocx(page) {
  const children = [
    new Paragraph({ text: page.title || page.slug, heading: HeadingLevel.HEADING_1 }),
    ...page.sections.flatMap(sectionToDocxNodes),
  ];
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function runGenerate({ input, output, classifiedFile = 'classified.json' }) {
  const { pages } = await readJSON(`${input}/${classifiedFile}`);
  await mkdir(`${output}/docx`, { recursive: true });

  for (const page of pages) {
    const buffer = await generatePageDocx(page);
    const filePath = `${output}/docx/${page.slug}.docx`;
    await writeFile(filePath, buffer);
    console.log(`[generate] ${page.slug} -> ${filePath}`);
  }

  console.log(`\n[generate] done — ${pages.length} .docx files written to ${output}/docx/`);
  console.log('[generate] Next: upload these to your content source (SharePoint/GDrive) at the');
  console.log('           fstab.yaml mount point, then open each in Universal Editor to review');
  console.log('           block content, swap in real images, and fix anything flagged in the report.');
}
