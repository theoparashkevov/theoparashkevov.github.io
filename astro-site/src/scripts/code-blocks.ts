const ROOT_SELECTOR = '.prose-article';
const PRE_SELECTOR = 'pre.astro-code';
const COPY_RESET_MS = 2000;

const LANGUAGE_NAMES: Record<string, string> = {
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  shellscript: 'Shell',
  zsh: 'Zsh',
  fish: 'Fish',
  console: 'Console',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  bat: 'Batch',
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  json: 'JSON',
  jsonc: 'JSONC',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  ini: 'INI',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  md: 'Markdown',
  markdown: 'Markdown',
  mdx: 'MDX',
  astro: 'Astro',
  vue: 'Vue',
  svelte: 'Svelte',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  ruby: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  rust: 'Rust',
  java: 'Java',
  kt: 'Kotlin',
  kotlin: 'Kotlin',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  csharp: 'C#',
  php: 'PHP',
  sql: 'SQL',
  graphql: 'GraphQL',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  makefile: 'Makefile',
  make: 'Makefile',
  nginx: 'Nginx',
  diff: 'Diff',
  latex: 'LaTeX',
  tex: 'TeX',
  r: 'R',
  lua: 'Lua',
  swift: 'Swift',
  dart: 'Dart',
  matlab: 'MATLAB',
  plaintext: 'Text',
  text: 'Text',
  txt: 'Text',
  plain: 'Text',
};

type IconName = 'copy' | 'check' | 'maximize';

const copyTimers = new WeakMap<HTMLButtonElement, number>();
let panelTrigger: HTMLElement | null = null;
let panelSource: HTMLPreElement | null = null;

function languageLabel(lang: string | undefined): string {
  const key = (lang ?? '').trim().toLowerCase();
  if (!key) return 'Code';
  return LANGUAGE_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function icon(name: IconName): SVGElement | null {
  const template = document.querySelector<HTMLTemplateElement>(`template[data-cb-icon="${name}"]`);
  const svg = template?.content.firstElementChild;
  return svg ? (svg.cloneNode(true) as SVGElement) : null;
}

function setButtonContent(button: HTMLButtonElement, iconName: IconName, text: string) {
  const svg = icon(iconName);
  const label = document.createElement('span');
  label.className = 'cb-btn-text';
  label.textContent = text;
  button.replaceChildren(...(svg ? [svg] : []), label);
}

function createButton(kind: 'copy' | 'expand', ariaLabel: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `cb-btn cb-btn-${kind} press`;
  button.setAttribute('aria-label', ariaLabel);
  button.dataset.cbAction = kind;
  if (kind === 'copy') setButtonContent(button, 'copy', 'Copy');
  else setButtonContent(button, 'maximize', 'Expand');
  return button;
}

function codeText(pre: HTMLPreElement): string {
  const code = pre.querySelector('code') ?? pre;
  return (code.textContent ?? '').replace(/\n$/, '');
}

function announce(message: string) {
  const live = document.getElementById('cb-live');
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => {
    live.textContent = message;
  }, 50);
}

function fallbackCopy(text: string): boolean {
  const active = document.activeElement as HTMLElement | null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.inset = '0 auto auto 0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  const host = document.querySelector<HTMLDialogElement>('dialog.cb-panel[open]') ?? document.body;
  host.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  textarea.remove();
  active?.focus({ preventScroll: true });
  return ok;
}

async function writeClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

async function copyFrom(button: HTMLButtonElement, pre: HTMLPreElement) {
  const ok = await writeClipboard(codeText(pre));
  const previous = copyTimers.get(button);
  if (previous) window.clearTimeout(previous);

  if (ok) {
    button.classList.add('is-copied');
    setButtonContent(button, 'check', 'Copied');
    announce('Code copied to clipboard');
  } else {
    setButtonContent(button, 'copy', 'Failed');
    announce('Copy failed. Select the code and copy it manually.');
  }

  copyTimers.set(
    button,
    window.setTimeout(() => {
      button.classList.remove('is-copied');
      setButtonContent(button, 'copy', 'Copy');
      copyTimers.delete(button);
    }, COPY_RESET_MS)
  );
}

function headingFor(pre: Element, root: Element): string | null {
  const headings = root.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4, h5, h6');
  let match: HTMLHeadingElement | null = null;
  for (const heading of headings) {
    if (heading.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING) match = heading;
    else break;
  }
  const text = match?.textContent?.replace(/\s+/g, ' ').trim();
  return text || null;
}

