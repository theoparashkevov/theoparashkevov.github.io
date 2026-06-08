/**
 * Code Side Panel
 * Adds a clickable trigger button before each code block in blog posts.
 * Clicking the button opens a side panel (slides from right to left)
 * with a dark overlay backdrop, showing the code with syntax highlighting
 * and a copy-to-clipboard button.
 */
(function() {
  'use strict';

  let panelOpen = false;
  let currentTrigger = null;
  let overlay = null;
  let panel = null;
  let lastFocusedElement = null;

  /**
   * Initialize the code panel system
   */
  function init() {
    // Only run on pages with post content
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    // Find all code blocks
    const codeBlocks = postContent.querySelectorAll('pre > code');
    if (codeBlocks.length === 0) return;

    // Create the panel and overlay (singleton)
    createPanelElements();

    // Add trigger buttons to each code block
    codeBlocks.forEach((codeBlock, index) => {
      const pre = codeBlock.parentElement;
      addTriggerButton(pre, codeBlock, index);
    });
  }

  /**
   * Create the panel and overlay DOM elements
   */
  function createPanelElements() {
    // Create overlay
    overlay = document.createElement('div');
    overlay.className = 'code-panel-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    // Create panel
    panel = document.createElement('div');
    panel.className = 'code-side-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'code-panel-title');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="panel-header">
        <h3 id="code-panel-title" class="panel-title">Code</h3>
        <div class="panel-actions">
          <button type="button" class="copy-btn" aria-label="Copy code to clipboard">
            <span class="copy-icon">📄</span>
            <span class="copy-text">Copy</span>
          </button>
          <button type="button" class="close-btn" aria-label="Close code panel">×</button>
        </div>
      </div>
      <div class="panel-body" id="code-panel-content"></div>
    `;
    document.body.appendChild(panel);

    // Attach event listeners
    overlay.addEventListener('click', closePanel);
    panel.querySelector('.close-btn').addEventListener('click', closePanel);
    panel.querySelector('.copy-btn').addEventListener('click', copyCode);

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && panelOpen) {
        closePanel();
      }
    });
  }

  /**
   * Add a trigger button before a code block
   */
  function addTriggerButton(pre, codeBlock, index) {
    // Determine a label for the code
    const language = detectLanguage(codeBlock);
    const codeText = codeBlock.textContent || '';
    const lineCount = codeText.split('\n').length;
    const label = language
      ? `View code (${language})`
      : `View code`;

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'code-trigger';
    trigger.textContent = label;
    trigger.setAttribute('aria-label', `Open code panel: ${label}`);

    // Get a descriptive title from the closest heading or use generic
    const title = findNearbyHeading(pre) || `Code Snippet #${index + 1}`;
    trigger.setAttribute('data-panel-title', title);
    trigger.setAttribute('data-code-index', index);

    // Store the original code element
    pre.setAttribute('data-original-code', '');

    // Insert trigger before the pre element
    pre.parentNode.insertBefore(trigger, pre);

    // Attach click handler
    trigger.addEventListener('click', function() {
      openPanel(codeBlock, trigger, title);
    });
  }

  /**
   * Detect the programming language from a code block
   */
  function detectLanguage(codeBlock) {
    // Check class names that Jekyll/Rouge adds
    const classes = codeBlock.className || '';
    const langMatch = classes.match(/language-(\w+)/);
    if (langMatch) {
      return langMatch[1].toUpperCase();
    }

    // Check for highlight class
    const highlightMatch = classes.match(/highlight-(\w+)/);
    if (highlightMatch) {
      return highlightMatch[1].toUpperCase();
    }

    // Check parent highlight class
    const parent = codeBlock.closest('.highlight');
    if (parent) {
      const parentClasses = parent.className || '';
      const parentLangMatch = parentClasses.match(/language-(\w+)/);
      if (parentLangMatch) {
        return parentLangMatch[1].toUpperCase();
      }
    }

    return null;
  }

  /**
   * Find a nearby heading to use as a descriptive title
   */
  function findNearbyHeading(element) {
    // Look for the previous heading in the article
    let current = element;
    while (current && current !== document.body) {
      // Check previous siblings
      let sibling = current.previousElementSibling;
      let searchCount = 0;
      while (sibling && searchCount < 10) {
        if (sibling.tagName && /^H[1-6]$/.test(sibling.tagName)) {
          return sibling.textContent.trim();
        }
        // Also check inside the sibling for headings
        const heading = sibling.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          return heading.textContent.trim();
        }
        sibling = sibling.previousElementSibling;
        searchCount++;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Open the side panel with code content
   */
  function openPanel(codeBlock, trigger, title) {
    if (panelOpen) {
      closePanel();
    }

    // Store reference to trigger for focus restoration
    lastFocusedElement = trigger;
    currentTrigger = trigger;

    // Clone the code block's content (preserves syntax highlighting)
    const panelContent = panel.querySelector('#code-panel-content');
    panelContent.innerHTML = '';

    // Deep clone the pre/code element
    const clonedCode = codeBlock.parentElement.cloneNode(true);
    panelContent.appendChild(clonedCode);

    // Update panel title
    const titleElement = panel.querySelector('.panel-title');
    titleElement.textContent = title;

    // Show overlay and panel
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('panel-open');
    panelOpen = true;

    // Reset copy button state
    resetCopyButton();

    // Focus the close button for accessibility
    setTimeout(function() {
      panel.querySelector('.close-btn').focus();
    }, 100);
  }

  /**
   * Close the side panel
   */
  function closePanel() {
    if (!panelOpen) return;

    // Hide overlay and panel
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('panel-open');
    panelOpen = false;

    // Return focus to the trigger button
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }

    currentTrigger = null;
  }

  /**
   * Copy code content to clipboard
   */
  function copyCode() {
    const panelContent = panel.querySelector('#code-panel-content');
    const codeElement = panelContent.querySelector('code') || panelContent.querySelector('pre');

    if (!codeElement) return;

    // Get the raw text content
    const codeText = codeElement.textContent || '';

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(codeText).then(function() {
        showCopySuccess();
      }).catch(function() {
        // Fallback if clipboard API fails
        fallbackCopy(codeText);
      });
    } else {
      // Fallback for older browsers
      fallbackCopy(codeText);
    }
  }

  /**
   * Fallback copy method using textarea
   */
  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, text.length);

    try {
      document.execCommand('copy');
      showCopySuccess();
    } catch (err) {
      console.error('Failed to copy code:', err);
    }

    document.body.removeChild(textarea);
  }

  /**
   * Show success feedback on copy button
   */
  function showCopySuccess() {
    const copyBtn = panel.querySelector('.copy-btn');
    const copyText = copyBtn.querySelector('.copy-text');
    const copyIcon = copyBtn.querySelector('.copy-icon');

    copyBtn.classList.add('copied');
    copyText.textContent = 'Copied!';
    copyIcon.textContent = '✓';

    // Reset after 2 seconds
    setTimeout(function() {
      resetCopyButton();
    }, 2000);
  }

  /**
   * Reset the copy button to its default state
   */
  function resetCopyButton() {
    if (!panel) return;
    const copyBtn = panel.querySelector('.copy-btn');
    if (!copyBtn) return;
    const copyText = copyBtn.querySelector('.copy-text');
    const copyIcon = copyBtn.querySelector('.copy-icon');

    copyBtn.classList.remove('copied');
    copyText.textContent = 'Copy';
    copyIcon.textContent = '📄';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    init();
  }
})();
