# 06 · Universal Editor Configuration

Universal Editor gives authors a WYSIWYG layer over the same Markdown/doc source. It needs two config files per block plus a top-level definition.

## `component-definition.json` (which blocks are offered, and where)

```json
{
  "groups": [
    {
      "title": "Layout",
      "id": "layout",
      "components": [
        { "title": "Hero", "id": "hero", "plugins": { "xwalk": { "page": { "resourceType": "core/franklin/components/block/v1/block", "template": { "name": "Hero", "model": "hero" } } } } }
      ]
    }
  ]
}
```

## `component-models.json` (the authoring form for each block)

```json
{
  "id": "hero",
  "fields": [
    { "component": "reference", "valueType": "string", "name": "image", "label": "Image" },
    { "component": "text", "valueType": "string", "name": "heading", "label": "Heading" },
    { "component": "richtext", "valueType": "string", "name": "text", "label": "Body" },
    { "component": "aem-content", "valueType": "string", "name": "ctaLink", "label": "CTA link" }
  ]
}
```

## `component-filters.json` — nesting rules

Constrain what can be dropped inside a section or another block (e.g., prevent a `hero` being nested inside `cards`) to keep the content model from doc 05 actually enforceable in the editor, not just documented.

## Preview fidelity

Universal Editor renders using the same `scripts/aem.js` + block CSS/JS as production — there is no separate "editor preview" renderer to maintain. The main integration risk is blocks that assume final decorated DOM shape when the editor shows an intermediate authoring DOM; test blocks in the editor, not just in `aem up`.

## Checklist
- [ ] Every block in the catalog (doc 04) has a matching model + definition entry — no "code-only" blocks authors can't discover.
- [ ] Field labels reviewed by content team, not just engineers (they're end-user-facing).
- [ ] Filters configured so invalid nesting is prevented at authoring time, not caught later in QA.
- [ ] Editor smoke-tested against a real content source (SharePoint/GDrive/da.live), not just local HTML fixtures.
