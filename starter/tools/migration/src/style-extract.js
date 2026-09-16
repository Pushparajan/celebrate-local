import { readdir, readFile } from 'node:fs/promises';
import { writeText, writeJSON } from './utils/fs.js';

const HEX_RE = /#[0-9a-f]{3,8}\b/gi;
const RGB_RE = /rgba?\([^)]+\)/gi;
const FONT_FAMILY_RE = /font-family\s*:\s*([^;}]+)/gi;
const RADIUS_RE = /border-radius\s*:\s*([^;}]+)/gi;

function tally(matches) {
  const counts = new Map();
  matches.forEach((raw) => {
    const v = raw.trim().toLowerCase();
    counts.set(v, (counts.get(v) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Scans every scraped CSS asset and extracts frequency-ranked color, font, and
 * border-radius values as *candidate* design tokens — a starting point for doc 03's
 * design-system adapter, not a finished token set. A human should still confirm which
 * values are real brand tokens vs. one-off legacy overrides before this ships.
 */
export async function runStyleExtract({ input, output }) {
  const cssDir = `${input}/assets/css`;
  let files = [];
  try {
    files = (await readdir(cssDir)).filter((f) => f.endsWith('.css'));
  } catch {
    console.warn(`[style-extract] no CSS assets found at ${cssDir} — run scrape first`);
    return null;
  }

  let allCss = '';
  await Promise.all(files.map(async (f) => {
    allCss += await readFile(`${cssDir}/${f}`, 'utf-8');
    allCss += '\n';
  }));

  const colors = tally([...allCss.matchAll(HEX_RE)].map((m) => m[0]).concat([...allCss.matchAll(RGB_RE)].map((m) => m[0])));
  const fonts = tally([...allCss.matchAll(FONT_FAMILY_RE)].map((m) => m[1]));
  const radii = tally([...allCss.matchAll(RADIUS_RE)].map((m) => m[1]));

  const topColors = colors.slice(0, 12);
  const topFonts = fonts.slice(0, 5);
  const topRadii = radii.slice(0, 4);

  const cssOut = [
    '/* AUTO-GENERATED CANDIDATE TOKENS — review before merging into styles/styles.css (doc 03) */',
    ':root {',
    ...topColors.map(([val], i) => `  --extracted-color-${i + 1}: ${val}; /* seen ${colors[i][1]}x */`),
    ...topFonts.map(([val], i) => `  --extracted-font-${i + 1}: ${val};`),
    ...topRadii.map(([val], i) => `  --extracted-radius-${i + 1}: ${val};`),
    '}',
  ].join('\n');

  await writeText(`${output}/tokens.candidate.css`, cssOut);
  await writeJSON(`${output}/tokens-report.json`, {
    generatedAt: new Date().toISOString(),
    sourceFiles: files.length,
    colors: topColors,
    fonts: topFonts,
    radii: topRadii,
  });

  console.log(`[style-extract] ${topColors.length} colors, ${topFonts.length} fonts, ${topRadii.length} radii -> ${output}/tokens.candidate.css`);
  return { colors: topColors, fonts: topFonts, radii: topRadii };
}
