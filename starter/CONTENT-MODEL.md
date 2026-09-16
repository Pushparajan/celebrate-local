# Content Model (example — replace per site)

## Template: Article
Required blocks: Hero, Metadata
Optional blocks: Cards, Accordion, Fragment
Metadata fields: Title, Description, Image, Template=article, PublishDate, Author

## Template: Landing
Required blocks: Hero, Metadata
Optional blocks: Cards, Accordion, Columns
Metadata fields: Title, Description, Image, Template=landing

## Template: Listing
Required blocks: Title, Breadcrumb, Search, Tabs (each tab panel nests a Cards block)
Optional blocks: Fragment
Metadata fields: Title, Description, Template=listing
Example: `content/aurora-il/celebrations.docx` — a category-tabbed event listing built with
`tools/migration/build-celebrations-docx.mjs`, demonstrating block nesting (Cards inside
Tabs) per the nesting rules in `component-filters.json` (docs/06).

See docs/05-content-model-patterns.md for the full pattern this implements.
