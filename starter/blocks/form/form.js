/**
 * Form — AEM Core equivalent: Form Container, Form Text, Form Options, Form Button, Form Hidden.
 * EDS convention: one "form" block covers the whole Core Components form family via a single
 * authored table, rather than one block per field type.
 *
 * Authoring row shape: Label | Type | Name | Options/Placeholder | Required
 * Type one of: text, email, textarea, select, checkbox, radio, hidden, submit
 * Submission goes to a serverless endpoint — never embed secrets client-side (see docs/14).
 */
function readRows(block) {
  return [...block.children].map((row) => [...row.children].map((c) => c.textContent.trim()));
}

function buildField([label, type, name, optionsOrPlaceholder, required]) {
  const wrapper = document.createElement('div');
  wrapper.className = `form-field form-field-${type || 'text'}`;
  const isRequired = /true|yes/i.test(required || '');

  if (type === 'hidden') {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = optionsOrPlaceholder || '';
    wrapper.append(input);
    return wrapper;
  }

  if (type === 'submit') {
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'button button-primary';
    btn.textContent = label || 'Submit';
    wrapper.append(btn);
    return wrapper;
  }

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.htmlFor = name;
  wrapper.append(labelEl);

  if (type === 'textarea') {
    const ta = document.createElement('textarea');
    ta.id = name; ta.name = name; ta.required = isRequired;
    ta.placeholder = optionsOrPlaceholder || '';
    wrapper.append(ta);
  } else if (type === 'select') {
    const select = document.createElement('select');
    select.id = name; select.name = name; select.required = isRequired;
    (optionsOrPlaceholder || '').split(';').map((o) => o.trim()).filter(Boolean).forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o; opt.textContent = o;
      select.append(opt);
    });
    wrapper.append(select);
  } else if (type === 'checkbox' || type === 'radio') {
    wrapper.textContent = '';
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = label;
    fieldset.append(legend);
    (optionsOrPlaceholder || '').split(';').map((o) => o.trim()).filter(Boolean).forEach((o, i) => {
      const id = `${name}-${i}`;
      const input = document.createElement('input');
      input.type = type; input.id = id; input.name = name; input.value = o;
      const lbl = document.createElement('label');
      lbl.htmlFor = id; lbl.textContent = o;
      fieldset.append(input, lbl);
    });
    wrapper.append(fieldset);
  } else {
    const input = document.createElement('input');
    input.type = type || 'text';
    input.id = name; input.name = name; input.required = isRequired;
    input.placeholder = optionsOrPlaceholder || '';
    wrapper.append(input);
  }

  return wrapper;
}

export default function decorate(block) {
  const rows = readRows(block);
  const endpoint = block.dataset.endpoint || '';
  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'form-container';
  rows.forEach((row) => form.append(buildField(row)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!endpoint) { console.warn('No form endpoint configured (data-endpoint)'); return; }
    const data = new FormData(form);
    await fetch(endpoint, { method: 'POST', body: data });
    form.dispatchEvent(new CustomEvent('form:submitted', { bubbles: true }));
  });

  block.append(form);
}
