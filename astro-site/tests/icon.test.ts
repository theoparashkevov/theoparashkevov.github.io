import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import Icon from '../src/components/Icon.astro';

describe('Icon.astro', () => {
  let container: AstroContainer;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renders a decorative, aria-hidden SVG without a label', async () => {
    const html = await container.renderToString(Icon, { props: { name: 'github' } });
    expect(html).toMatch(/^\s*<svg[\s>]/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain('aria-label');
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
    expect(html).toContain('<path');
  });

  it('renders an accessible image when a label is given', async () => {
    const html = await container.renderToString(Icon, {
      props: { name: 'rss', label: 'RSS feed', size: 32, class: 'text-accent' },
    });
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="RSS feed"');
    expect(html).not.toContain('aria-hidden');
    expect(html).toContain('width="32"');
    expect(html).toContain('class="text-accent"');
  });

  it('renders different markup for different icons', async () => {
    const sun = await container.renderToString(Icon, { props: { name: 'sun' } });
    const moon = await container.renderToString(Icon, { props: { name: 'moon' } });
    expect(sun).not.toBe(moon);
  });
});
