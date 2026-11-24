import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Checkbox } from './checkbox';

describe('Checkbox component', () => {
  it('renders with inline-flex and size-4 so the root span does not collapse', () => {
    const html = renderToStaticMarkup(
      React.createElement(Checkbox, { checked: false })
    );

    // Must be rendered with role="checkbox"
    expect(html).toContain('role="checkbox"');
    // Must contain inline-flex and size-4 so it has fixed 16x16 dimensions
    expect(html).toContain('inline-flex');
    expect(html).toContain('size-4');
  });

  it('renders checkmark indicator when checked', () => {
    const html = renderToStaticMarkup(
      React.createElement(Checkbox, { checked: true })
    );

    expect(html).toContain('data-slot="checkbox-indicator"');
  });
});
