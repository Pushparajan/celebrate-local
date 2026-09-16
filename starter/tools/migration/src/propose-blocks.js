import { readJSON, writeJSON } from './utils/fs.js';

/**
 * Turns every passthrough (unmatched) section across the classified site into a candidate
 * new-block proposal — but does NOT scaffold any code yet. This file is the human review
 * gate: nothing in `scaffold-blocks.js` runs against a candidate until a person has set
 * `"approved": true` on it (and optionally renamed it) in the written JSON file.
 *
 * This is a deliberate design choice, not a missing feature: auto-generating and committing
 * new block code straight from a heuristic guess is exactly the kind of thing that should
 * require a human decision first (see docs/15's "what this can't/shouldn't automate" note).
 */
function suggestName(section) {
  const fromClass = section.classes.find((c) => !/^(row|col|container|wrapper|item)\d*$/i.test(c));
  if (fromClass) return fromClass.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const fromText = section.snippet.toLowerCase().split(/\s+/).slice(0, 3).join('-').replace(/[^a-z0-9-]/g, '');
  return fromText || 'custom-block';
}

export async function runProposeBlocks({ input, output }) {
  const { pages } = await readJSON(`${input}/classified.json`);
  const candidates = [];

  pages.forEach((page) => {
    page.sections.forEach((section, index) => {
      if (section.blockId !== null) return; // only unmatched sections are candidates
      candidates.push({
        page: page.slug,
        sectionIndex: index,
        suggestedName: suggestName(section),
        textPreview: section.snippet,
        classes: section.classes,
        tag: section.tag,
        approved: false, // <-- flip to true (and edit `name` if you like) to scaffold this
        name: suggestName(section),
      });
    });
  });

  await writeJSON(`${output}/block-candidates.json`, {
    generatedAt: new Date().toISOString(),
    instructions: 'Review each candidate. Set approved:true (and optionally edit "name") for '
      + 'every section that should become a real block, then run `scaffold-blocks`. Anything '
      + 'left approved:false is skipped — it stays as plain migrated text, which is a '
      + 'perfectly valid outcome for content that doesn\'t need a custom block.',
    candidates,
  });

  console.log(`[propose-blocks] ${candidates.length} candidates written to ${output}/block-candidates.json`);
  console.log('[propose-blocks] Review that file and set approved:true before running scaffold-blocks.');
  return candidates;
}
