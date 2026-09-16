import { readdir, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { readJSON, writeJSON, writeText, ensureDir } from './utils/fs.js';

/**
 * Turns human-approved block-candidates.json entries into real block code:
 * blocks/<name>/<name>.js + <name>.css, following the exact same decorate(block) contract
 * as every other block in the library (docs/04), plus Universal Editor config fragments and
 * an updated classified-with-scaffolds.json ready for `generate` to turn into a .docx.
 *
 * This is deliberately NOT an AI code generator. It does two mechanical, inspectable things:
 *   1. Structural clone — the original scraped markup becomes the block's authored content,
 *      and decorate() applies light, generic structuring (tags the first image/heading/links
 *      with predictable classes) rather than guessing bespoke behavior.
 *   2. CSS lift — style rules whose selectors reference the section's original classes are
 *      pulled from the scraped stylesheets and rewritten to be scoped under the new block's
 *      class, with any exact-match colors swapped for extracted design tokens where possible.
 * Both steps produce a real starting point, not a finished block — review every generated
 * file the way you'd review any other PR before it ships (see the checklist in docs/04).
 */

function toKebab(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'custom-block';
}

function toTitle(name) {
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Naive top-level CSS rule parser: brace-depth scanner, flattens @media bodies, skips other at-rules. */
function parseCssRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const braceOpen = css.indexOf('{', i);
    if (braceOpen === -1) break;
    const selector = css.slice(i, braceOpen).trim();
    let depth = 1;
    let j = braceOpen + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(braceOpen + 1, j - 1).trim();
    if (selector.startsWith('@media')) rules.push(...parseCssRules(body));
    else if (selector && !selector.startsWith('@')) rules.push({ selector, body });
    i = j;
  }
  return rules;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadAllCss(input) {
  const cssDir = `${input}/assets/css`;
  try {
    const files = (await readdir(cssDir)).filter((f) => f.endsWith('.css'));
    const chunks = await Promise.all(files.map((f) => readFile(`${cssDir}/${f}`, 'utf-8')));
    return chunks.join('\n');
  } catch {
    return '';
  }
}

function liftCss(allCssRules, candidate, blockName, tokenMap) {
  const primaryClass = candidate.classes[0];
  const matched = allCssRules.filter((rule) => candidate.classes.some((c) => new RegExp(`\\.${escapeRegExp(c)}\\b`).test(rule.selector)));

  const lines = [
    `/* AUTO-SCAFFOLDED from migration source classes: ${candidate.classes.join(', ') || '(none found)'} */`,
    `/* Review against docs/03 (design-system adapter) and docs/09 (accessibility) before merging. */`,
    '',
  ];

  matched.forEach(({ selector, body }) => {
    let newSelector = selector;
    if (primaryClass) {
      const primaryRe = new RegExp(`\\.${escapeRegExp(primaryClass)}\\b`);
      newSelector = primaryRe.test(selector)
        ? selector.replace(primaryRe, `.${blockName}`)
        : `.${blockName} ${selector}`;
    } else {
      newSelector = `.${blockName} ${selector}`;
    }

    let newBody = body;
    Object.entries(tokenMap).forEach(([value, varName]) => {
      newBody = newBody.split(value).join(`var(${varName}) /* was ${value} */`);
    });

    lines.push(`${newSelector} {\n  ${newBody.split(';').map((d) => d.trim()).filter(Boolean).join(';\n  ')};\n}`);
  });

  if (!matched.length) {
    lines.push(`.${blockName} {`, '  /* no matching source CSS found for these classes — style from scratch */', '}');
  }

  return lines.join('\n\n');
}

function buildJs(blockName, sampleHtml) {
  const $ = cheerio.load(sampleHtml, null, false);
  const hasImage = $('img,picture').length > 0;
  const hasHeading = $('h1,h2,h3,h4,h5,h6').length > 0;
  const hasLinks = $('a').length > 0;

  return `/**
 * ${toTitle(blockName)} — AUTO-SCAFFOLDED by tools/migration/scaffold-blocks.js from an
 * unmatched section during site migration. This is a structural starting point, not a
 * finished block: review it against the block contract in docs/04 before it ships
 * (progressive enhancement, no layout assumptions about its parent, a unit test).
 *
 * Authoring shape: a single row, single cell containing the migrated rich content.
 * decorate() applies light, generic structuring below — replace with real behavior
 * once you know what this section is actually supposed to do.
 */
export default function decorate(block) {
  const content = block.firstElementChild;
  if (!content) return;
${hasImage ? `
  const media = content.querySelector('img, picture');
  if (media) (media.closest('picture') || media).classList.add('${blockName}-media');
` : ''}${hasHeading ? `
  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) heading.classList.add('${blockName}-heading');
` : ''}${hasLinks ? `
  content.querySelectorAll('a').forEach((a) => {
    if (!a.closest('.${blockName}-media')) a.classList.add('button');
  });
` : ''}
  content.classList.add('${blockName}-body');
}
`;
}

