import { readJSON, writeText } from './utils/fs.js';
import { MIN_CONFIDENCE } from './rules/block-rules.js';

/**
 * Summarizes classification results into a human-readable migration report:
 * per-page block coverage, and an explicit "needs manual review" list. This is the input
 * to docs/15-migration-utilities.md's parity-check step — nothing here should be treated
 * as "done" until a person has looked at every flagged item.
 */
export async function runReport({ input, output }) {
  const { pages } = await readJSON(`${input}/classified.json`);

  const lines = [
    '# Migration Classification Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Pages: ${pages.length}`,
    '',
  ];

  let totalSections = 0;
  let totalBlocks = 0;
  let totalPassthrough = 0;
  let totalLowConfidence = 0;
  const blockCounts = {};

  pages.forEach((page) => {
    lines.push(`## ${page.title || page.slug}`, `${page.url}`, '');
    lines.push('| Block | Confidence | Note |', '|---|---|---|');

    page.sections.forEach((s) => {
      totalSections += 1;
      if (s.blockId === null) {
        totalPassthrough += 1;
        lines.push(`| _passthrough text_ | — | "${s.snippet?.slice(0, 60)}..." |`);
        return;
      }
      totalBlocks += 1;
      blockCounts[s.blockId] = (blockCounts[s.blockId] || 0) + 1;
      const flag = s.confidence < MIN_CONFIDENCE ? ' ⚠️ REVIEW' : '';
      if (s.confidence < MIN_CONFIDENCE) totalLowConfidence += 1;
      lines.push(`| ${s.blockId}${flag} | ${s.confidence.toFixed(2)} | ${s.note || ''} |`);
    });
    lines.push('');
  });

  lines.push(
    '## Summary',
    '',
    `- Total sections: ${totalSections}`,
    `- Classified as blocks: ${totalBlocks}`,
    `- Passthrough text (no block needed): ${totalPassthrough}`,
    `- Flagged for manual review (confidence < ${MIN_CONFIDENCE}): ${totalLowConfidence}`,
    '',
    '### Block usage',
    '',
    ...Object.entries(blockCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => `- ${id}: ${count}`),
    '',
    '### Not auto-detected (see docs/04) — map these by hand per page',
    '',
    '- `content-fragment` / `content-fragment-list` — requires a content-modeling decision, not a DOM pattern (doc 05)',
    '- `fragment` (Experience Fragment equivalent) — requires deciding what content is actually shared/reused',
    '- `image-compare` — rare enough in the wild that auto-detection isn\'t reliable; find manually',
    '- `language-nav` — locale-switcher markup varies too widely to pattern-match generically',
    '- `search`, `toc` — these are usually *added* during migration rather than recovered from legacy markup',
    '- `title` — native text unless the legacy page has a clear eyebrow/kicker pattern worth a dedicated block',
  );

  await writeText(`${output}/report.md`, lines.join('\n'));
  console.log(`[report] written -> ${output}/report.md`);
  console.log(`[report] ${totalBlocks} sections classified as blocks, ${totalLowConfidence} flagged for review, ${totalPassthrough} passthrough`);
}
