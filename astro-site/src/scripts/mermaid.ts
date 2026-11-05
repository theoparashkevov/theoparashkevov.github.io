import type { Mermaid, MermaidConfig } from 'mermaid';

const ROOT_SELECTOR = '.prose-article';
const BLOCK_SELECTOR = 'pre > code.language-mermaid';

interface Diagram {
  source: string;
  canvas: HTMLElement;
  fallback: HTMLElement;
}

let diagrams: Diagram[] = [];
let themeObserver: MutationObserver | undefined;
let mermaidPromise: Promise<Mermaid> | undefined;
let renderToken = 0;
let idCounter = 0;

function loadMermaid(): Promise<Mermaid> {
  mermaidPromise ??= import('mermaid').then((module) => module.default);
  return mermaidPromise;
}

function themeConfig(): MermaidConfig {
  const styles = getComputedStyle(document.documentElement);
  const color = (name: string) => styles.getPropertyValue(name).trim();
  const fontFamily = styles.getPropertyValue('--font-sans').trim() || 'sans-serif';
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily,
    themeVariables: {
      darkMode: document.documentElement.classList.contains('dark'),
      fontFamily,
      fontSize: '15px',
      background: color('--surface'),
      primaryColor: color('--surface-2'),
      primaryTextColor: color('--fg'),
      primaryBorderColor: color('--accent'),
      secondaryColor: color('--accent-soft'),
      tertiaryColor: color('--surface'),
      lineColor: color('--fg-muted'),
      textColor: color('--fg'),
      clusterBkg: color('--surface'),
      clusterBorder: color('--border'),
      edgeLabelBackground: color('--surface'),
    },
  };
}

function wrap(pre: HTMLElement, source: string): Diagram {
  const figure = document.createElement('figure');
  figure.className = 'mermaid-diagram not-prose';
  const canvas = document.createElement('div');
  canvas.className = 'mermaid-canvas';
  canvas.hidden = true;
  pre.replaceWith(figure);
  figure.append(canvas, pre);
  return { source, canvas, fallback: pre };
}

async function renderAll() {
  const token = ++renderToken;
  if (!diagrams.length) return;

  const mermaid = await loadMermaid();
  await document.fonts?.ready;
  if (token !== renderToken) return;

  mermaid.initialize(themeConfig());
  for (const diagram of diagrams) {
    try {
      const { svg } = await mermaid.render(`mermaid-diagram-${++idCounter}`, diagram.source);
      if (token !== renderToken) return;
      diagram.canvas.innerHTML = svg;
      diagram.canvas.hidden = false;
      diagram.fallback.hidden = true;
    } catch (error) {
      console.error('Mermaid diagram failed to render', error);
      diagram.canvas.hidden = true;
      diagram.fallback.hidden = false;
    }
  }
}

/** Replaces every ```mermaid block in the article with a rendered diagram. */
export function initMermaid() {
  const root = document.querySelector(ROOT_SELECTOR);
  if (!root) return;

  const blocks = Array.from(root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));
  diagrams = blocks.flatMap((code) => {
    const pre = code.parentElement;
    const source = code.textContent?.trim();
    return pre && source ? [wrap(pre, source)] : [];
  });
  if (!diagrams.length) return;

  themeObserver = new MutationObserver(() => void renderAll());
  themeObserver.observe(document.documentElement, { attributeFilter: ['class'] });
  void renderAll();
}

export function teardownMermaid() {
  renderToken++;
  themeObserver?.disconnect();
  themeObserver = undefined;
  diagrams = [];
}