function getPanel(): HTMLDialogElement | null {
  return document.querySelector<HTMLDialogElement>('dialog.cb-panel');
}

function openPanel(pre: HTMLPreElement, trigger: HTMLElement, title: string, language: string) {
  const panel = getPanel();
  if (!panel || typeof panel.showModal !== 'function') return;

  const titleEl = panel.querySelector<HTMLElement>('.cb-panel-title');
  const langEl = panel.querySelector<HTMLElement>('.cb-panel-lang');
  const body = panel.querySelector<HTMLElement>('.cb-panel-body');
  const copyBtn = panel.querySelector<HTMLButtonElement>('.cb-btn-copy');
  if (!titleEl || !body) return;

  const clone = pre.cloneNode(true) as HTMLPreElement;
  clone.removeAttribute('data-cb-enhanced');
  clone.removeAttribute('id');
  clone.setAttribute('tabindex', '0');
  clone.setAttribute('aria-label', `${language} code`);
  body.replaceChildren(clone);
  titleEl.textContent = title;
  if (langEl) langEl.textContent = language;

  if (copyBtn) {
    const timer = copyTimers.get(copyBtn);
    if (timer) window.clearTimeout(timer);
    copyTimers.delete(copyBtn);
    copyBtn.classList.remove('is-copied');
    setButtonContent(copyBtn, 'copy', 'Copy');
  }

  panelTrigger = trigger;
  panelSource = clone;
  trigger.setAttribute('aria-expanded', 'true');
  panel.showModal();
  panel.querySelector<HTMLElement>('.cb-panel-close')?.focus();
}

function closePanel() {
  const panel = getPanel();
  if (panel?.open) panel.close();
}

function wirePanel(panel: HTMLDialogElement) {
  if (panel.dataset.cbReady === 'true') return;
  panel.dataset.cbReady = 'true';

  panel.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target === panel) {
      const rect = panel.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) closePanel();
      return;
    }
    if (target.closest('.cb-panel-close')) {
      closePanel();
      return;
    }
    const copyBtn = target.closest<HTMLButtonElement>('.cb-btn-copy');
    if (copyBtn && panelSource) void copyFrom(copyBtn, panelSource);
  });

  panel.addEventListener('close', () => {
    const trigger = panelTrigger;
    panelTrigger = null;
    panelSource = null;
    trigger?.setAttribute('aria-expanded', 'false');
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    window.setTimeout(() => {
      if (!panel.open) panel.querySelector('.cb-panel-body')?.replaceChildren();
    }, 400);
  });
}

function enhance(pre: HTMLPreElement, root: Element, index: number) {
  if (pre.dataset.cbEnhanced === 'true') return;
  if (pre.parentElement?.classList.contains('cb')) {
    pre.dataset.cbEnhanced = 'true';
    return;
  }

  const language = languageLabel(pre.dataset.language);
  const title = headingFor(pre, root) ?? `Code snippet ${index + 1}`;

  const figure = document.createElement('div');
  figure.className = 'cb not-prose';

  const header = document.createElement('div');
  header.className = 'cb-header';

  const label = document.createElement('span');
  label.className = 'cb-lang';
  label.textContent = language;

  const actions = document.createElement('div');
  actions.className = 'cb-actions';

  const copyBtn = createButton('copy', `Copy ${language} code`);
  const expandBtn = createButton('expand', `Expand ${language} code in side panel`);
  expandBtn.setAttribute('aria-haspopup', 'dialog');
  expandBtn.setAttribute('aria-expanded', 'false');
  expandBtn.setAttribute('aria-controls', 'cb-panel');

  actions.append(copyBtn, expandBtn);
  header.append(label, actions);

  pre.before(figure);
  figure.append(header, pre);
  pre.dataset.cbEnhanced = 'true';
  if (!pre.hasAttribute('tabindex')) pre.setAttribute('tabindex', '0');
  if (!pre.hasAttribute('aria-label')) pre.setAttribute('aria-label', `${language} code`);

  copyBtn.addEventListener('click', () => void copyFrom(copyBtn, pre));
  expandBtn.addEventListener('click', () => openPanel(pre, expandBtn, title, language));
}

export function initCodeBlocks() {
  const panel = getPanel();
  if (panel) wirePanel(panel);

  document.querySelectorAll<HTMLElement>(ROOT_SELECTOR).forEach((root) => {
    root
      .querySelectorAll<HTMLPreElement>(PRE_SELECTOR)
      .forEach((pre, index) => enhance(pre, root, index));
  });
}

export function teardownCodeBlocks() {
  closePanel();
}
