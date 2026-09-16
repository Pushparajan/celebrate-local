#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runCrawl } from '../src/crawl.js';
import { runScrape } from '../src/scrape.js';
import { runClassify } from '../src/classify.js';
import { runGenerate } from '../src/generate-docx.js';
import { runReport } from '../src/report.js';
import { runStyleExtract } from '../src/style-extract.js';
import { runProposeBlocks } from '../src/propose-blocks.js';
import { runScaffoldBlocks } from '../src/scaffold-blocks.js';
import { ensureDir } from '../src/utils/fs.js';

const common = (y) => y
  .option('output', { alias: 'o', type: 'string', default: 'output', describe: 'Output directory' });

await yargs(hideBin(process.argv))
  .scriptName('eds-migrate')
  .command(
    'crawl',
    'Discover pages on the target site (sitemap.xml + link-following, same-origin, robots.txt respected)',
    (y) => common(y)
      .option('url', { alias: 'u', type: 'string', demandOption: true, describe: 'Start URL, e.g. https://example.com' })
      .option('max-pages', { type: 'number', default: 200 })
      .option('max-depth', { type: 'number', default: 4 })
      .option('respect-robots', { type: 'boolean', default: true }),
    async (argv) => {
      await ensureDir(argv.output);
      await runCrawl(argv);
    },
  )
  .command(
    'scrape',
    'Fetch each crawled page and save its content, stylesheets, and a JS asset manifest',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output', describe: 'Directory containing sitemap.json' })
      .option('concurrency', { type: 'number', default: 5 }),
    async (argv) => {
      await ensureDir(argv.output);
      await runScrape(argv);
    },
  )
  .command(
    'extract-styles',
    'Extract candidate design tokens (colors, fonts, radii) from scraped CSS',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output' }),
    async (argv) => {
      await ensureDir(argv.output);
      await runStyleExtract(argv);
    },
  )
  .command(
    'classify',
    'Classify each scraped page\'s sections against the EDS block library',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output' }),
    async (argv) => {
      await ensureDir(argv.output);
      await runClassify(argv);
    },
  )
  .command(
    'generate',
    'Generate one .docx per page (EDS block tables), ready to upload to your content source',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output' })
      .option('classified-file', { type: 'string', default: 'classified.json', describe: 'Use classified.scaffolded.json after running scaffold-blocks' }),
    async (argv) => {
      await ensureDir(argv.output);
      await runGenerate({ ...argv, classifiedFile: argv.classifiedFile });
    },
  )
  .command(
    'propose-blocks',
    'List every unmatched section as a new-block candidate for human review (writes block-candidates.json, generates nothing)',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output' }),
    async (argv) => {
      await ensureDir(argv.output);
      await runProposeBlocks(argv);
    },
  )
  .command(
    'scaffold-blocks',
    'Generate block code (JS + CSS + test) for every candidate marked approved:true in block-candidates.json',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output' })
      .option('blocks-dir', { type: 'string', default: '../../blocks', describe: 'Where to write blocks/<name>/ — defaults to this starter repo\'s block library' })
      .option('force', { type: 'boolean', default: false, describe: 'Overwrite an existing block folder with the same name' }),
    async (argv) => {
      await ensureDir(argv.output);
      await runScaffoldBlocks(argv);
    },
  )
  .command(
    'report',
    'Write a migration coverage report (block usage + manual-review flags)',
    (y) => common(y)
      .option('input', { alias: 'i', type: 'string', default: 'output' }),
    async (argv) => {
      await ensureDir(argv.output);
      await runReport(argv);
    },
  )
  .command(
    'all',
    'Run the full pipeline: crawl -> scrape -> extract-styles -> classify -> generate -> report',
    (y) => common(y)
      .option('url', { alias: 'u', type: 'string', demandOption: true })
      .option('max-pages', { type: 'number', default: 200 })
      .option('max-depth', { type: 'number', default: 4 })
      .option('respect-robots', { type: 'boolean', default: true })
      .option('concurrency', { type: 'number', default: 5 }),
    async (argv) => {
      await ensureDir(argv.output);
      await runCrawl(argv);
      await runScrape({ ...argv, input: argv.output });
      await runStyleExtract({ ...argv, input: argv.output });
      await runClassify({ ...argv, input: argv.output });
      await runGenerate({ ...argv, input: argv.output });
      await runReport({ ...argv, input: argv.output });
    },
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();