function buildTest(blockName) {
  return `import { expect } from '@esm-bundle/chai';
import decorate from '../../blocks/${blockName}/${blockName}.js';

describe('${toTitle(blockName)} block (scaffolded — replace with real assertions)', () => {
  it('adds the -body class to the authored content wrapper', () => {
    document.body.innerHTML = '<div class="${blockName}"><div><p>placeholder</p></div></div>';
    const block = document.querySelector('.${blockName}');
    decorate(block);
    expect(block.querySelector('.${blockName}-body')).to.exist;
  });
});
`;
}

export async function runScaffoldBlocks({ input, output, blocksDir, force = false }) {
  const [{ candidates }, { pages }] = await Promise.all([
    readJSON(`${input}/block-candidates.json`),
    readJSON(`${input}/classified.json`),
  ]);
  const approved = candidates.filter((c) => c.approved);

  if (!approved.length) {
    console.log('[scaffold-blocks] no approved candidates found — nothing to do.');
    console.log('[scaffold-blocks] set "approved": true in block-candidates.json for the sections you want scaffolded.');
    return;
  }

  const allCssText = await loadAllCss(input);
  const allCssRules = parseCssRules(allCssText);

  let tokenMap = {};
  try {
    const tokens = await readJSON(`${input}/tokens-report.json`);
    tokens.colors.forEach(([value], i) => { tokenMap[value] = `--extracted-color-${i + 1}`; });
  } catch { /* extract-styles wasn't run — fine, token substitution is best-effort */ }

  const componentDefinitions = [];
  const componentModels = [];
  const scaffolded = [];

  for (const candidate of approved) {
    const blockName = toKebab(candidate.name || candidate.suggestedName);
    const blockDir = `${blocksDir}/${blockName}`;

    const existsAlready = await readdir(blocksDir).then((d) => d.includes(blockName)).catch(() => false);
    if (existsAlready && !force) {
      console.warn(`[scaffold-blocks] SKIPPED "${blockName}" — a block with this name already exists. Rename the candidate or pass --force.`);
      continue;
    }

    const page = pages.find((p) => p.slug === candidate.page);
    const section = page?.sections[candidate.sectionIndex];
    if (!section || section.blockId !== null) {
      console.warn(`[scaffold-blocks] SKIPPED "${blockName}" — source section not found or no longer unmatched (re-run classify?)`);
      continue;
    }

    await ensureDir(blockDir);
    await writeText(`${blockDir}/${blockName}.js`, buildJs(blockName, section.html));
    await writeText(`${blockDir}/${blockName}.css`, liftCss(allCssRules, candidate, blockName, tokenMap));

    const testDir = `${blocksDir}/../test/blocks`;
    await ensureDir(testDir);
    await writeText(`${testDir}/${blockName}.test.js`, buildTest(blockName));

    componentDefinitions.push({ title: toTitle(blockName), id: blockName });
    componentModels.push({
      id: blockName,
      fields: [{ component: 'richtext', name: 'content', label: 'Content (scaffolded — refine fields by hand)' }],
    });

    section.blockId = blockName;
    section.confidence = 1;
    section.note = 'Scaffolded block — human-approved during migration review.';
    section.rows = [[toTitle(blockName)], [section.html]];

    scaffolded.push({ blockName, page: candidate.page, blockDir });
    console.log(`[scaffold-blocks] ${blockName} -> ${blockDir}/ (from ${candidate.page}, section ${candidate.sectionIndex})`);
  }

  await writeJSON(`${output}/classified.scaffolded.json`, { classifiedAt: new Date().toISOString(), pages });
  await ensureDir(`${output}/generated-components`);
  await writeJSON(`${output}/generated-components/component-definition.fragment.json`, componentDefinitions);
  await writeJSON(`${output}/generated-components/component-models.fragment.json`, componentModels);

  console.log(`\n[scaffold-blocks] done — ${scaffolded.length} block(s) scaffolded.`);
  console.log('[scaffold-blocks] Next:');
  console.log('  1. Review every generated .js/.css/.test.js file — this is a starting point, not finished code.');
  console.log('  2. Merge generated-components/*.fragment.json entries into component-definition.json / component-models.json.');
  console.log(`  3. Run \`generate --input ${output} \` again, but point it at classified.scaffolded.json (rename it to classified.json, or pass --classified-file).`);
}
