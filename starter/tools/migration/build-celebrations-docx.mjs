/**
 * One-off authoring script: builds the "Celebration events in Aurora, IL" sample page as a
 * real .docx, using the exact block-table convention EDS authoring expects (docs/04, docs/06).
 * Demonstrates block composition — a Cards block nested inside each Tabs panel, matching the
 * nesting docs/06's component-filters.json actually allows (tabs -> cards).
 *
 * Run from tools/migration/ (needs its `docx` dependency): node build-celebrations-docx.mjs
 */
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType, TextRun } from 'docx';
import { writeFile, mkdir } from 'node:fs/promises';

const CATEGORIES = {
  cultural: 'Cultural & Heritage',
  wedding: 'Weddings & Anniversaries',
  holiday: 'Holiday & Seasonal',
  family: 'Family Milestones',
  party: 'Parties & Nightlife',
};

const EVENTS = [
  { title: 'Aurora Diwali Festival of Lights', cat: 'cultural', date: 'Fri, Nov 6 • 6:00 PM', venue: 'Paramount Theatre', price: '$15', emoji: '🪔' },
  { title: 'Quinceañera Expo & Showcase', cat: 'family', date: 'Sat, Mar 14 • 11:00 AM', venue: 'RiverEdge Park', price: 'Free', emoji: '👑' },
  { title: "New Year's Eve Bash at Hollywood Casino", cat: 'party', date: 'Wed, Dec 31 • 9:00 PM', venue: 'Hollywood Casino Aurora', price: '$45', emoji: '🥂' },
  { title: 'Hmong New Year Celebration', cat: 'cultural', date: 'Sat, Nov 21 • 10:00 AM', venue: 'Prisco Community Center', price: 'Free', emoji: '🧧' },
  { title: '50th Wedding Anniversary Gala', cat: 'wedding', date: 'Sat, Oct 18 • 6:30 PM', venue: 'Two Brothers Roundhouse', price: '$60', emoji: '💍' },
  { title: 'Aurora Pride Celebration & Parade', cat: 'cultural', date: 'Sat, Jun 13 • 12:00 PM', venue: 'Downtown Aurora', price: 'Free', emoji: '🏳️‍🌈' },
  { title: 'Día de los Muertos Community Celebration', cat: 'cultural', date: 'Sun, Nov 2 • 2:00 PM', venue: 'David L. Pierce Art & History Center', price: 'Free', emoji: '💀' },
  { title: 'Juneteenth Freedom Celebration', cat: 'holiday', date: 'Fri, Jun 19 • 4:00 PM', venue: 'Phillips Park', price: 'Free', emoji: '✊🏽' },
  { title: 'Downtown Aurora Oktoberfest', cat: 'holiday', date: 'Sat, Sep 26 • 12:00 PM', venue: 'Water Street Mall', price: '$10', emoji: '🍺' },
  { title: 'Golden Baby Shower Brunch Workshop', cat: 'family', date: 'Sun, Aug 24 • 11:00 AM', venue: 'The Venue at Stonebridge', price: '$25', emoji: '🍼' },
  { title: 'Graduation Celebration Bash', cat: 'party', date: 'Sat, May 30 • 7:00 PM', venue: 'The Matrix Club', price: '$20', emoji: '🎓' },
  { title: 'Winter Holiday Lights Celebration', cat: 'holiday', date: 'Sat, Dec 6 • 5:00 PM', venue: 'RiverEdge Park', price: 'Free', emoji: '❄️' },
  { title: 'Sweet 16 Party Planning Showcase', cat: 'family', date: 'Sat, Apr 11 • 1:00 PM', venue: 'Hilton Garden Inn Aurora', price: 'Free', emoji: '🎂' },
  { title: 'Lunar New Year Celebration', cat: 'cultural', date: 'Sat, Feb 7 • 11:00 AM', venue: 'Aurora Public Library', price: 'Free', emoji: '🐉' },
];

function cell(content) {
  const children = typeof content === 'string'
    ? [new Paragraph({ children: [new TextRun(content)] })]
    : Array.isArray(content) ? content : [content];
  return new TableCell({ children, width: { size: 100, type: WidthType.PERCENTAGE } });
}

function blockTable(name, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [cell(new Paragraph({ children: [new TextRun({ text: name, bold: true })] }))] }),
      ...rows.map((row) => new TableRow({ children: row.map((c) => cell(c)) })),
    ],
  });
}

/** Cards block: row1 = "Cards", then one row per event: [image placeholder, title+meta text]. */
function cardsBlock(events) {
  const rows = events.map((ev) => [
    `${ev.emoji}  (replace with event photo — alt: "${ev.title}")`,
    [
      new Paragraph({ children: [new TextRun({ text: `${ev.date}`, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: ev.title, bold: true, size: 24 })] }),
      new Paragraph({ text: `${ev.venue}, Aurora, IL` }),
      new Paragraph({ text: `${ev.price} · ${CATEGORIES[ev.cat]}` }),
      new Paragraph({ children: [new TextRun({ text: '[See tickets](#)', italics: true })] }),
    ],
  ]);
  return blockTable('Cards', rows);
}

/** Tabs block with a Cards block nested inside each panel cell — matches the tabs->cards
 *  nesting allowed by component-filters.json (docs/06). */
function tabsWithCardsBlock() {
  const tabs = [
    { label: 'All celebrations', events: EVENTS },
    ...Object.entries(CATEGORIES).map(([cat, label]) => ({ label, events: EVENTS.filter((e) => e.cat === cat) })),
  ];
  const rows = tabs.map((tab) => [
    tab.label,
    [new Paragraph({ text: '' }), cardsBlock(tab.events)],
  ]);
  return blockTable('Tabs', rows);
}

async function build() {
  const children = [
    // --- Metadata block ---
    blockTable('Metadata', [
      ['Title', 'Celebration events in Aurora, IL'],
      ['Description', 'Festivals, milestones, cultural traditions, and parties happening around Aurora, IL.'],
      ['Template', 'listing'],
    ]),
    new Paragraph({ text: '' }),

    // --- Title block (eyebrow + heading) ---
    blockTable('Title', [
      ['Aurora, IL'],
      ['Celebration events in Aurora, IL'],
      ['h1'],
    ]),
    new Paragraph({ text: '' }),

    // --- Breadcrumb block ---
    blockTable('Breadcrumb', [
      ['Home (/) > Illinois (/illinois) > Aurora (/illinois/aurora) > Celebrations (/illinois/aurora/celebrations)'],
    ]),
    new Paragraph({ text: '' }),

    // --- Search block ---
    blockTable('Search', [
      ['Search celebrations, festivals, parties...'],
    ]),
    new Paragraph({ text: '' }),

    // --- Tabs + nested Cards blocks (the category browsing UI) ---
    tabsWithCardsBlock(),
    new Paragraph({ text: '' }),

    new Paragraph({
      children: [new TextRun({
        text: '[authoring note] Sample content generated from the "Celebrate Local — Aurora, IL" '
          + 'demo artifact. Swap event photos for real DAM assets and confirm venue/date/price '
          + 'accuracy before publishing — see docs/04 and docs/09 checklists.',
        italics: true,
      })],
    }),
  ];

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  const outDir = '../../content/aurora-il';
  await mkdir(outDir, { recursive: true });
  await writeFile(`${outDir}/celebrations.docx`, buffer);
  console.log(`Written -> ${outDir}/celebrations.docx`);
}

build();
