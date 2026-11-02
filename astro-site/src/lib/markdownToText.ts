/**
 * Minimal Markdown → plain-text conversion for the "copy as text" feature.
 * Not a full CommonMark renderer: it normalizes the constructs this blog
 * actually uses (headings, emphasis, links, code, lists, blockquotes,
 * thematic breaks) into readable plain text. Front matter must be removed
 * before calling.
 */
export function markdownToPlainText(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inCodeFence = false;
  let inFrontMatter = false;
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length > 0) {
      out.push(
        paragraph
          .join(' ')
          .replace(/[ \t]{2,}/g, ' ')
          .trim()
      );
      paragraph = [];
    }
  };

  const inline = (text: string): string =>
    text
      // images: alt text only
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // links: keep the label
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // reference-style links and footnotes: keep the label
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
      // inline code / strikethrough / emphasis markers
      .replace(/`([^`]*)`/g, '$1')
      .replace(/~~([^~]*)~~/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)([^*_]*?)\1/g, '$2');

  for (const raw of lines) {
    const line = raw;

    if (inFrontMatter) {
      if (line.trim() === '---') inFrontMatter = false;
      continue;
    }
    if (line.trim() === '---' && out.length === 0 && paragraph.length === 0) {
      inFrontMatter = true;
      continue;
    }

    const fence = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      flush();
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) {
      out.push(line.replace(/^[ \t]{4}/, ''));
      continue;
    }

    const trimmed = line.trim();

    if (trimmed === '') {
      flush();
      continue;
    }

    // thematic break
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flush();
      continue;
    }

    // heading
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flush();
      out.push(inline(heading[2]));
      continue;
    }

    // blockquote
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      paragraph.push(`> ${inline(quote[1])}`.trimEnd());
      continue;
    }

    // unordered list item
    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      paragraph.push(`• ${inline(ul[1])}`);
      continue;
    }

    // ordered list item
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      paragraph.push(inline(ol[1]));
      continue;
    }

    paragraph.push(inline(trimmed));
  }

  flush();
  return (
    out
      .filter((l) => l !== '')
      .join('\n\n')
      .trim() + '\n'
  );
}
