/**
 * Button — AEM Core equivalent: Button component.
 * Authoring: a single link (optionally wrapped in em/strong for style variant), one per row for groups.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (!link) return;
    link.classList.add('button');
    if (row.querySelector('strong')) link.classList.add('button-primary');
    else if (row.querySelector('em')) link.classList.add('button-secondary');
    else link.classList.add('button-tertiary');
    row.replaceWith(link);
  });
  if (block.children.length > 1) block.classList.add('button-group');
}
