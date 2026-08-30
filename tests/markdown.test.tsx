import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SafeMarkdown } from '../components/markdown';

describe('SafeMarkdown', () => {
  it('does not execute or render raw HTML', () => {
    const html = renderToStaticMarkup(
      <SafeMarkdown>
        {'# Safe\n<script>alert(1)</script>\n[bad](javascript:alert(1))'}
      </SafeMarkdown>,
    );
    expect(html).toContain('<h1>Safe</h1>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('javascript:');
  });
});
